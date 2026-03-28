const express = require("express");
const router = express.Router();

const { getHeroStats } = require("../controllers/stats.controller");

router.get("/hero", getHeroStats);

module.exports = router;

