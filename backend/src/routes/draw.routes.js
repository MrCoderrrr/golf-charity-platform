const express = require("express");
const router = express.Router();

const { createDraw, getDraws, getNextDraw, participateInDraw, executeDrawAdmin } = require("../controllers/draw.controller");
const { protect, adminOnly, optionalProtect } = require("../middleware/auth.middleware");

router.post("/", protect, adminOnly, createDraw);
router.post("/:id/execute", protect, adminOnly, executeDrawAdmin);
router.post("/:id/participate", protect, participateInDraw);
router.get("/next", getNextDraw);
router.get("/", optionalProtect, getDraws);

module.exports = router;
