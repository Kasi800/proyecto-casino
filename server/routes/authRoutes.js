const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController.js");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.get("/protected", authController.protected, (req, res) => {
	res.json({ message: "Acceso autorizado", user: req.user });
});

module.exports = router;
