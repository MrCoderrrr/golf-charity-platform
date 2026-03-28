const Subscription = require("../models/subscription.model");
const User = require("../models/user.model");
const Transaction = require("../models/transaction.model");
const Donation = require("../models/donation.model");
const Charity = require("../models/charity.model");
const { createCheckoutSession, cancelSubscription } = require("../services/billing");

const monthlyAmount = Number(process.env.SUBSCRIPTION_AMOUNT_MONTHLY || 10);
const yearlyAmount = Number(process.env.SUBSCRIPTION_AMOUNT_YEARLY || 100);

const getPlanAmount = (planType) => (planType === "yearly" ? yearlyAmount : monthlyAmount);

const parseDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
};

const addDays = (date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

const monthKeyUTC = (date) => {
  const y = String(date.getUTCFullYear());
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

exports.createSubscription = async (req, res) => {
  try {
    const { planType, startDate, endDate } = req.body;
    if (!["monthly", "yearly"].includes(planType)) {
      return res.status(400).json({ message: "planType must be monthly or yearly" });
    }

    const amount = getPlanAmount(planType);
    const donationPercentage = req.user?.charityPercentage ?? 0;
    const charityId = req.user?.selectedCharity || null;

    const start = parseDate(startDate) || new Date();
    const computedEnd =
      planType === "yearly" ? addDays(start, 365) : addDays(start, 30);
    const end = parseDate(endDate) || computedEnd;

    const subscription = await Subscription.create({
      userId: req.user._id,
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
      currency: "INR",
      status: "completed",
      provider: "manual",
      ref: { subscriptionId: subscription._id },
    });

    await User.findByIdAndUpdate(req.user._id, {
      isSubscribed: true,
      subscriptionId: subscription._id,
    });

    // Persist donation attribution so Charity totals are real for UI/analytics.
    if (charityId) {
      const pct = Math.max(0, Math.min(100, Number(donationPercentage) || 0));
      const donationAmount = Math.max(0, Math.round((amount * pct) / 100));
      const key = monthKeyUTC(start);

      if (donationAmount > 0) {
        await Promise.all([
          Charity.findByIdAndUpdate(charityId, { $inc: { totalDonations: donationAmount } }),
          Donation.create({
            userId: req.user._id,
            charityId,
            subscriptionId: subscription._id,
            monthKey: key,
            amount: donationAmount,
            percentage: Math.max(10, Math.min(100, pct || 10)),
            status: "pending",
          }),
          Transaction.create({
            userId: req.user._id,
            type: "donation",
            amount: donationAmount,
            currency: "INR",
            status: "completed",
            provider: "manual",
            ref: { subscriptionId: subscription._id, charityId },
          }),
        ]);
      }
    }

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
