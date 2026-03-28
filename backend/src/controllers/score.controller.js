const Score = require("../models/score.model");

exports.addScore = async (req, res) => {
  try {
    let { score, date } = req.body;

    const numericScore = Number(score);
    if (!Number.isFinite(numericScore) || numericScore < 1 || numericScore > 45) {
      return res.status(400).json({ message: "Score must be between 1 and 45 (Stableford)." });
    }

    if (!date) {
      return res.status(400).json({ message: "Date is required." });
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format." });
    }

    await Score.create({
      userId: req.user._id,
      score: numericScore,
      date: parsedDate,
    });

    // keep only latest 5 by creation time
    const extra = await Score.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(5)
      .select("_id");
    if (extra.length) {
      await Score.deleteMany({ _id: { $in: extra.map((s) => s._id) } });
    }

    const latest = await Score.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    res.status(201).json(latest);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getScores = async (req, res) => {
  try {
    const scores = await Score.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    res.json(scores);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
