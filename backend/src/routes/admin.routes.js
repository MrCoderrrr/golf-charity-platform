const express = require("express");
const router = express.Router();

const { protect, adminOnly } = require("../middleware/auth.middleware");
const {
  getAnalyticsOverview,
  getUsers,
  setUserBanned,
  verifyWinnerProof,
} = require("../controllers/admin.controller");
const { runDraw, scheduleDraw, runDrawById, deleteDrawById } = require("../controllers/draw.controller");

router.get("/analytics/overview", protect, adminOnly, getAnalyticsOverview);
router.get("/users", protect, adminOnly, getUsers);
router.patch("/users/:id/ban", protect, adminOnly, setUserBanned);
router.post("/winners/:id/verify", protect, adminOnly, verifyWinnerProof);
router.post("/draws/schedule", protect, adminOnly, scheduleDraw);
router.post("/draws/:id/run", protect, adminOnly, runDrawById);
router.delete("/draws/:id", protect, adminOnly, deleteDrawById);
router.post("/draws/run", protect, adminOnly, runDraw);

module.exports = router;
