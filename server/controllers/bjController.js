const Blackjack = require("../models/Blackjack.js");
const User = require("../models/userModel.js");
const games = new Map();

const startGame = async (req, res) => {
	const userId = req.user.id;
	const betAmount = 1;

	if (!betAmount || betAmount <= 0) {
		return res
			.status(400)
			.json({ message: "Se requiere un monto de apuesta válido." });
	}

	try {
		let game = games.get(userId);
		if (!game || game.getState().finished) {
			game = new Blackjack();
			games.set(userId, game);
			// 1. Deducir la apuesta de los créditos del usuario ANTES de empezar
			// Usaremos la función genérica que creamos. La apuesta es una pérdida inicial.
			await User.placeBet(userId, betAmount, "blackjack");
		}

		// 2. Crear una nueva instancia del juego
		//const game = new Blackjack();

		// 3. Guardar el estado inicial del juego en la base de datos
		// La clase del juego necesita una forma de exportar su estado interno
		// await ActiveGame.save(userId, 'blackjack', game.getInternalState());

		// 4. Enviar el estado visible al jugador
		res.json({ success: true, games: { blackjack: game.getState() } });
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
};

const executeMove = async (userId, move) => {
	if (!["hit", "stand"].includes(move)) {
		throw new Error("Movimiento inválido.");
	}

	// 1. Cargar la partida guardada desde la base de datos
	// const savedGame = await ActiveGame.findByUserId(userId, 'blackjack');
	// if (!savedGame) {
	//     return res.status(404).json({ message: "No se encontró una partida activa." });
	// }

	// 2. Recrear la instancia del juego a partir del estado guardado
	// const game = new Blackjack(savedGame.state);

	// (Por ahora, usaremos una versión simplificada sin BD para el ejemplo)
	// ESTA PARTE ES SOLO PARA ILUSTRAR, DEBERÍA USAR LA BD
	const game = games.get(userId);
	if (!game || game.finished) throw new Error("No hay partida activa.");

	// 3. Realizar el movimiento
	if (move === "hit") {
		game.playerHit();
	} else if (move === "stand") {
		game.playerStand();
	}

	// 4. Comprobar si el juego ha terminado
	const currentState = game.getState();

	if (currentState.finished) {
		// Lógica para calcular las ganancias
		let finalAmount = 0;
		const betAmount = 1; // Este valor también debería guardarse en la BD
		let transactionType = "";

		if (currentState.winner === "player") {
			finalAmount = betAmount * 2; // Gana 2 a 1
			transactionType = "win";
		} else if (currentState.winner === "player_blackjack") {
			finalAmount = betAmount * 2.5; // Gana 2.5 a 1
			transactionType = "win_blackjack";
		} else if (currentState.winner === "draw") {
			finalAmount = betAmount; // Empate, se devuelve la apuesta
			transactionType = "draw";
		}
		// Si el ganador es 'dealer', finalAmount es 0 (la apuesta ya se cobró)

		// 5. Aplicar el resultado a los créditos del usuario
		if (finalAmount > 0) {
			await User.resolveBet(userId, finalAmount, "blackjack", transactionType);
		}

		// 6. Borrar la partida de la base de datos
		// await ActiveGame.delete(userId, 'blackjack');
	} else {
		// 7. Si el juego no ha terminado, guardar el nuevo estado
		// await ActiveGame.update(userId, 'blackjack', game.getInternalState());
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
