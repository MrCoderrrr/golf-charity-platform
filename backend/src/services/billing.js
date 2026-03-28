const Stripe = require("stripe");

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const priceMonthly = process.env.STRIPE_PRICE_MONTHLY;
const priceYearly = process.env.STRIPE_PRICE_YEARLY;

const stripe = stripeSecret ? new Stripe(stripeSecret) : null;

const ensureStripe = () => {
  if (!stripe) {
    throw new Error("Stripe not configured");
  }
};

const createCheckoutSession = async ({ userId, plan }) => {
  ensureStripe();
  const price = plan === "yearly" ? priceYearly : priceMonthly;
  if (!price) throw new Error("Stripe price ID missing");

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price, quantity: 1 }],
    success_url: process.env.FRONTEND_URL + "/pricing?success=true",
    cancel_url: process.env.FRONTEND_URL + "/pricing?cancelled=true",
    metadata: { userId, plan },
  });
  return session.url;
};

const cancelSubscription = async (stripeSubId) => {
  ensureStripe();
  return stripe.subscriptions.update(stripeSubId, { cancel_at_period_end: true });
};

module.exports = { createCheckoutSession, cancelSubscription };
