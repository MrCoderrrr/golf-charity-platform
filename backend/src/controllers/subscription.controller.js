const Subscription = require("../models/subscription.model");
const User = require("../models/user.model");
const Transaction = require("../models/transaction.model");
const { createCheckoutSession, cancelSubscription } = require("../services/billing");

const PRICES_USD = {
  basic: { monthly: 999, yearly: 9999 },
  pro: { monthly: 2499, yearly: 24999 },
  elite: { monthly: 4999, yearly: 49999 },
};

const normalizeTier = (tier) => String(tier || "basic").trim().toLowerCase();

const getPlanAmount = (tier, planType) => {
  const t = normalizeTier(tier);
  const bucket = PRICES_USD[t];
  if (!bucket) return null;
  return planType === "yearly" ? bucket.yearly : bucket.monthly;
};

const parseDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
};

const addDays = (date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

exports.createSubscription = async (req, res) => {
  try {
    const { planType, startDate, endDate, tier } = req.body;
    if (!["monthly", "yearly"].includes(planType)) {
      return res.status(400).json({ message: "planType must be monthly or yearly" });
    }

    const normalizedTier = normalizeTier(tier);
    if (!["basic", "pro", "elite"].includes(normalizedTier)) {
      return res.status(400).json({ message: "tier must be basic, pro, or elite" });
    }

    const amount = getPlanAmount(normalizedTier, planType);
    if (amount == null) {
      return res.status(400).json({ message: "Invalid tier/planType" });
    }
    const donationPercentage = req.user?.charityPercentage ?? 0;
    const charityId = req.user?.selectedCharity || null;

    const start = parseDate(startDate) || new Date();
    const computedEnd =
      planType === "yearly" ? addDays(start, 365) : addDays(start, 30);
    const end = parseDate(endDate) || computedEnd;

    const subscription = await Subscription.create({
      userId: req.user._id,
      tier: normalizedTier,
      planType,
      startDate: start,
      endDate: end,
      status: "active",
      amount,
      donationPercentage,
      charityId: charityId || undefined,
      provider: "manual",
    });

    await Transaction.create({
      userId: req.user._id,
      type: "subscription",
      amount,
      currency: "USD",
      status: "completed",
      provider: "manual",
      ref: { subscriptionId: subscription._id },
    });

    await User.findByIdAndUpdate(req.user._id, {
      isSubscribed: true,
      subscriptionId: subscription._id,
    });

    res.status(201).json(subscription);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMySubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      userId: req.user._id,
      status: "active",
    }).sort({ createdAt: -1 });

    res.json(subscription);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.checkout = async (req, res) => {
  try {
    const { planType } = req.body;
    const url = await createCheckoutSession({ userId: req.user._id, plan: planType });
    res.json({ url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.cancel = async (req, res) => {
  try {
    const { stripeSubscriptionId } = req.body;
    if (!stripeSubscriptionId) return res.status(400).json({ message: "stripeSubscriptionId required" });
    await cancelSubscription(stripeSubscriptionId);
    await Subscription.findOneAndUpdate(
      { userId: req.user._id, status: "active" },
      { status: "cancelled" }
    );
    res.json({ message: "Cancellation scheduled" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
