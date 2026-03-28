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

const DAYS_30_MS = 30 * 24 * 60 * 60 * 1000;

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
      const existing = await Draw.findOne({ month, year }).session(session || null);
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

      const activeSubs = await Subscription.find({
        status: "active",
        startDate: { $lte: drawDate },
        endDate: { $gte: drawDate },
      }).session(session || null);

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
      const activeUserIds = activeSubs.map((s) => s.userId);

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
      const eligibleSubsRaw = activeSubs.filter((s) => eligibleUserIdStrings.has(String(s.userId)));

      // A user should only have one active subscription, but if duplicates exist in the DB,
      // we must de-dupe here to avoid unique index collisions on (drawId, userId).
      const subByUserId = new Map();
      for (const s of eligibleSubsRaw) {
        const k = String(s.userId);
        const prev = subByUserId.get(k);
        const sTime = s?.createdAt ? new Date(s.createdAt).getTime() : 0;
        const pTime = prev?.createdAt ? new Date(prev.createdAt).getTime() : -1;
        if (!prev || sTime >= pTime) subByUserId.set(k, s);
      }
      const eligibleSubs = Array.from(subByUserId.values());

      const eligibleUsers = await User.find({ _id: { $in: eligibleSubs.map((s) => s.userId) } })
        .select("selectedCharity charityPercentage")
        .session(session || null);

      const userById = new Map(eligibleUsers.map((u) => [String(u._id), u]));
      const scoreByUserId = new Map(eligibleAgg.map((r) => [String(r._id), r]));

      const unassignedCharity = await getOrCreateUnassignedCharity(session);
      const mk = monthKeyUTC(drawDate);

      let jackpotBaseTotal = 0;
      const entryDocs = [];
      const donationDocs = [];
      const donationTxDocs = [];

      for (const sub of eligibleSubs) {
        const u = userById.get(String(sub.userId));
        const pct = clampDonationPct(sub.donationPercentage ?? u?.charityPercentage ?? 10);
        const amount = toMoney(sub.amount);
        const jackpotPortion = toMoney(amount * (1 - pct / 100));
        const donationAmount = Math.max(0, amount - jackpotPortion);

        jackpotBaseTotal += jackpotPortion;

        const selectedCharityId = u?.selectedCharity || null;
        const charityIdForDonation = selectedCharityId || unassignedCharity._id;

        const scoreRow = scoreByUserId.get(String(sub.userId));

        entryDocs.push({
          drawId: draw._id,
          userId: sub.userId,
          subscriptionId: sub._id,
          selectedCharityId,
          donationPercentage: pct,
          scoresSnapshot: scoreRow?.scores || [],
          eligibleAt: drawDate,
        });

        donationDocs.push({
          userId: sub.userId,
          charityId: charityIdForDonation,
          subscriptionId: sub._id,
          drawId: draw._id,
          monthKey: mk,
          amount: donationAmount,
          percentage: Math.max(10, Math.min(100, pct || 10)),
          status: "pending",
        });
      }

      const totalAmount = jackpotBaseTotal + rolloverAmount;
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

      const createdDonations = donationDocs.length
        ? await Donation.insertMany(donationDocs, { session })
        : [];

      for (const d of createdDonations) {
        donationTxDocs.push({
          userId: d.userId,
          type: "donation",
          amount: d.amount,
          currency: "INR",
          status: "pending",
          provider: "manual",
          ref: { donationId: d._id, drawId: draw._id, subscriptionId: d.subscriptionId },
        });
      }

      if (donationTxDocs.length) {
        await Transaction.insertMany(donationTxDocs, { session });
      }

      // Update charity donation totals (best-effort cache).
      if (createdDonations.length) {
        const byCharity = new Map();
        for (const d of createdDonations) {
          const key = String(d.charityId);
          byCharity.set(key, (byCharity.get(key) || 0) + toMoney(d.amount));
        }
        const bulk = Array.from(byCharity.entries()).map(([charityId, inc]) => ({
          updateOne: {
            filter: { _id: charityId },
            update: { $inc: { totalDonations: inc } },
          },
        }));
        await Charity.bulkWrite(bulk, { session });
      }

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
      const userBulk = [];

      const pushWinners = (entries, payouts, matchCount) => {
        for (let i = 0; i < entries.length; i++) {
          const entry = entries[i];
          const prizeAmount = toMoney(payouts[i] || 0);
          if (prizeAmount <= 0) continue;

          winnerDocs.push({
            userId: entry.userId,
            drawId: draw._id,
            matchCount,
            tier: tierForMatchCount(matchCount),
            prizeAmount,
            status: "pending",
            verified: false,
          });

          userBulk.push({
            updateOne: {
              filter: { _id: entry.userId },
              update: {
                $inc: {
                  totalEarnings: prizeAmount,
                  ...(matchCount === 5
                    ? { "wins.jackpot": 1 }
                    : matchCount === 4
                    ? { "wins.fourPass": 1 }
                    : { "wins.threePass": 1 }),
                },
              },
            },
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
          amount: w.prizeAmount,
          currency: "INR",
          status: "pending",
          provider: "manual",
          ref: { winnerId: w._id, drawId: draw._id },
        });
      }

      if (payoutTxDocs.length) {
        await Transaction.insertMany(payoutTxDocs, { session });
      }

      if (userBulk.length) {
        await User.bulkWrite(userBulk, { session });
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

// Backward compatible admin endpoint (older frontend/admin tooling).
exports.createDraw = async (req, res) => {
  return exports.runDraw(req, res);
};

exports.getDraws = async (req, res) => {
  try {
    const draws = await Draw.find().sort({ drawDate: -1, createdAt: -1 });
    const user = req.user || null;

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
      Winner.find({ userId: user._id, drawId: { $in: drawIds } }).select("drawId matchCount tier prizeAmount status"),
    ]);

    const participated = new Set(entries.map((e) => String(e.drawId)));
    const winByDrawId = new Map(wins.map((w) => [String(w.drawId), w.toObject()]));

    res.json(
      draws.map((d) => {
        const obj = d.toObject();
        const id = String(d._id);
        obj.drawAt = obj.drawDate;
        obj.participated = participated.has(id);
        const w = winByDrawId.get(id);
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
    const next = await Draw.findOne({ status: { $in: ["upcoming", "pending"] } })
      .sort({ drawDate: 1, createdAt: 1 });

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

    const existing = await Draw.findOne({ year, month });
    if (existing && existing.status === "completed") {
      return res.status(409).json({ message: "Draw already completed for this month/year" });
    }
    if (existing && existing.status === "cancelled") {
      return res.status(409).json({ message: "Draw is cancelled for this month/year" });
    }

    const draw = await Draw.findOneAndUpdate(
      { year, month },
      {
        $set: {
          year,
          month,
          drawDate,
          status: "upcoming",
          type,
          drawNumbers: [],
        },
        $setOnInsert: { year, month },
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

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
