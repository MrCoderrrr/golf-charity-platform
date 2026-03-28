const User = require("../models/user.model");
const Donation = require("../models/donation.model");
const Charity = require("../models/charity.model");

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("selectedCharity")
      .populate("subscriptionId");

    const out = user ? user.toObject() : null;
    if (out) out.isAdmin = out.role === "admin";
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

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyContributions = async (req, res) => {
  try {
    const monthKey = req.query.monthKey ? String(req.query.monthKey) : null;
    const match = { userId: req.user._id };
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
