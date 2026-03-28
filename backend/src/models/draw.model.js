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
    drawNumbers: {
      type: [Number],
      required: true,
    },
    type: {
      type: String,
      enum: ["random", "algorithm"],
      default: "random",
    },
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Draw", drawSchema);