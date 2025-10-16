const Blackjack = require("../models/Blackjack.js");
const User = require("../models/userModel.js");
//const games = new Map();
const Game = require("../models/gameModel.js");

const startGame = async (req, res) => {
	const userId = req.user.id;
	const betAmount = 1;

	if (!betAmount || betAmount <= 0) {
		return res.status(400).json({
			success: false,
			message: "Se requiere un monto de apuesta válido.",
		});
	}

	try {
		/*let game = games.get(userId);
		if (!game || game.getState().finished) {
			game = new Blackjack();
			games.set(userId, game);
			await User.placeBet(userId, betAmount, "blackjack");
		}
		*/
		let loadedGame = await Game.findUserActiveGame(userId, "blackjack");
		let game;

		if (loadedGame && loadedGame.gameState.finished) {
			await Game.removeGame(loadedGame.gameId);
			loadedGame = null;
		}

		if (loadedGame) {
			game = new Blackjack(loadedGame.gameState);
		} else {
			await User.placeBet(userId, betAmount, "blackjack");
			game = new Blackjack();
			const initialGameState = game.getInternalState();
			const playerState = { playerHand: game.playerHand, bet: betAmount };
			const gameId = await Game.createGame(
				"blackjack",
				initialGameState,
				userId,
				playerState
			);
			if (game.finished) {
				let amountWon = 0;
				let transactionType = "";

				if (game.winner === "player_blackjack") {
					amountWon = betAmount * 2.5;
					transactionType = "win_blackjack";
				} else if (game.winner === "draw") {
					amountWon = betAmount;
					transactionType = "draw";
				}

				if (amountWon > 0) {
					await User.resolveBet(
						userId,
						amountWon,
						"blackjack",
						transactionType
					);
				}
				await Game.removeGame(gameId);
			}
		}

		res.json({ success: true, games: { blackjack: game.getState() } });
	} catch (err) {
		res.status(500).json({ success: false, message: err.message });
	}
};

const executeMove = async (userId, move) => {
	if (!["hit", "stand"].includes(move)) {
		throw new Error("Movimiento inválido.");
	}

	/*const game = games.get(userId);
	if (!game || game.finished) throw new Error("No hay partida activa.");
	*/

	const loadedGame = await Game.findUserActiveGame(userId, "blackjack");
	if (!loadedGame) throw new Error("No hay partida activa.");

	const game = new Blackjack(loadedGame.gameState);
	if (move === "hit") {
		game.playerHit();
	} else if (move === "stand") {
		game.playerStand();
	}

	const currentState = game.getState();
	const betAmount = loadedGame.players[0].playerState.bet;

	if (currentState.finished) {
		let finalAmount = 0;
		let transactionType = "";

		if (currentState.winner === "player") {
			finalAmount = betAmount * 2;
			transactionType = "win";
		} else if (currentState.winner === "draw") {
			finalAmount = betAmount;
			transactionType = "draw";
		}

		if (finalAmount > 0) {
			await User.resolveBet(userId, finalAmount, "blackjack", transactionType);
		}

		await Game.removeGame(loadedGame.gameId);
	} else {
		await Game.updateGameState(loadedGame.gameId, game.getInternalState());
		await Game.updatePlayerState(loadedGame.gameId, userId, {
			playerHand: game.playerHand,
			bet: betAmount,
		});
	}

	return currentState;
};

const hit = async (req, res) => {
	try {
		const gameState = await executeMove(req.user.id, "hit");
		res.json({ success: true, games: { blackjack: gameState } });
	} catch (err) {
		res.status(400).json({ success: false, message: err.message });
	}
};

const stand = async (req, res) => {
	try {
		const gameState = await executeMove(req.user.id, "stand");
		res.json({ success: true, games: { blackjack: gameState } });
	} catch (err) {
		res.status(400).json({ success: false, message: err.message });
	}
};

module.exports = { startGame, hit, stand };
