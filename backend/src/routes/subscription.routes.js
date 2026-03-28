const express = require("express");
const router = express.Router();

const {
  createSubscription,
  getMySubscription,
  checkout,
  cancel,
} = require("../controllers/subscription.controller");

const { protect } = require("../middleware/auth.middleware");

router.post("/", protect, createSubscription);
router.get("/", protect, getMySubscription);
router.post("/checkout", protect, checkout);
router.post("/cancel", protect, cancel);

module.exports = router;
