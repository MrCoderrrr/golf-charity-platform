const mongoose = require("mongoose");

const winnerScoreSnapshotSchema = new mongoose.Schema(
  {
    score: { type: Number, required: true, min: 1, max: 45 },
    playedAt: { type: Date, required: true },
  },
  { _id: false }
);

const winnerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    drawId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Draw",
      required: true,
    },
    matchCount: {
      type: Number,
      enum: [3, 4, 5],
      required: true,
    },
    tier: {
      type: String,
      enum: ["grand_legacy", "prestige", "impact"],
      required: true,
    },
    scoresSnapshot: {
      type: [winnerScoreSnapshotSchema],
      default: [],
    },
    provisionalPrizeAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    finalPrizeAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Backward-compatible effective prize field used by older code paths.
    prizeAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentState: {
      type: String,
      enum: ["pending", "paid", "Pending", "Paid"],
      default: "pending",
    },
    // Backward-compatible status field used by existing UI/analytics.
    status: {
      type: String,
      enum: ["pending", "approved", "paid", "rejected", "under_review", "Pending"],
      default: "pending",
    },
    proofUrl: {
      type: String,
      default: null,
    },
    // Backward-compatible alias still read by parts of the current UI.
    proofImage: {
      type: String,
      default: null,
    },
    proofMimeType: {
      type: String,
      default: null,
    },
    proofUploadedAt: {
      type: Date,
      default: null,
    },
    reviewStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "Pending", "Approve", "Reject"],
      default: "pending",
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

winnerSchema.index({ drawId: 1, userId: 1 }, { unique: true });
winnerSchema.index({ drawId: 1, matchCount: 1 });
winnerSchema.index({ userId: 1, createdAt: -1 });
winnerSchema.index({ paymentState: 1, createdAt: -1 });
winnerSchema.index({ reviewStatus: 1, createdAt: -1 });

module.exports = mongoose.model("Winner", winnerSchema);
