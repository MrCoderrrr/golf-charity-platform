const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
      trim: true,
    },
    type: {
      type: String,
      enum: ["subscription", "donation", "payout"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    provider: {
      type: String,
      enum: ["stripe", "manual"],
      default: "stripe",
    },
    providerId: {
      type: String,
    },
    ref: {
      subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription" },
      donationId: { type: mongoose.Schema.Types.ObjectId, ref: "Donation" },
      winnerId: { type: mongoose.Schema.Types.ObjectId, ref: "Winner" },
      drawId: { type: mongoose.Schema.Types.ObjectId, ref: "Draw" },
    },
  },
  { timestamps: true }
);

transactionSchema.index({ providerId: 1 });
transactionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Transaction", transactionSchema);
