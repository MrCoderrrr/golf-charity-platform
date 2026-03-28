const Score = require("../models/score.model");

const DAYS_30_MS = 30 * 24 * 60 * 60 * 1000;

const parseDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
};

const getRecentScoresForEligibility = async (userId, now = new Date()) => {
  const cutoff = new Date(now.getTime() - DAYS_30_MS);
  return Score.find({ userId, date: { $gte: cutoff } })
    .sort({ date: -1, _id: -1 })
    .limit(5);
};

const getScoreEligibilityMeta = async (userId, now = new Date()) => {
  const cutoff = new Date(now.getTime() - DAYS_30_MS);
  const count = await Score.countDocuments({ userId, date: { $gte: cutoff } });
  return {
    windowDays: 30,
    cutoff: cutoff.toISOString(),
    recentScoreCount: count,
    requiredRecentScores: 5,
    hasEnoughScores: count >= 5,
  };
};

exports.addScore = async (req, res) => {
  try {
    let { score, date } = req.body;

    const numericScore = Number(score);
    if (!Number.isFinite(numericScore) || numericScore < 1 || numericScore > 45) {
      return res.status(400).json({ message: "Score must be between 1 and 45 (Stableford)." });
    }

    const parsedDate = parseDate(date);
    if (!parsedDate) {
      return res.status(400).json({ message: "Invalid date format." });
    }

    await Score.create({
      userId: req.user._id,
      score: numericScore,
      date: parsedDate,
    });

    // Return the most recent scores that count toward eligibility:
    // 5 scores within the last 30 days (no destructive deletes).
    const latest = await getRecentScoresForEligibility(req.user._id);

    if (req.query?.meta === "1" || req.query?.meta === "true") {
      const eligibility = await getScoreEligibilityMeta(req.user._id);
      return res.status(201).json({ scores: latest, eligibility });
    }

    res.status(201).json(latest);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getScores = async (req, res) => {
  try {
    const scores = await getRecentScoresForEligibility(req.user._id);

    if (req.query?.meta === "1" || req.query?.meta === "true") {
      const eligibility = await getScoreEligibilityMeta(req.user._id);
      return res.json({ scores, eligibility });
    }

    res.json(scores);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
