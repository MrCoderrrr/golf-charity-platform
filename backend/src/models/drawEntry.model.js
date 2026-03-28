const mongoose = require("mongoose");

const scoreSnapshotSchema = new mongoose.Schema(
  {
    score: { type: Number, required: true },
    playedAt: { type: Date, required: true },
  },
  { _id: false }
);

const drawEntrySchema = new mongoose.Schema(
  {
    drawId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Draw",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      required: true,
    },
    selectedCharityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Charity",
    },
    donationPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    scoresSnapshot: {
      type: [scoreSnapshotSchema],
      default: [],
    },
    eligibleAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

drawEntrySchema.index({ drawId: 1, userId: 1 }, { unique: true });
drawEntrySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("DrawEntry", drawEntrySchema);

