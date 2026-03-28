const Donation = require("../models/donation.model");
const User = require("../models/user.model");
const Charity = require("../models/charity.model");

exports.getHeroStats = async (req, res) => {
  try {
    const [donAgg, players, charities] = await Promise.all([
      Donation.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]),
      User.countDocuments({ role: "user" }),
      Charity.countDocuments({}),
    ]);

    res.json({
      donatedTotal: Number(donAgg?.[0]?.total || 0),
      players,
      charities,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

