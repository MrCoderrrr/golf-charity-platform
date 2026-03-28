require("dotenv").config();
const mongoose = require("mongoose");

const connectDB = require("../src/config/db");
const Draw = require("../src/models/draw.model");

/**
 * One-time migration:
 * - Removes the legacy UNIQUE index on { year, month } so multiple draws can be scheduled per month.
 *
 * Run:
 *   cd backend
 *   npm run migrate:draws-multi
 */
const main = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("Missing MONGO_URI");

  await connectDB(uri);

  const indexes = await Draw.collection.indexes();
  const legacy = indexes.find((idx) => {
    const k = idx?.key || {};
    const isYearMonth = k.year === 1 && k.month === 1 && Object.keys(k).length === 2;
    return isYearMonth && idx.unique === true;
  });

  if (!legacy) {
    console.log("No legacy unique {year, month} index found. Nothing to do.");
  } else {
    console.log(`Dropping legacy index: ${legacy.name}`);
    await Draw.collection.dropIndex(legacy.name);
    console.log("Dropped.");
  }

  // Ensure our non-unique helper index exists.
  await Draw.collection.createIndex({ year: 1, month: 1, drawDate: 1 });
  console.log("Ensured index: { year: 1, month: 1, drawDate: 1 }");

  await mongoose.disconnect();
};

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

