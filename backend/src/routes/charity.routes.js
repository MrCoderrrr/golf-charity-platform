const express = require("express");
const router = express.Router();

const {
  createCharity,
  getCharities,
} = require("../controllers/charity.controller");

const { protect, adminOnly } = require("../middleware/auth.middleware");

router.post("/", protect, adminOnly, createCharity);
router.get("/", getCharities);

module.exports = router;