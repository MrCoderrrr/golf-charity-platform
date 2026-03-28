const Charity = require("../models/charity.model");

exports.createCharity = async (req, res) => {
  try {
    const { name, description, image } = req.body;

    const charity = await Charity.create({
      name,
      description,
      image,
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