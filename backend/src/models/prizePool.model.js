const mongoose = require("mongoose");

const prizePoolSchema = new mongoose.Schema(
  {
    drawId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Draw",
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    tierPercent: {
      five: { type: Number, default: 40 },
      four: { type: Number, default: 35 },
      three: { type: Number, default: 25 },
    },
    fiveMatchPool: {
      type: Number,
      required: true,
    },
    fourMatchPool: {
      type: Number,
      required: true,
    },
    threeMatchPool: {
      type: Number,
      required: true,
    },
    rolloverFromDrawId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Draw",
    },
    rolloverAmount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

prizePoolSchema.index({ drawId: 1 }, { unique: true });

module.exports = mongoose.model("PrizePool", prizePoolSchema);
