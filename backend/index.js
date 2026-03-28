require("dotenv").config();
const connectDB = require("./src/config/db");
const app = require("./src/app");

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("Missing MONGO_URI in environment");
  process.exit(1);
}

// Start the HTTP server even if DB is temporarily down; we retry DB in the background.
// This prevents the backend from "crashing" and gives the frontend a consistent 503
// response instead of a connection reset.
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const connectWithRetry = async (attempt = 1) => {
  try {
    await connectDB(MONGO_URI);
    console.log("DB ready.");
  } catch (err) {
    const msg = err?.message || String(err);
    console.error(`DB connection error (attempt ${attempt}):`, msg);
    const delayMs = Math.min(30000, 3000 + attempt * 1000);
    setTimeout(() => connectWithRetry(attempt + 1), delayMs);
  }
};

connectWithRetry();

module.exports = app;
