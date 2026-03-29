const User = require("../models/user.model");
const Donation = require("../models/donation.model");
const Charity = require("../models/charity.model");
const Winner = require("../models/winner.model");

const attachEarningsBreakdown = async (userDoc) => {
  if (!userDoc) return null;

  const out = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
  if (out.selectedCharity && typeof out.selectedCharity === "object" && out.selectedCharity._id) {
    const charityTotals = await Donation.aggregate([
      {
        $match: {
          charityId: out.selectedCharity._id,
          winnerId: { $exists: true, $ne: null },
        },
      },
      { $group: { _id: "$charityId", total: { $sum: "$amount" } } },
    ]);
    out.selectedCharity.totalDonations = Number(charityTotals?.[0]?.total || 0);
  }

  const earningsRows = await Winner.aggregate([
    { $match: { userId: userDoc._id, reviewStatus: { $in: ["approved", "Approve"] } } },
    {
      $group: {
        _id: "$matchCount",
        total: { $sum: "$prizeAmount" },
        count: { $sum: 1 },
      },
    },
  ]);

  const breakdown = {
    jackpot: 0,
    fourPass: 0,
    threePass: 0,
    total: 0,
  };
  const wins = {
    jackpot: 0,
    fourPass: 0,
    threePass: 0,
  };

  for (const row of earningsRows) {
    if (row?._id === 5) {
      breakdown.jackpot = Number(row.total || 0);
      wins.jackpot = Number(row.count || 0);
    }
    if (row?._id === 4) {
      breakdown.fourPass = Number(row.total || 0);
      wins.fourPass = Number(row.count || 0);
    }
    if (row?._id === 3) {
      breakdown.threePass = Number(row.total || 0);
      wins.threePass = Number(row.count || 0);
    }
  }

  const aggregateTotal = breakdown.jackpot + breakdown.fourPass + breakdown.threePass;
  breakdown.total = aggregateTotal;

  out.earningsBreakdown = breakdown;
  out.totalEarnings = aggregateTotal;
  out.wins = wins;
  out.isAdmin = out.role === "admin";
  return out;
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("selectedCharity")
      .populate("subscriptionId");

    const out = await attachEarningsBreakdown(user);
    res.json(out);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.selectCharity = async (req, res) => {
  try {
    const { charityId } = req.body;
    if (!charityId) return res.status(400).json({ message: "charityId required" });

    const exists = await Charity.exists({ _id: charityId });
    if (!exists) return res.status(404).json({ message: "Charity not found" });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { selectedCharity: charityId },
      { new: true }
    ).populate("selectedCharity");

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateCharityPercentage = async (req, res) => {
  try {
    const next = Number(req.body?.charityPercentage);
    if (!Number.isFinite(next)) {
      return res.status(400).json({ message: "charityPercentage must be a number" });
    }
    if (next < 10 || next > 100) {
      return res.status(400).json({ message: "charityPercentage must be between 10 and 100" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { charityPercentage: Math.round(next) },
      { new: true }
    )
      .select("-password")
      .populate("selectedCharity")
      .populate("subscriptionId");

    const out = await attachEarningsBreakdown(user);
    res.json(out);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyContributions = async (req, res) => {
  try {
    const monthKey = req.query.monthKey ? String(req.query.monthKey) : null;
    const match = { userId: req.user._id, winnerId: { $exists: true, $ne: null } };
    if (monthKey) match.monthKey = monthKey;

    const rows = await Donation.aggregate([
      { $match: match },
      {
        $group: {
          _id: { monthKey: "$monthKey", charityId: "$charityId" },
          total: { $sum: "$amount" },
          donations: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.monthKey",
          total: { $sum: "$total" },
          byCharity: {
            $push: {
              charityId: "$_id.charityId",
              total: "$total",
              donations: "$donations",
            },
          },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    res.json({
      monthKey: monthKey || null,
      months: rows.map((r) => ({
        monthKey: r._id,
        total: r.total,
        byCharity: r.byCharity,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.listUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.setUserBanned = async (req, res) => {
  try {
    const userId = req.params.id;
    const banned = req.body?.banned === false ? false : true;
    const user = await User.findByIdAndUpdate(userId, { banned }, { new: true }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
