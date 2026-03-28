const Draw = require("../models/draw.model");
const Score = require("../models/score.model");
const Winner = require("../models/winner.model");
const Subscription = require("../models/subscription.model");
const PrizePool = require("../models/prizePool.model");

const monthlyAmount = Number(process.env.SUBSCRIPTION_AMOUNT_MONTHLY || 10);
const yearlyAmount = Number(process.env.SUBSCRIPTION_AMOUNT_YEARLY || 100);

const getPlanAmount = (planType) => (planType === "yearly" ? yearlyAmount : monthlyAmount);

const getDonationPercentage = (subscription) => {
  const pct = subscription?.donationPercentage ?? subscription?.userId?.charityPercentage ?? 0;
  if (Number.isNaN(pct)) return 0;
  return Math.min(100, Math.max(0, pct));
};

const generateNumbers = () => {
  return Array.from({ length: 5 }, () =>
    Math.floor(Math.random() * 45) + 1
  );
};

const generateWeightedNumbers = async () => {
  const freq = await Score.aggregate([
    { $group: { _id: "$score", count: { $sum: 1 } } },
  ]);
  const weights = [];
  freq.forEach((f) => {
    weights.push({ num: f._id, weight: f.count });
  });
  const defaultWeight = 1;
  for (let i = 1; i <= 45; i++) {
    if (!weights.find((w) => w.num === i)) weights.push({ num: i, weight: defaultWeight });
  }
  const pick = () => {
    const total = weights.reduce((s, w) => s + w.weight, 0);
    let r = Math.random() * total;
    for (const w of weights) {
      if ((r -= w.weight) <= 0) return w.num;
    }
    return weights[0].num;
  };
  const set = new Set();
  while (set.size < 5) {
    set.add(pick());
  }
  return Array.from(set);
};

const countMatches = (userScores, drawNumbers) => {
  let matches = 0;

  userScores.forEach((s) => {
    if (drawNumbers.includes(s.score)) {
      matches++;
    }
  });

  return matches;
};

exports.createDraw = async (req, res) => {
  try {
    const { month, year, type } = req.body;

    const drawNumbers =
      type === "algorithm" ? await generateWeightedNumbers() : generateNumbers();

    const draw = await Draw.create({
      month,
      year,
      type: type || "random",
      drawNumbers,
      status: "completed",
    });

    // prize pool calculation (based on each subscriber's donation %)
    const subscriptions = await Subscription.find({ status: "active" }).populate("userId", "charityPercentage");
    const lastPool = await PrizePool.findOne().sort({ createdAt: -1 });
    const rollover = lastPool?.rolloverAmount || 0;

    const totalAmount = subscriptions.reduce((sum, sub) => {
      const planAmount = sub.amount ?? getPlanAmount(sub.planType);
      const donationPct = getDonationPercentage(sub);
      const jackpotPortion = planAmount * (1 - donationPct / 100);
      return sum + jackpotPortion;
    }, rollover);

    const fiveMatchPool = totalAmount * 0.4;
    const fourMatchPool = totalAmount * 0.35;
    const threeMatchPool = totalAmount * 0.25;

    const users = await Score.distinct("userId");
    let jackpotWon = false;

    for (let userId of users) {
      const scores = await Score.find({ userId });

      const matchCount = countMatches(scores, drawNumbers);

      if (matchCount >= 3) {
        let prizeAmount = 0;

        if (matchCount === 3) prizeAmount = 100;
        if (matchCount === 4) prizeAmount = 500;
        if (matchCount === 5) prizeAmount = 2000;

        await Winner.create({
          userId,
          drawId: draw._id,
          matchCount,
          prizeAmount,
        });

        if (matchCount === 5) jackpotWon = true;
      }
    }

    await PrizePool.create({
      drawId: draw._id,
      totalAmount,
      fiveMatchPool: jackpotWon ? fiveMatchPool : 0,
      fourMatchPool,
      threeMatchPool,
      rolloverAmount: jackpotWon ? 0 : fiveMatchPool,
    });

    res.status(201).json(draw);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getDraws = async (req, res) => {
  try {
    const draws = await Draw.find().sort({ createdAt: -1 });
    res.json(draws);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
