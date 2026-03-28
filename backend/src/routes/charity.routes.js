const express = require("express");
const router = express.Router();

const {
  createCharity,
  getCharities,
  updateCharity,
  deleteCharity,
} = require("../controllers/charity.controller");

const { protect, adminOnly } = require("../middleware/auth.middleware");

router.post("/", protect, adminOnly, createCharity);
router.patch("/:id", protect, adminOnly, updateCharity);
router.delete("/:id", protect, adminOnly, deleteCharity);
router.get("/", getCharities);

module.exports = router;
