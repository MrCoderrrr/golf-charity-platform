const mongoose = require("mongoose");

const Draw = require("../models/draw.model");
const Score = require("../models/score.model");
const Winner = require("../models/winner.model");
const Subscription = require("../models/subscription.model");
const PrizePool = require("../models/prizePool.model");
const DrawEntry = require("../models/drawEntry.model");
const Donation = require("../models/donation.model");
const Transaction = require("../models/transaction.model");
const Charity = require("../models/charity.model");
const User = require("../models/user.model");
const AuditLog = require("../models/auditLog.model");
const { serializeWinner } = require("../utils/winnerLifecycle");

const DAYS_30_MS = 30 * 24 * 60 * 60 * 1000;
const PRIZE_POOL_SHARE = (() => {
  const raw = Number(process.env.PRIZE_POOL_SHARE);
  if (!Number.isFinite(raw)) return 0.7;
  // 0.0 - 1.0
  return Math.min(1, Math.max(0, raw));
})();

const parseDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
};

const monthKeyUTC = (date) => {
  const y = String(date.getUTCFullYear());
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

const clampDonationPct = (pct) => {
  const n = Number(pct);
  if (!Number.isFinite(n)) return 10;
  return Math.min(100, Math.max(10, n));
};

const tierForMatchCount = (matchCount) => {
  if (matchCount === 5) return "grand_legacy";
  if (matchCount === 4) return "prestige";
  return "impact";
};

const generateUniqueNumbers = () => {
  const set = new Set();
  while (set.size < 5) set.add(Math.floor(Math.random() * 45) + 1);
  return Array.from(set);
};

const generateWeightedNumbers = async (session) => {
  const freq = await Score.aggregate([
    { $group: { _id: "$score", count: { $sum: 1 } } },
  ]).session(session || null);

  const weights = [];
  for (const f of freq) weights.push({ num: f._id, weight: f.count });
  for (let i = 1; i <= 45; i++) {
    if (!weights.find((w) => w.num === i)) weights.push({ num: i, weight: 1 });
  }

  const pick = () => {
    const total = weights.reduce((s, w) => s + w.weight, 0);
    let r = Math.random() * total;
    for (const w of weights) {
      r -= w.weight;
      if (r <= 0) return w.num;
    }
    return weights[0].num;
  };

  const set = new Set();
  while (set.size < 5) set.add(pick());
  return Array.from(set);
};

const countMatches = (scoreSnapshots, drawNumbers) => {
  const userSet = new Set((scoreSnapshots || []).map((s) => s.score));
  let matches = 0;
  for (const n of drawNumbers) if (userSet.has(n)) matches++;
  return matches;
};

const splitEvenly = (total, winners) => {
  if (!winners || winners <= 0) return [];
  const base = Math.floor(total / winners);
  const remainder = total - base * winners;
  return Array.from({ length: winners }).map((_, i) => base + (i < remainder ? 1 : 0));
};

const toMoney = (n) => Math.max(0, Math.round(Number(n) || 0));

const getOrCreateUnassignedCharity = async (session) => {
  const name = "Unassigned Giving Pool";
  const existing = await Charity.findOne({ name }).session(session || null);
  if (existing) return existing;
  const created = await Charity.create(
    [
      {
        name,
        description: "Fallback charity used when a user has not selected one yet.",
        icon: "star",
        goalAmount: 0,
      },
    ],
    { session }
  );
  return created[0];
};

const withOptionalTransaction = async (fn) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await fn(session);
    await session.commitTransaction();
    return result;
  } catch (err) {
    try {
      await session.abortTransaction();
    } catch {
      /* ignore */
    }

    // If transactions are not supported (standalone Mongo), run once without them.
    const msg = String(err?.message || "");
    if (msg.includes("Transaction numbers are only allowed") || msg.includes("replica set")) {
      return fn(null);
    }

    throw err;
  } finally {
    session.endSession();
  }
};

