const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const scoreRoutes = require("./routes/score.routes");
const charityRoutes = require("./routes/charity.routes");
const drawRoutes = require("./routes/draw.routes");
const subscriptionRoutes = require("./routes/subscription.routes");
const winnerRoutes = require("./routes/winner.routes");
const adminRoutes = require("./routes/admin.routes");
const statsRoutes = require("./routes/stats.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/scores", scoreRoutes);
app.use("/api/charities", charityRoutes);
app.use("/api/draws", drawRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/winners", winnerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/stats", statsRoutes);

app.get("/", (req, res) => {
  res.send("API running");
});

module.exports = app;
