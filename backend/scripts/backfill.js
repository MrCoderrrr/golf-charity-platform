require("dotenv").config();
const mongoose = require("mongoose");

const connectDB = require("../src/config/db");
const Winner = require("../src/models/winner.model");
const Charity = require("../src/models/charity.model");

const tierForMatchCount = (matchCount) => {
  if (matchCount === 5) return "grand_legacy";
  if (matchCount === 4) return "prestige";
  return "impact";
};

const main = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("Missing MONGO_URI");
  await connectDB(uri);

  const winners = await Winner.find({ tier: { $exists: false } }).select("_id matchCount");
  if (winners.length) {
    const bulk = winners.map((w) => ({
      updateOne: {
        filter: { _id: w._id },
        update: { $set: { tier: tierForMatchCount(w.matchCount) } },
      },
    }));
    await Winner.bulkWrite(bulk);
    console.log(`Backfilled Winner.tier for ${winners.length} winners`);
  } else {
    console.log("No Winner.tier backfill needed");
  }

  const charities = await Charity.find({
    $or: [{ icon: { $exists: false } }, { icon: null }, { icon: "" }],
  }).select("_id name");

  if (charities.length) {
    const bulk = charities.map((c) => ({
      updateOne: {
        filter: { _id: c._id },
        update: { $set: { icon: (c.name || "C").charAt(0).toUpperCase() } },
      },
    }));
    await Charity.bulkWrite(bulk);
    console.log(`Backfilled Charity.icon for ${charities.length} charities`);
  } else {
    console.log("No Charity.icon backfill needed");
  }

  const unassignedName = "Unassigned Giving Pool";
  const existing = await Charity.findOne({ name: unassignedName }).select("_id");
  if (!existing) {
    await Charity.create({
      name: unassignedName,
      description: "Fallback charity used when a user has not selected one yet.",
      icon: "¤",
      goalAmount: 0,
    });
    console.log("Created system charity: Unassigned Giving Pool");
  }

  await mongoose.disconnect();
};

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

