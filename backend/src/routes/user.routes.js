const express = require("express");
const router = express.Router();

const {
  getMe,
  selectCharity,
} = require("../controllers/user.controller");

const { protect } = require("../middleware/auth.middleware");

router.get("/me", protect, getMe);
router.put("/select-charity", protect, selectCharity);

module.exports = router;