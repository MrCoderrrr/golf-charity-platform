const express = require("express");
const webhookController = require("../controllers/stripe.webhook.controller");

const router = express.Router();

// Stripe requires the raw body to construct the event
router.post(
  "/",
  express.raw({ type: "application/json" }),
  webhookController.handleWebhook
);

module.exports = router;
