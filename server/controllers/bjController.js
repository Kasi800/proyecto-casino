const Blackjack = require("../models/Blackjack.js");
const games = new Map();

const startGame = (req, res) => {
	const userId = req.user.id;
	let game = games.get(userId);
	if (!game || game.getState().finished) {
		game = new Blackjack();
		games.set(userId, game);
	}
	res.json({ games: { blackjack: game.getState() } });
};

const hit = (req, res) => {
	const userId = req.user.id;
	const game = games.get(userId);
	if (!game || game.finished)
		return res.status(400).json({ error: "No hay partida activa" });
	game.playerHit();
	res.json({ games: { blackjack: game.getState() } });
};

const stand = (req, res) => {
	const userId = req.user.id;
	const game = games.get(userId);
	if (!game || game.finished)
		return res.status(400).json({ error: "No hay partida activa" });
	game.playerStand();
	res.json({ games: { blackjack: game.getState() } });
};

module.exports = { startGame, hit, stand };
