const app = require("../backend/src/app");
const connectDB = require("../backend/src/config/db");

let _dbPromise = null;

const ensureDb = async () => {
  if (_dbPromise) return _dbPromise;
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("Missing MONGO_URI");
  _dbPromise = connectDB(uri).catch((err) => {
    _dbPromise = null;
    throw err;
  });
  return _dbPromise;
};

module.exports = async (req, res) => {
  try {
    await ensureDb();
    return app(req, res);
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Server error" });
  }
};

