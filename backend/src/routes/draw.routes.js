const express = require("express");
const router = express.Router();

const { createDraw, getDraws, getNextDraw } = require("../controllers/draw.controller");
const { protect, adminOnly, optionalProtect } = require("../middleware/auth.middleware");

router.post("/", protect, adminOnly, createDraw);
router.get("/next", getNextDraw);
router.get("/", optionalProtect, getDraws);

module.exports = router;
