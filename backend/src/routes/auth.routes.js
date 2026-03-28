const express = require("express");
const router = express.Router();

const { signup, login, bootstrapAdmin } = require("../controllers/auth.controller");

router.post("/signup", signup);
router.post("/login", login);
router.post("/bootstrap-admin", bootstrapAdmin);

module.exports = router;
