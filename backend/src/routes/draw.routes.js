const express = require("express");
const router = express.Router();

const { createDraw, getDraws } = require("../controllers/draw.controller");
const { protect, adminOnly } = require("../middleware/auth.middleware");

router.post("/", protect, adminOnly, createDraw);
router.get("/", getDraws);

module.exports = router;