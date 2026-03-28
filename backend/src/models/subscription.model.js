const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    planType: {
      type: String,
      enum: ["monthly", "yearly"],
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "cancelled", "expired"],
      default: "active",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    paymentId: {
      type: String,
    },
    provider: {
      type: String,
      enum: ["stripe", "manual"],
      default: "stripe",
    },
    stripeSubscriptionId: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    donationPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    charityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Charity",
    },
  },
  { timestamps: true }
);

subscriptionSchema.index({ createdAt: -1 });
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ charityId: 1, createdAt: -1 });

module.exports = mongoose.model("Subscription", subscriptionSchema);
