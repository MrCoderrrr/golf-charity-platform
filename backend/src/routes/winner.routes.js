const express = require("express");
const router = express.Router();

const {
  getMyWinnings,
  uploadProof,
  verifyWinner,
} = require("../controllers/winner.controller");
const { protect, adminOnly } = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");

router.get("/", protect, getMyWinnings);
router.post("/proof", protect, upload.single("file"), uploadProof);
router.post("/verify", protect, adminOnly, verifyWinner);

module.exports = router;
