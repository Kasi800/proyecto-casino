const express = require("express");
const router = express.Router();
const User = require("../models/userModel.js");
const auth = require("../middlewares/auth.js");

router.get("/users", auth, async (req, res) => {
	try {
		const users = await User.findAll();
		res.json(users);
	} catch (err) {
		console.error("Error al obtener usuarios:", err);
		return res.status(500).json({ error: "Error al obtener usuarios" });
	}
});

router.get("/transactions", auth, (req, res) => {
	const { id } = req.body;
	User.getTransactions(id, (err, results) => {
		if (err) {
			console.error("Error al obtener usuarios:", err);
			return res.status(500).json({ error: "Error al obtener transacciones" });
		}
		res.json(results);
	});
});

module.exports = router;
