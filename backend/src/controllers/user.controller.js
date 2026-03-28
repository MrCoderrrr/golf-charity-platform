const User = require("../models/user.model");

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("selectedCharity")
      .populate("subscriptionId");

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.selectCharity = async (req, res) => {
  try {
    const { charityId } = req.body;

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