const mongoose = require("mongoose");

const ensureDrawsMultiPerMonth = async () => {
  try {
    // If the legacy unique index on { year, month } exists, it blocks scheduling
    // multiple draws in the same month. Drop it and ensure the new helper index.
    const db = mongoose.connection?.db;
    if (!db) return;
    const col = db.collection("draws");
    const indexes = await col.indexes();
    const legacy = indexes.find((idx) => {
      const k = idx?.key || {};
      const isYearMonth = k.year === 1 && k.month === 1 && Object.keys(k).length === 2;
      return isYearMonth && idx.unique === true;
    });

    if (legacy?.name) {
      await col.dropIndex(legacy.name);
      // eslint-disable-next-line no-console
      console.log(`Dropped legacy draws unique index: ${legacy.name}`);
    }

    // Non-unique index for speed when querying draws by month.
    await col.createIndex({ year: 1, month: 1, drawDate: 1 });
  } catch (err) {
    // Don't block server startup for an index migration.
    // eslint-disable-next-line no-console
    console.warn("Draw index check skipped:", err?.message || err);
  }
};

const connectDB = async (uri) => {
  if (!uri) {
    throw new Error("Missing MongoDB connection string");
  }

  // Keep local dev (mongodb://) working by default.
  // Enable TLS explicitly via env flags when using Atlas/SRV or a TLS-required cluster.
  const opts = {
    serverSelectionTimeoutMS: 5000,
  };

  if (String(process.env.MONGODB_TLS || "").toLowerCase() === "true") {
    opts.tls = true;
  }

  if (String(process.env.MONGODB_TLS_INSECURE || "").toLowerCase() === "true") {
    opts.tls = true;
    // Only for dev/debug; do not use in production.
    opts.tlsAllowInvalidCertificates = true;
  }

  const connection = await mongoose.connect(uri, opts);
  console.log("MongoDB connected:", connection.connection.host);
  await ensureDrawsMultiPerMonth();
  return connection;
};

module.exports = connectDB;
