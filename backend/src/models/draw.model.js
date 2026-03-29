const mongoose = require("mongoose");

const drawSchema = new mongoose.Schema(
  {
    month: {
      type: Number,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    drawDate: {
      type: Date,
      required: true,
    },
    drawNumbers: {
      type: [Number],
      required: function () {
        return this.status === "completed";
      },
      default: [],
    },
    type: {
      type: String,
      enum: ["random", "algorithm"],
      default: "random",
    },
    status: {
      type: String,
      // "pending" is kept as a backwards-compatible alias for "upcoming".
      enum: ["upcoming", "pending", "completed", "cancelled"],
      default: "upcoming",
    },
    totalPrizePoolAmount: {
      type: Number,
      default: 0,
    },
    isSimulation: {
      type: Boolean,
      default: false,
    },
    winners: {
      fiveMatch: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      fourMatch: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      threeMatch: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    },
  },
  { timestamps: true }
);

drawSchema.index({ status: 1, drawDate: 1 });
// Allow multiple draws per month/year; we only index for query speed.
drawSchema.index({ year: 1, month: 1, drawDate: 1 });

module.exports = mongoose.model("Draw", drawSchema);
