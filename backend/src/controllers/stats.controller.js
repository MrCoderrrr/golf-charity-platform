const Donation = require("../models/donation.model");
const User = require("../models/user.model");
const Charity = require("../models/charity.model");
const Draw = require("../models/draw.model");
const Subscription = require("../models/subscription.model");
const PrizePool = require("../models/prizePool.model");

const clampDonationPct = (pct) => {
  const n = Number(pct);
  if (!Number.isFinite(n)) return 10;
  return Math.min(100, Math.max(10, n));
};

const toMoney = (n) => Math.max(0, Math.round(Number(n) || 0));

const PRIZE_POOL_SHARE = (() => {
  const raw = Number(process.env.PRIZE_POOL_SHARE);
  if (!Number.isFinite(raw)) return 0.7;
  return Math.min(1, Math.max(0, raw));
})();

exports.getHeroStats = async (req, res) => {
  try {
    const [donAgg, players, charities, lastPool] = await Promise.all([
      Donation.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]),
      User.countDocuments({ role: "user" }),
      Charity.countDocuments({}),
      PrizePool.findOne().sort({ createdAt: -1 }),
    ]);

    const rollover = toMoney(lastPool?.rolloverAmount || 0);

    // Compute the current active pool for the next scheduled draw (if any).
    const statuses = ["upcoming", "pending", "scheduled"];
    const now = new Date();
    const nextDraw =
      (await Draw.findOne({ status: { $in: statuses }, drawDate: { $gte: now } }).sort({ drawDate: 1, createdAt: 1 })) ||
      (await Draw.findOne({ status: { $in: statuses } }).sort({ drawDate: 1, createdAt: 1 }));

    let activePool = null;

    if (nextDraw?.drawDate) {
      const drawDate = new Date(nextDraw.drawDate);
      const subTotalsAgg = await Subscription.aggregate([
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
        { $match: { $or: [{ "user.banned": { $ne: true } }, { user: null }] } },
        {
          $addFields: {
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
            platformRevenue: {
              $round: [
                {
                  $subtract: [
                    "$remainingAmount",
                    { $multiply: ["$remainingAmount", PRIZE_POOL_SHARE] },
                  ],
                },
                0,
              ],
            },
          },
        },
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
      ]);

      const t = subTotalsAgg?.[0] || null;
      const prizeBase = toMoney(t?.prize || 0);
      const totalPrize = prizeBase + rollover;
      const tier5 = Math.floor(totalPrize * 0.4);
      const tier4 = Math.floor(totalPrize * 0.35);
      const tier3 = Math.max(0, totalPrize - tier5 - tier4);

      activePool = {
        tier5,
        tier4,
        tier3,
        rollover,
        prizePoolShare: PRIZE_POOL_SHARE,
        totals: {
          subs: Number(t?.subs || 0),
          collected: toMoney(t?.collected || 0),
          donation: toMoney(t?.donation || 0),
          prizeBase,
          revenue: toMoney(t?.revenue || 0),
        },
        nextDraw: {
          id: nextDraw._id,
          drawAt: nextDraw.drawDate,
          month: nextDraw.month,
          year: nextDraw.year,
          status: nextDraw.status,
          type: nextDraw.type,
        },
      };
    }

    res.json({
      donatedTotal: Number(donAgg?.[0]?.total || 0),
      players,
      charities,
      activePool,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
