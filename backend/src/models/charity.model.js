const mongoose = require("mongoose");

const charitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    icon: {
      type: String,
      default: "*",
      trim: true,
    },
    goalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    image: {
      type: String,
    },
    stripeLink: {
      type: String,
      trim: true,
      default: "",
    },
    totalDonations: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

charitySchema.index({ name: "text", description: "text" });

module.exports = mongoose.model("Charity", charitySchema);

