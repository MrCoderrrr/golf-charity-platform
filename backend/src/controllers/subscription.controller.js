const Subscription = require("../models/subscription.model");
const User = require("../models/user.model");
const { createCheckoutSession, cancelSubscription } = require("../services/billing");

const monthlyAmount = Number(process.env.SUBSCRIPTION_AMOUNT_MONTHLY || 10);
const yearlyAmount = Number(process.env.SUBSCRIPTION_AMOUNT_YEARLY || 100);

const getPlanAmount = (planType) => (planType === "yearly" ? yearlyAmount : monthlyAmount);

exports.createSubscription = async (req, res) => {
  try {
    const { planType, startDate, endDate } = req.body;

    const amount = getPlanAmount(planType);
    const donationPercentage = req.user?.charityPercentage ?? 0;

    const subscription = await Subscription.create({
      userId: req.user._id,
      planType,
      startDate,
      endDate,
      status: "active",
      amount,
      donationPercentage,
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
    });

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
