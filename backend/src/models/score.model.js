const mongoose = require("mongoose");

const scoreSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    // Canonical stored field is `date` for backwards compatibility.
    // Use `playedAt` as an alias in code.
    date: {
      type: Date,
      required: true,
      alias: "playedAt",
    },
    source: {
      type: String,
      enum: ["manual", "import"],
      default: "manual",
    },
    status: {
      type: String,
      enum: ["submitted", "void", "verified"],
      default: "submitted",
    },
  },
  { timestamps: true }
);

scoreSchema.index({ userId: 1, date: -1 });
scoreSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Score", scoreSchema);
