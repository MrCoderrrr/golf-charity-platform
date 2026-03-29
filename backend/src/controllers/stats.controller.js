const Donation = require("../models/donation.model");
const User = require("../models/user.model");
const Charity = require("../models/charity.model");
const Draw = require("../models/draw.model");
const Subscription = require("../models/subscription.model");
const PrizePool = require("../models/prizePool.model");

const toMoney = (n) => Math.max(0, Math.round(Number(n) || 0));

const PRIZE_POOL_SHARE = (() => {
  const raw = Number(process.env.PRIZE_POOL_SHARE);
  if (!Number.isFinite(raw)) return 0.7;
  return Math.min(1, Math.max(0, raw));
})();

exports.getHeroStats = async (req, res) => {
  try {
    const [donAgg, players, charities, lastPool] = await Promise.all([
      Donation.aggregate([
        { $match: { winnerId: { $exists: true, $ne: null } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
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
          $addFields: {
            prizePoolPortion: { $round: [{ $multiply: ["$amount", PRIZE_POOL_SHARE] }, 0] },
          },
        },
        {
          $group: {
            _id: null,
            subs: { $sum: 1 },
            collected: { $sum: "$amount" },
            prize: { $sum: "$prizePoolPortion" },
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
          donation: 0,
          prizeBase,
          revenue: Math.max(0, toMoney(t?.collected || 0) - prizeBase),
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
