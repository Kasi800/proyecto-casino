const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController.js");
const auth = require("../middlewares/auth.js");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.get("/protected", auth, (req, res) => {
	res.json({ message: "Acceso autorizado", user: req.user });
});

module.exports = router;
