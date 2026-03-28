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
    rolloverAmount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PrizePool", prizePoolSchema);