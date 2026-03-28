const Subscription = require("../models/subscription.model");
const Winner = require("../models/winner.model");
const User = require("../models/user.model");

const clampToNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const formatMonthKeyUTC = (date) => {
  const y = String(date.getUTCFullYear());
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

const startOfMonthUTC = (date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0));

const addMonthsUTC = (date, deltaMonths) => {
  const d = new Date(date.getTime());
  d.setUTCMonth(d.getUTCMonth() + deltaMonths);
  return d;
};

const parseDateParam = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
};

const buildMonthlyBuckets = (from, to) => {
  const buckets = [];
  let cursor = startOfMonthUTC(from);
  const end = startOfMonthUTC(to);
  while (cursor <= end) {
    buckets.push(formatMonthKeyUTC(cursor));
    cursor = addMonthsUTC(cursor, 1);
  }
  return buckets;
};

exports.getAnalyticsOverview = async (req, res) => {
  try {
    const toRaw = req.query.to;
    const fromRaw = req.query.from;
    const toParam = parseDateParam(toRaw);
    const fromParam = parseDateParam(fromRaw);

    const now = new Date();
    const to = toParam || now;
    const defaultFrom = startOfMonthUTC(addMonthsUTC(to, -11));
    const from = fromParam || defaultFrom;

    if (fromRaw && !fromParam) {
      return res.status(400).json({ message: "Invalid from date" });
    }
    if (toRaw && !toParam) {
      return res.status(400).json({ message: "Invalid to date" });
    }
    if (from > to) {
      return res.status(400).json({ message: "`from` must be <= `to`" });
    }

    const monthKeys = buildMonthlyBuckets(from, to);

    const [
      subAllTimeAgg,
      subRangeTotalsAgg,
      subRangeMonthlyAgg,
      subPlanTypeAgg,
      winAllTimeAgg,
      winRangeTotalsAgg,
      winRangeMonthlyAgg,
      winMatchCountAgg,
      activeSubscriptions,
      totalUsers,
      subscribedUsers,
      pendingWinnerVerifications,
    ] = await Promise.all([
      Subscription.aggregate([
        {
          $group: {
            _id: null,
            income: { $sum: "$amount" },
            donated: {
              $sum: {
                $multiply: [
                  "$amount",
                  {
                    $divide: [{ $ifNull: ["$donationPercentage", 0] }, 100],
                  },
                ],
              },
            },
          },
        },
      ]),
      Subscription.aggregate([
        { $match: { createdAt: { $gte: from, $lte: to } } },
        {
          $group: {
            _id: null,
            income: { $sum: "$amount" },
            donated: {
              $sum: {
                $multiply: [
                  "$amount",
                  {
                    $divide: [{ $ifNull: ["$donationPercentage", 0] }, 100],
                  },
                ],
              },
            },
          },
        },
      ]),
      Subscription.aggregate([
        { $match: { createdAt: { $gte: from, $lte: to } } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m",
                date: "$createdAt",
                timezone: "UTC",
              },
            },
            income: { $sum: "$amount" },
            donated: {
              $sum: {
                $multiply: [
                  "$amount",
                  {
                    $divide: [{ $ifNull: ["$donationPercentage", 0] }, 100],
                  },
                ],
              },
            },
            subscriptions: { $sum: 1 },
          },
        },
      ]),
      Subscription.aggregate([
        { $match: { createdAt: { $gte: from, $lte: to } } },
        {
          $group: {
            _id: "$planType",
            income: { $sum: "$amount" },
          },
        },
      ]),
      Winner.aggregate([
        {
          $group: {
            _id: null,
            won: { $sum: "$prizeAmount" },
            paidOut: {
              $sum: {
                $cond: [
                  { $eq: ["$status", "paid"] },
                  "$prizeAmount",
                  0,
                ],
              },
            },
          },
        },
      ]),
      Winner.aggregate([
        { $match: { createdAt: { $gte: from, $lte: to } } },
        {
          $group: {
            _id: null,
            won: { $sum: "$prizeAmount" },
            paidOut: {
              $sum: {
                $cond: [
                  { $eq: ["$status", "paid"] },
                  "$prizeAmount",
                  0,
                ],
              },
            },
          },
        },
      ]),
      Winner.aggregate([
        { $match: { createdAt: { $gte: from, $lte: to } } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m",
                date: "$createdAt",
                timezone: "UTC",
              },
            },
            won: { $sum: "$prizeAmount" },
            paidOut: {
              $sum: {
                $cond: [
                  { $eq: ["$status", "paid"] },
                  "$prizeAmount",
                  0,
                ],
              },
            },
            winners: { $sum: 1 },
          },
        },
      ]),
      Winner.aggregate([
        { $match: { createdAt: { $gte: from, $lte: to } } },
        { $group: { _id: "$matchCount", count: { $sum: 1 } } },
      ]),
      Subscription.countDocuments({ status: "active" }),
      User.countDocuments({}),
      User.countDocuments({ isSubscribed: true }),
      Winner.countDocuments({
        proofImage: { $exists: true, $ne: null },
        verified: false,
      }),
    ]);

    const subAllTime = subAllTimeAgg[0] || { income: 0, donated: 0 };
    const subRangeTotals = subRangeTotalsAgg[0] || { income: 0, donated: 0 };
    const winAllTime = winAllTimeAgg[0] || { won: 0, paidOut: 0 };
    const winRangeTotals = winRangeTotalsAgg[0] || { won: 0, paidOut: 0 };

    const subMonthlyByKey = new Map(
      (subRangeMonthlyAgg || []).map((row) => [row._id, row])
    );
    const winMonthlyByKey = new Map(
      (winRangeMonthlyAgg || []).map((row) => [row._id, row])
    );

    const trendMonthly = monthKeys.map((key) => {
      const s = subMonthlyByKey.get(key) || {};
      const w = winMonthlyByKey.get(key) || {};
      return {
        month: key,
        income: clampToNumber(s.income),
        donated: clampToNumber(s.donated),
        won: clampToNumber(w.won),
        paidOut: clampToNumber(w.paidOut),
        subscriptions: clampToNumber(s.subscriptions),
        winners: clampToNumber(w.winners),
      };
    });

    const planType = { monthly: 0, yearly: 0 };
    (subPlanTypeAgg || []).forEach((row) => {
      if (row._id === "monthly") planType.monthly = clampToNumber(row.income);
      if (row._id === "yearly") planType.yearly = clampToNumber(row.income);
    });

    const winnersByMatchCount = { "3": 0, "4": 0, "5": 0 };
    (winMatchCountAgg || []).forEach((row) => {
      const key = String(row._id);
      if (winnersByMatchCount[key] !== undefined) {
        winnersByMatchCount[key] = clampToNumber(row.count);
      }
    });

    res.json({
      range: { from: from.toISOString(), to: to.toISOString() },
      kpis: {
        allTime: {
          income: clampToNumber(subAllTime.income),
          donated: clampToNumber(subAllTime.donated),
          won: clampToNumber(winAllTime.won),
          paidOut: clampToNumber(winAllTime.paidOut),
        },
        range: {
          income: clampToNumber(subRangeTotals.income),
          donated: clampToNumber(subRangeTotals.donated),
          won: clampToNumber(winRangeTotals.won),
          paidOut: clampToNumber(winRangeTotals.paidOut),
        },
      },
      trendMonthly,
      breakdowns: {
        planType,
        winnersByMatchCount,
      },
      ops: {
        activeSubscriptions,
        totalUsers,
        subscribedUsers,
        pendingWinnerVerifications,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const { q, role, banned, subscribed, limit } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (banned === "true") filter.banned = true;
    if (banned === "false") filter.banned = false;
    if (subscribed === "true") filter.isSubscribed = true;
    if (subscribed === "false") filter.isSubscribed = false;
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ];
    }

    const take = Math.min(200, Math.max(1, Number(limit) || 50));

    const users = await User.find(filter)
      .select("name email role isSubscribed banned createdAt")
      .sort({ createdAt: -1 })
      .limit(take);

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.setUserBanned = async (req, res) => {
  try {
    const { id } = req.params;
    const { banned } = req.body;
    const value = Boolean(banned);

    const user = await User.findByIdAndUpdate(
      id,
      { banned: value },
      { new: true }
    ).select("name email role isSubscribed banned createdAt");

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
