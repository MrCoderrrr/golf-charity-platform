const express = require("express");
const router = express.Router();

const {
  getMe,
  selectCharity,
  updateCharityPercentage,
  getMyContributions,
  listUsers,
  setUserBanned,
} = require("../controllers/user.controller");

const { protect, adminOnly } = require("../middleware/auth.middleware");

router.get("/me", protect, getMe);
router.put("/select-charity", protect, selectCharity);
router.put("/charity-percentage", protect, updateCharityPercentage);
router.get("/contributions", protect, getMyContributions);

// admin ops
router.get("/", protect, adminOnly, listUsers);
router.patch("/:id/ban", protect, adminOnly, setUserBanned);

module.exports = router;
