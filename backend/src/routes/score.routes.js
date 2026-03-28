const express = require("express");
const router = express.Router();

const { addScore, getScores } = require("../controllers/score.controller");
const { protect } = require("../middleware/auth.middleware");

router.post("/", protect, addScore);
router.get("/", protect, getScores);

module.exports = router;