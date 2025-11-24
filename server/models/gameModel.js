const db = require("../db.js");

const createGame = async (
	gameType,
	initialGameState,
	creatorUserId,
	creatorPlayerState
) => {
	let connection;
	try {
		// 1. "Pedimos prestada" una conexión del pool
		connection = await db.getConnection();

		// 2. Iniciamos la transacción en esa conexión específica
		await connection.beginTransaction();

		const gameStateString = JSON.stringify(initialGameState);
		const playerStateString = JSON.stringify(creatorPlayerState);

		// 3. Ejecutamos la primera consulta
		const [gameResult] = await connection.query(
			"INSERT INTO games (game_type, game_state, turn_of_user_id) VALUES (?, ?, ?)",
			[gameType, gameStateString, creatorUserId]
		);
		const gameId = gameResult.insertId;

		// 4. Ejecutamos la segunda consulta
		await connection.query(
			"INSERT INTO game_players (game_id, user_id, player_state) VALUES (?, ?, ?)",
			[gameId, creatorUserId, playerStateString]
		);

		// 5. Si todo fue bien, confirmamos los cambios
		await connection.commit();
		return gameId;
	} catch (err) {
		// 6. Si algo falló, deshacemos todos los cambios
		if (connection) await connection.rollback();
		throw err; // Propagamos el error
	} finally {
		// 7. Pase lo que pase, devolvemos la conexión al pool para que otros la usen
		if (connection) connection.release();
	}
};

const findGameById = async (gameId) => {
	const [gameRows] = await db.query("SELECT * FROM games WHERE game_id = ?", [
		gameId,
	]);
	const [playerRows] = await db.query(
		"SELECT * FROM game_players WHERE game_id = ?",
		[gameId]
	);

	if (!gameRows[0]) {
		return null;
	}

	const gameData = gameRows[0];
	const gameState = gameData.game_state;
	const players = playerRows.map((p) => ({
		userId: p.user_id,
		playerState: p.player_state,
	}));

	return {
		gameId: gameData.game_id,
		gameType: gameData.game_type,
		gameState: gameState,
		turnOfUserId: gameData.turn_of_user_id,
		players: players,
	};
};

const addPlayerToGame = async (gameId, userId, playerState) => {
	const playerStateString = JSON.stringify(playerState);
	const sql =
		"INSERT INTO game_players (game_id, user_id, player_state) VALUES (?, ?, ?)";
	const [result] = await db.query(sql, [gameId, userId, playerStateString]);
	return result;
};

const findUserActiveGame = async (userId, gameType) => {
	// Esta consulta une las dos tablas para encontrar una partida de un tipo
	// específico en la que el usuario esté participando.
	const sql = `
        SELECT g.* FROM games g
        JOIN game_players gp ON g.game_id = gp.game_id
        WHERE gp.user_id = ? AND g.game_type = ? AND g.status = 'active'
    `;
	const [rows] = await db.query(sql, [userId, gameType]);

	if (rows.length === 0) {
		return null;
	}
	// Si la encuentra, reutiliza findGameById para obtener todos los detalles
	return findGameById(rows[0].game_id);
};

const updateGameState = async (gameId, newGameState, nextTurnUserId) => {
	const gameStateString = JSON.stringify(newGameState);
	const sql =
		"UPDATE games SET game_state = ?, turn_of_user_id = ? WHERE game_id = ?";
	const [result] = await db.query(sql, [
		gameStateString,
		nextTurnUserId,
		gameId,
	]);
	return result;
};

const updatePlayerState = async (gameId, userId, newPlayerState) => {
	const playerStateString = JSON.stringify(newPlayerState);
	const sql =
		"UPDATE game_players SET player_state = ? WHERE game_id = ? AND user_id = ?";
	const [result] = await db.query(sql, [playerStateString, gameId, userId]);
	return result;
};

const removeGame = async (gameId) => {
	const sql = "UPDATE games SET status = 'finished' WHERE game_id = ?";
	const [result] = await db.query(sql, [gameId]);
	return result;
};

module.exports = {
	createGame,
	findGameById,
	addPlayerToGame,
	findUserActiveGame,
	updateGameState,
	updatePlayerState,
	removeGame,
};
