const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    charityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Charity",
      required: true,
    },
    winnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Winner",
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
    },
    drawId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Draw",
    },
    monthKey: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    percentage: {
      type: Number,
      required: true,
      min: 10,
      max: 100,
    },
    status: {
      type: String,
      enum: ["pending", "sent"],
      default: "pending",
    },
  },
  { timestamps: true }
);

donationSchema.index({ userId: 1, monthKey: -1 });
donationSchema.index({ charityId: 1, monthKey: -1 });
donationSchema.index({ drawId: 1, createdAt: -1 });
donationSchema.index({ winnerId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Donation", donationSchema);
