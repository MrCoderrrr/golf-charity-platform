const mongoose = require("mongoose");

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
    },
    prizeAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },
    proofImage: {
      type: String,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: {
      type: Date,
    },
    paidAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

winnerSchema.index({ drawId: 1, userId: 1 }, { unique: true });
winnerSchema.index({ drawId: 1, matchCount: 1 });
winnerSchema.index({ userId: 1, createdAt: -1 });
winnerSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Winner", winnerSchema);