exports.runDraw = async (req, res) => {
  try {
    const actorUserId = req.user?._id || null;
    const drawDate = parseDate(req.body?.drawDate) || new Date();
    const type = req.body?.type === "algorithm" ? "algorithm" : "random";

    const month = Number(req.body?.month) || drawDate.getUTCMonth() + 1;
    const year = Number(req.body?.year) || drawDate.getUTCFullYear();

    const result = await withOptionalTransaction(async (session) => {
      // If multiple draws exist in the same month, pick the earliest upcoming for this month/year.
      // If none are upcoming, we fall back to the most recent draw for this month/year.
      const existing =
        (await Draw.findOne({ month, year, status: { $in: ["upcoming", "pending"] } })
          .sort({ drawDate: 1, createdAt: 1 })
          .session(session || null)) ||
        (await Draw.findOne({ month, year, status: { $ne: "cancelled" } })
          .sort({ drawDate: -1, createdAt: -1 })
          .session(session || null));
      if (existing && existing.status === "completed") {
        const e = new Error("Draw already completed for this month/year");
        e.statusCode = 409;
        throw e;
      }
      if (existing && existing.status === "cancelled") {
        const e = new Error("Draw is cancelled for this month/year");
        e.statusCode = 409;
        throw e;
      }

      const drawNumbers =
        type === "algorithm" ? await generateWeightedNumbers(session) : generateUniqueNumbers();

      const draw = existing
        ? await Draw.findByIdAndUpdate(
            existing._id,
            { $set: { type, drawDate, drawNumbers, status: "completed" } },
            { new: true, session }
          )
        : await Draw.create(
            [
              {
                month,
                year,
                type,
                drawDate,
                drawNumbers,
                status: "completed",
              },
            ],
            { session }
          ).then((rows) => rows[0]);

      const lastPool = await PrizePool.findOne().sort({ createdAt: -1 }).session(session || null);
      const rolloverAmount = toMoney(lastPool?.rolloverAmount || 0);
      const rolloverFromDrawId = lastPool?.drawId || null;

      // Active subscriptions (one per user) for this draw window.
      // We use a pipeline to de-dupe duplicates and compute the money split:
      // collected -> charity (min 10%) -> remaining -> prize pool share + platform revenue.
      const subAgg = await Subscription.aggregate([
        {
          $match: {
            status: "active",
            startDate: { $lte: drawDate },
            endDate: { $gte: drawDate },
          },
        },
        { $sort: { createdAt: -1, _id: -1 } },
        { $group: { _id: "$userId", doc: { $first: "$$ROOT" } } },
        { $replaceRoot: { newRoot: "$doc" } },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
        // Skip banned users from pool/entries (their subs still exist but should not participate).
        { $match: { $or: [{ "user.banned": { $ne: true } }, { user: null }] } },
        {
          $addFields: {
            // Effective donation %:
            // - user-level charityPercentage overrides
            // - fallback to subscription donationPercentage
            // - clamp min 10, max 100
            effectiveDonationPct: {
              $min: [
                100,
                {
                  $max: [
                    10,
                    {
                      $ifNull: [
                        "$user.charityPercentage",
                        { $ifNull: ["$donationPercentage", 10] },
                      ],
                    },
                  ],
                },
              ],
            },
          },
        },
        {
          $addFields: {
            donationAmount: {
              $round: [{ $multiply: ["$amount", { $divide: ["$effectiveDonationPct", 100] }] }, 0],
            },
          },
        },
        {
          $addFields: {
            remainingAmount: { $subtract: ["$amount", "$donationAmount"] },
          },
        },
        {
          $addFields: {
            prizePoolPortion: { $round: [{ $multiply: ["$remainingAmount", PRIZE_POOL_SHARE] }, 0] },
          },
        },
        {
          $addFields: {
            platformRevenue: { $subtract: ["$remainingAmount", "$prizePoolPortion"] },
            selectedCharityId: { $ifNull: ["$user.selectedCharity", "$charityId"] },
          },
        },
        {
          $facet: {
            rows: [
              {
                $project: {
                  _id: 1, // subscriptionId
                  userId: 1,
                  amount: 1,
                  donationPercentage: "$effectiveDonationPct",
                  donationAmount: 1,
                  prizePoolPortion: 1,
                  platformRevenue: 1,
                  selectedCharityId: 1,
                  createdAt: 1,
                },
              },
            ],
            totals: [
              {
                $group: {
                  _id: null,
                  subs: { $sum: 1 },
                  collected: { $sum: "$amount" },
                  donation: { $sum: "$donationAmount" },
                  prize: { $sum: "$prizePoolPortion" },
                  revenue: { $sum: "$platformRevenue" },
                },
              },
            ],
          },
        },
      ]).session(session || null);

      const activeSubs = subAgg?.[0]?.rows || [];
      const moneyTotals = subAgg?.[0]?.totals?.[0] || null;

      if (!activeSubs.length) {
        const pool = await PrizePool.create(
          [
            {
              drawId: draw._id,
              totalAmount: rolloverAmount,
              tierPercent: { five: 40, four: 35, three: 25 },
              fiveMatchPool: 0,
              fourMatchPool: 0,
              threeMatchPool: 0,
              rolloverFromDrawId,
              rolloverAmount: rolloverAmount,
            },
          ],
          { session }
        ).then((rows) => rows[0]);

        await AuditLog.create(
          [
            {
              actorUserId,
              action: "draw.run",
              entityType: "Draw",
              entityId: draw._id,
              meta: { month, year, type, note: "No active subscriptions" },
              ip: req.ip,
              userAgent: req.get("user-agent"),
            },
          ],
          { session }
        );

        return { draw, prizePool: pool, entries: 0, winners: 0 };
      }

      const cutoff = new Date(drawDate.getTime() - DAYS_30_MS);

      // If users explicitly "participated" ahead of time (DrawEntry exists for this draw),
      // we only consider those users for eligibility/entries. Otherwise, we fall back to
      // the legacy behavior (auto-enter eligible subscribed users).
      const explicitEntries = await DrawEntry.find({ drawId: draw._id })
        .select("userId")
        .session(session || null);

      const explicitUserIdSet = new Set(explicitEntries.map((e) => String(e.userId)));
      const activeUserIds = activeSubs
        .map((s) => s.userId)
        .filter((id) => (explicitUserIdSet.size ? explicitUserIdSet.has(String(id)) : true));

      const eligibleAgg = await Score.aggregate([
        { $match: { userId: { $in: activeUserIds }, date: { $gte: cutoff } } },
        { $sort: { date: -1, _id: -1 } },
        {
          $group: {
            _id: "$userId",
            count: { $sum: 1 },
            scores: { $push: { score: "$score", playedAt: "$date" } },
          },
        },
        { $match: { count: { $gte: 5 } } },
        { $project: { count: 1, scores: { $slice: ["$scores", 5] } } },
      ]).session(session || null);

      const eligibleUserIdStrings = new Set(eligibleAgg.map((r) => String(r._id)));
      const eligibleSubs = activeSubs.filter((s) => {
        const ok = eligibleUserIdStrings.has(String(s.userId));
        if (!ok) return false;
        if (!explicitUserIdSet.size) return true;
        return explicitUserIdSet.has(String(s.userId));
      });
      const scoreByUserId = new Map(eligibleAgg.map((r) => [String(r._id), r]));

      // Prize pool is funded by ALL active subscriptions, even if a user is not eligible to win.
      const prizePoolBaseTotal = toMoney(
        activeSubs.reduce((sum, s) => sum + toMoney(s.prizePoolPortion || 0), 0)
      );
      const collectedTotal = toMoney(moneyTotals?.collected || activeSubs.reduce((sum, s) => sum + toMoney(s.amount || 0), 0));
      const donationTotal = 0;
      const platformRevenueTotal = Math.max(0, collectedTotal);

      const entryDocs = [];

      // Create draw entries only for eligible users (>= 5 scores in last 30 days).
      for (const sub of eligibleSubs) {
        const scoreRow = scoreByUserId.get(String(sub.userId));
        entryDocs.push({
          drawId: draw._id,
          userId: sub.userId,
          subscriptionId: sub._id,
          selectedCharityId: sub.selectedCharityId || null,
          donationPercentage: clampDonationPct(sub.donationPercentage),
          scoresSnapshot: scoreRow?.scores || [],
          eligibleAt: drawDate,
        });
      }

      const totalAmount = prizePoolBaseTotal + rolloverAmount;
      const fivePool = Math.floor(totalAmount * 0.4);
      const fourPool = Math.floor(totalAmount * 0.35);
      const threePool = Math.max(0, totalAmount - fivePool - fourPool);

      // Use upsert to keep the draw-run operation resilient if it is retried after a partial failure,
      // and to guarantee we never violate the unique (drawId, userId) index.
      if (entryDocs.length) {
        const ops = entryDocs.map((doc) => ({
          updateOne: {
            filter: { drawId: doc.drawId, userId: doc.userId },
            update: { $set: doc },
            upsert: true,
          },
        }));
        await DrawEntry.bulkWrite(ops, { session });
      }

      const createdEntries = entryDocs.length
        ? await DrawEntry.find({ drawId: draw._id, userId: { $in: entryDocs.map((d) => d.userId) } }).session(
            session || null
          )
        : [];

      const winnersByTier = { 5: [], 4: [], 3: [] };
      for (const e of createdEntries) {
        const matchCount = countMatches(e.scoresSnapshot, drawNumbers);
        if (matchCount === 5) winnersByTier[5].push(e);
        else if (matchCount === 4) winnersByTier[4].push(e);
        else if (matchCount === 3) winnersByTier[3].push(e);
      }

      const jackpotWon = winnersByTier[5].length > 0;
      const fivePayouts = jackpotWon ? splitEvenly(fivePool, winnersByTier[5].length) : [];
      const fourPayouts = winnersByTier[4].length ? splitEvenly(fourPool, winnersByTier[4].length) : [];
      const threePayouts = winnersByTier[3].length ? splitEvenly(threePool, winnersByTier[3].length) : [];

      const winnerDocs = [];
      const payoutTxDocs = [];

      const pushWinners = (entries, payouts, matchCount) => {
        for (let i = 0; i < entries.length; i++) {
          const entry = entries[i];
          const provisionalPrizeAmount = toMoney(payouts[i] || 0);
          if (provisionalPrizeAmount <= 0) continue;

          winnerDocs.push({
            userId: entry.userId,
            drawId: draw._id,
            matchCount,
            tier: tierForMatchCount(matchCount),
            scoresSnapshot: entry.scoresSnapshot || [],
            provisionalPrizeAmount,
            finalPrizeAmount: 0,
            prizeAmount: 0,
            paymentState: "pending",
            reviewStatus: "pending",
            status: "pending",
          });
        }
      };

      pushWinners(winnersByTier[5], fivePayouts, 5);
      pushWinners(winnersByTier[4], fourPayouts, 4);
      pushWinners(winnersByTier[3], threePayouts, 3);

      const createdWinners = winnerDocs.length
        ? await Winner.insertMany(winnerDocs, { session })
        : [];

      for (const w of createdWinners) {
        payoutTxDocs.push({
          userId: w.userId,
          type: "payout",
          amount: w.provisionalPrizeAmount,
          currency: "USD",
          status: "pending",
          provider: "manual",
          ref: { winnerId: w._id, drawId: draw._id },
        });
      }

      if (payoutTxDocs.length) {
        await Transaction.insertMany(payoutTxDocs, { session });
      }

      const poolDoc = await PrizePool.create(
        [
          {
            drawId: draw._id,
            totalAmount,
            tierPercent: { five: 40, four: 35, three: 25 },
            fiveMatchPool: jackpotWon ? fivePool : 0,
            fourMatchPool: fourPool,
            threeMatchPool: threePool,
            rolloverFromDrawId,
            rolloverAmount: jackpotWon ? 0 : fivePool,
          },
        ],
        { session }
      ).then((rows) => rows[0]);

      await AuditLog.create(
        [
          {
            actorUserId,
            action: "draw.run",
            entityType: "Draw",
            entityId: draw._id,
            meta: {
              month,
              year,
              type,
              eligibleEntries: createdEntries.length,
              winners: createdWinners.length,
              pools: { totalAmount, fivePool, fourPool, threePool, rolloverAmount: jackpotWon ? 0 : fivePool },
              money: {
                collectedTotal,
                donationTotal,
                prizePoolBaseTotal,
                platformRevenueTotal,
                prizePoolShare: PRIZE_POOL_SHARE,
              },
            },
            ip: req.ip,
            userAgent: req.get("user-agent"),
          },
        ],
        { session }
      );

      return {
        draw,
        prizePool: poolDoc,
        entries: createdEntries.length,
        winners: createdWinners.length,
      };
    });

    res.status(201).json(result);
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ message: err.message });
  }
};

