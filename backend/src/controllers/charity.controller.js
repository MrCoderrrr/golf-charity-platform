const Charity = require("../models/charity.model");

exports.createCharity = async (req, res) => {
  try {
    const { name, description, image, icon, goalAmount } = req.body;

    const charity = await Charity.create({
      name,
      description,
      image,
      icon,
      goalAmount,
    });

    res.status(201).json(charity);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getCharities = async (req, res) => {
  try {
    const charities = await Charity.find();
    res.json(charities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateCharity = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image, icon, goalAmount } = req.body || {};

    const patch = {};
    if (name !== undefined) patch.name = name;
    if (description !== undefined) patch.description = description;
    if (image !== undefined) patch.image = image;
    if (icon !== undefined) patch.icon = icon;
    if (goalAmount !== undefined) patch.goalAmount = goalAmount;

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
