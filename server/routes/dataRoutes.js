const express = require("express");
const router = express.Router();
const User = require("../models/userModel.js");
const Game = require("../models/gameModel.js");
const auth = require("../middlewares/auth.js");

router.get("/users", auth, async (req, res) => {
	try {
		const users = await User.findAll();
		res.json(users);
	} catch (err) {
		console.error("Error al obtener usuarios:", err);
		return res.status(500).json({ error: "Error al obtener usuarios." });
	}
});

router.get("/transactions", auth, async (req, res) => {
	const userId = req.user.id;
	try {
		const transactions = await User.getTransactions(userId);
		res.json(transactions);
	} catch (err) {
		console.error("Error al obtener transacciones:", err);
		return res.status(500).json({ error: "Error al obtener transacciones." });
	}
});

router.get("/games", auth, async (req, res) => {
	const userId = req.user.id;
	try {
		const games = await Game.findUserActiveGame(userId, "blackjack");
		res.json(games);
	} catch (err) {
		console.error("Error al obtener las partidas:", err);
		return res.status(500).json({ error: "Error al obtener las partidas." });
	}
});

module.exports = router;
