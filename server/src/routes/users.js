const express = require("express");
const router = express.Router();
const { getUser } = require("../controllers/userController");
const auth = require("../middleware/auth");

router.get("/users/me", auth, getUser);

module.exports = router;
