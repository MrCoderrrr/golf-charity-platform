const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    // 🔗 Relations (important for future)
    selectedCharity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Charity",
    },

    charityPercentage: {
      type: Number,
      default: 10,
      min: 10,
      max: 100,
    },

    isSubscribed: {
      type: Boolean,
      default: false,
    },

    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
    },

    totalEarnings: {
      type: Number,
      default: 0,
      min: 0,
    },

    wins: {
      jackpot: { type: Number, default: 0, min: 0 },
      fourPass: { type: Number, default: 0, min: 0 },
      threePass: { type: Number, default: 0, min: 0 },
    },
  },
  {
    timestamps: true,
  }
);


// 🔐 Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});


// 🔑 Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};


module.exports = mongoose.model("User", userSchema);
