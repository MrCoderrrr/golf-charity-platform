const Charity = require("../models/charity.model");
const Donation = require("../models/donation.model");

const attachWinnerDonationTotals = async (charities) => {
  const rows = Array.isArray(charities) ? charities : [charities].filter(Boolean);
  if (!rows.length) return Array.isArray(charities) ? [] : null;

  const ids = rows.map((item) => item._id);
  const totals = await Donation.aggregate([
    { $match: { charityId: { $in: ids }, winnerId: { $exists: true, $ne: null } } },
    { $group: { _id: "$charityId", total: { $sum: "$amount" } } },
  ]);

  const totalMap = new Map(totals.map((row) => [String(row._id), Number(row.total || 0)]));
  const mapped = rows.map((charity) => {
    const out = charity.toObject ? charity.toObject() : { ...charity };
    out.totalDonations = totalMap.get(String(out._id)) || 0;
    return out;
  });

  return Array.isArray(charities) ? mapped : mapped[0];
};

exports.createCharity = async (req, res) => {
  try {
    const { name, description, image, icon, goalAmount, stripeLink } = req.body;

    const charity = await Charity.create({
      name,
      description,
      image,
      icon,
      goalAmount,
      stripeLink,
    });

    res.status(201).json(charity);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getCharities = async (req, res) => {
  try {
    const charities = await Charity.find();
    res.json(await attachWinnerDonationTotals(charities));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateCharity = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image, icon, goalAmount, stripeLink } = req.body || {};

    const patch = {};
    if (name !== undefined) patch.name = name;
    if (description !== undefined) patch.description = description;
    if (image !== undefined) patch.image = image;
    if (icon !== undefined) patch.icon = icon;
    if (goalAmount !== undefined) patch.goalAmount = goalAmount;
    if (stripeLink !== undefined) patch.stripeLink = stripeLink;

    const updated = await Charity.findByIdAndUpdate(id, patch, { new: true });
    if (!updated) return res.status(404).json({ message: "Charity not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteCharity = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Charity.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Charity not found" });
    res.json({ message: "Charity deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
