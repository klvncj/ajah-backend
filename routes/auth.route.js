const express = require("express");
const router = express.Router();
const { loginUser, authAdmin } = require("../controllers/auth.controller");

router.post("/login", loginUser);
router.post("/admin", authAdmin);
module.exports = router;