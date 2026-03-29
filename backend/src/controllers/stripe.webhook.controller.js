const Stripe = require("stripe");
const User = require("../models/user.model");
const Subscription = require("../models/subscription.model");
const Draw = require("../models/draw.model");

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const stripe = stripeSecret ? new Stripe(stripeSecret) : null;

// Assuming $10 fixed portion is allocated to the global prize pool per subscription
const FIXED_PRIZE_POOL_PORTION = 10; 

exports.handleWebhook = async (req, res) => {
  if (!stripe || !webhookSecret) {
    return res.status(400).send("Stripe not configured.");
  }

  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object;
    
    // Attempt to lookup user via Subscription
    let userId;
    let subscription = null;
    
    if (invoice.subscription) {
      subscription = await Subscription.findOne({ stripeSubscriptionId: invoice.subscription });
    }
    
    // Fallback: Check customer mapping if our stripe logic maps customerId -> userId
    if (subscription) {
      userId = subscription.userId;
    }

    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        // Winner donations are now generated from approved winnings, not subscription payments.
      }
    }
    
    // 2. Allocate predefined fixed portion to global monthly prize pool
    // & auto-calculate based *strictly* on active subscriber count
    try {
      const activeSubscriberCount = await Subscription.countDocuments({ status: "active" });
      const currentMonthTotalPrizePool = activeSubscriberCount * FIXED_PRIZE_POOL_PORTION;
      
      const now = new Date();
      const currentMonth = now.getUTCMonth() + 1;
      const currentYear = now.getUTCFullYear();
      
      const upcomingDraw = await Draw.findOneAndUpdate(
        { month: currentMonth, year: currentYear, status: { $in: ["upcoming", "pending"] }, isSimulation: false },
        { totalPrizePoolAmount: currentMonthTotalPrizePool },
        { new: true, sort: { createdAt: -1 } }
      );
      
      if (!upcomingDraw) {
        console.log("No upcoming draw found for current month to update the prize pool.");
      }
    } catch(err) {
      console.error("Prize pool calc error", err);
    }
  }

  res.json({ received: true });
};