// User: participate/enter an upcoming draw.
// Creates a DrawEntry record (unique per drawId+userId). Eligibility is enforced at entry-time.
exports.participateInDraw = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Not authorized" });

    const draw = await Draw.findById(req.params.id);
    if (!draw) return res.status(404).json({ message: "Draw not found" });
    if (draw.status === "completed") return res.status(409).json({ message: "Draw already completed" });
    if (draw.status === "cancelled") return res.status(409).json({ message: "Draw is cancelled" });

    const drawAt = draw.drawDate ? new Date(draw.drawDate) : new Date();
    const sub = await Subscription.findOne({
      userId: user._id,
      status: "active",
      startDate: { $lte: drawAt },
      endDate: { $gte: drawAt },
    }).sort({ createdAt: -1, _id: -1 });

    if (!sub) {
      return res.status(400).json({ message: "Active subscription required to participate." });
    }

    const cutoff = new Date(drawAt.getTime() - DAYS_30_MS);
    const scoreAgg = await Score.aggregate([
      { $match: { userId: user._id, date: { $gte: cutoff } } },
      { $sort: { date: -1, _id: -1 } },
      { $limit: 5 },
      { $project: { _id: 0, score: 1, playedAt: "$date" } },
    ]);

    if (!Array.isArray(scoreAgg) || scoreAgg.length < 5) {
      return res.status(400).json({ message: "Not eligible yet. Add 5 scores in the last 30 days to participate." });
    }

    const pct = clampDonationPct(user.charityPercentage ?? sub.donationPercentage ?? 10);

    const selectedCharityId = user.selectedCharity || sub.charityId || null;

    const existing = await DrawEntry.findOne({ drawId: draw._id, userId: user._id }).select("_id");
    if (existing) {
      return res.json({ message: "Already participated", participated: true });
    }

    await DrawEntry.create({
      drawId: draw._id,
      userId: user._id,
      subscriptionId: sub._id,
      selectedCharityId,
      donationPercentage: pct,
      scoresSnapshot: scoreAgg,
      eligibleAt: drawAt,
    });

    res.status(201).json({ message: "Participated", participated: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Backward compatible admin endpoint (older frontend/admin tooling).
exports.createDraw = async (req, res) => {
  return exports.runDraw(req, res);
};

exports.getDraws = async (req, res) => {
  try {
    const user = req.user || null;
    // "cancelled" is treated as deleted everywhere in the UI.
    const draws = await Draw.find({ status: { $ne: "cancelled" } }).sort({ drawDate: -1, createdAt: -1 });

    if (!user) {
      return res.json(
        draws.map((d) => {
          const obj = d.toObject();
          obj.drawAt = obj.drawDate;
          if (obj.status !== "completed") delete obj.drawNumbers;
          return obj;
        })
      );
    }

    const drawIds = draws.map((d) => d._id);
    const [entries, wins] = await Promise.all([
      DrawEntry.find({ userId: user._id, drawId: { $in: drawIds } }).select("drawId"),
      Winner.find({ userId: user._id, drawId: { $in: drawIds } }).select(
        "drawId matchCount tier prizeAmount provisionalPrizeAmount finalPrizeAmount status paymentState reviewStatus proofUrl proofImage"
      ),
    ]);

    const participated = new Set(entries.map((e) => String(e.drawId)));
    const winByDrawId = new Map(wins.map((w) => [String(w.drawId), w.toObject()]));

    res.json(
      draws.map((d) => {
        const obj = d.toObject();
        const id = String(d._id);
        obj.drawAt = obj.drawDate;
        obj.participated = participated.has(id);
        const rawWinner = winByDrawId.get(id);
        const w = rawWinner ? serializeWinner(rawWinner) : null;
        obj.won = Boolean(w);
        if (w) obj.myWin = w;
        if (obj.status !== "completed") delete obj.drawNumbers;
        return obj;
      })
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getNextDraw = async (req, res) => {
  try {
    // Prefer the next *future* draw. If a draw is marked upcoming but its date is
    // already in the past (overdue), we don't want it to "steal" the next draw slot.
    // Include legacy "scheduled" docs if they exist in the DB.
    const statuses = ["upcoming", "pending", "scheduled"];
    const now = new Date();

    let next = await Draw.findOne({ status: { $in: statuses }, drawDate: { $gte: now } }).sort({
      drawDate: 1,
      createdAt: 1,
    });

    if (!next) {
      // Fallback: return the earliest upcoming even if overdue, so UI can still show something.
      next = await Draw.findOne({ status: { $in: statuses } }).sort({ drawDate: 1, createdAt: 1 });
    }

    if (!next) return res.json(null);

    const obj = next.toObject();
    obj.drawAt = obj.drawDate;
    delete obj.drawNumbers;
    res.json(obj);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.scheduleDraw = async (req, res) => {
  try {
    const actorUserId = req.user?._id || null;
    const year = Number(req.body?.year);
    const month = Number(req.body?.month);
    const day = Number(req.body?.day || 1);
    const type = req.body?.type === "algorithm" ? "algorithm" : "random";

    if (!Number.isFinite(year) || year < 2000) {
      return res.status(400).json({ message: "Invalid year" });
    }
    if (!Number.isFinite(month) || month < 1 || month > 12) {
      return res.status(400).json({ message: "Invalid month" });
    }
    if (!Number.isFinite(day) || day < 1 || day > 31) {
      return res.status(400).json({ message: "Invalid day" });
    }

    // 9:00 a.m. in server/local timezone.
    const drawDate = new Date(year, month - 1, day, 9, 0, 0, 0);
    if (Number.isNaN(drawDate.getTime())) {
      return res.status(400).json({ message: "Invalid draw date" });
    }

    // No restriction on multiple draws per month: we only prevent duplicate "active" draws at the same exact datetime.
    const sameMoment = await Draw.findOne({
      drawDate,
      status: { $ne: "cancelled" },
    });
    if (sameMoment) {
      return res.status(409).json({ message: "A draw is already scheduled at this exact time." });
    }

    const draw = await Draw.create({
      year,
      month,
      drawDate,
      status: "upcoming",
      type,
      drawNumbers: [],
    });

    await AuditLog.create({
      actorUserId,
      action: "draw.schedule",
      entityType: "Draw",
      entityId: draw._id,
      meta: { year, month, day, type, drawDate: drawDate.toISOString() },
      ip: req.ip,
      userAgent: req.get("user-agent"),
    }).catch(() => null);

    const obj = draw.toObject();
    obj.drawAt = obj.drawDate;
    delete obj.drawNumbers;
    res.status(201).json(obj);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.runDrawById = async (req, res) => {
  try {
    const draw = await Draw.findById(req.params.id);
    if (!draw) return res.status(404).json({ message: "Draw not found" });
    if (draw.status === "completed") return res.status(409).json({ message: "Draw already completed" });
    if (draw.status === "cancelled") return res.status(409).json({ message: "Draw is cancelled" });

    req.body = {
      ...(req.body || {}),
      year: draw.year,
      month: draw.month,
      type: draw.type,
      drawDate: draw.drawDate,
    };

    return exports.runDraw(req, res);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: hard-delete a draw and its dependent records so it disappears everywhere.
exports.deleteDrawById = async (req, res) => {
  try {
    const id = req.params.id;
    const actorUserId = req.user?._id || null;

    const draw = await Draw.findById(id);
    if (!draw) return res.status(404).json({ message: "Draw not found" });

    await withOptionalTransaction(async (session) => {
      const drawId = draw._id;

      const [winners, donations] = await Promise.all([
        Winner.find({ drawId }).select("_id").session(session || null),
        Donation.find({ drawId }).select("_id").session(session || null),
      ]);

      const winnerIds = winners.map((w) => w._id);
      const donationIds = donations.map((d) => d._id);

      // Delete dependent documents first (order matters for human sanity, not DB correctness).
      await Promise.all([
        DrawEntry.deleteMany({ drawId }).session(session || null),
        Winner.deleteMany({ drawId }).session(session || null),
        Donation.deleteMany({ drawId }).session(session || null),
        PrizePool.deleteMany({ drawId }).session(session || null),
      ]);

      // Remove any transactions tied to this draw/winners/donations.
      await Transaction.deleteMany({
        $or: [
          { "ref.drawId": drawId },
          ...(winnerIds.length ? [{ "ref.winnerId": { $in: winnerIds } }] : []),
          ...(donationIds.length ? [{ "ref.donationId": { $in: donationIds } }] : []),
        ],
      }).session(session || null);

      await Draw.deleteOne({ _id: drawId }).session(session || null);

      await AuditLog.create(
        [
          {
            actorUserId,
            action: "draw.delete",
            entityType: "Draw",
            entityId: drawId,
            meta: { year: draw.year, month: draw.month, drawDate: draw.drawDate, status: draw.status },
            ip: req.ip,
            userAgent: req.get("user-agent"),
          },
        ],
        { session }
      ).catch(() => null);
    });

    res.json({ message: "Draw deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const drawService = require("../services/draw.service");

exports.executeDrawAdmin = async (req, res) => {
  try {
    const drawId = req.params.id;
    const isSimulation = req.body.isSimulation === true;
    
    const result = await drawService.executeDraw(drawId, isSimulation);
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
