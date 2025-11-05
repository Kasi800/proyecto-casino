const db = require("../db.js");

//Funciones básicas de usuario

/**
 * Crea un nuevo usuario en la base de datos.
 * @param {object} user - Objeto con { username, email, password }.
 * @returns {Promise<object>} El resultado de la consulta de inserción.
 */
const createUser = async (user) => {
	const sql = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
	return await db.query(sql, [user.username, user.email, user.password]);
};

/**
 * Actualiza el perfil de un usuario de forma dinámica y segura.
 * @param {number} userId - El ID del usuario a actualizar.
 * @param {object} newProfileData - Un objeto con los campos a actualizar.
 * @param {string} [newProfileData.username] - El nuevo nombre de usuario.
 * @param {string} [newProfileData.email] - El nuevo email.
 * @param {string} [newProfileData.password] - La nueva contraseña.
 * @returns {Promise<object>} El resultado de la consulta de actualización.
 * @throws {Error} Si no se proporcionan datos para actualizar.
 */
const updateProfile = async (userId, newProfileData) => {
	// --- 1. Construcción Dinámica ---
	// Lista blanca de campos que permitimos actualizar.
	const allowedFields = ["username", "email", "password"];

	const setClauses = []; // "username = ?", "email = ?"
	const values = []; // los valores en orden

	for (const field of allowedFields) {
		// Comprueba si el campo existe en el objeto newProfileData
		if (newProfileData[field] !== undefined) {
			setClauses.push(`${field} = ?`);
			values.push(newProfileData[field]);
		}
	}

	// Si no se proporcionó ningún campo válido, lanza un error.
	if (setClauses.length === 0) {
		throw new Error("No hay datos válidos para actualizar.");
	}

	// --- 2. Ensamblaje y Ejecución ---

	// Añade el userId al final del array de valores (para el WHERE)
	values.push(userId);

	// Une las cláusulas SET: "username = ?, email = ?"
	const sql = `UPDATE users SET ${setClauses.join(", ")} WHERE id = ?`;

	return await db.query(sql, values);
};

/**
 * Busca un usuario por su id.
 * @param {string} userId - El id del usuario a buscar.
 * @returns {Promise<object|null>} El objeto del usuario si se encuentra, o null.
 */
const deleteUser = async (userId) => {
	const sql = "UPDATE users SET is_active = false WHERE id = ?";
	return await db.query(sql, [userId]);
};

/**
 * Busca un usuario por su dirección de email.
 * @param {string} email - El email del usuario a buscar.
 * @returns {Promise<object|null>} El objeto del usuario si se encuentra, o null.
 */
const findByEmail = async (email) => {
	const sql = "SELECT * FROM users WHERE email = ? AND is_active = true";
	const [rows] = await db.query(sql, [email]);
	return rows[0] || null;
};

/**
 * Busca un usuario por su id.
 * @param {string} userId - El id del usuario a buscar.
 * @returns {Promise<object|null>} El objeto del usuario si se encuentra, o null.
 */
const findById = async (userId) => {
	const sql =
		"SELECT id, username, email, credits, created_at FROM users WHERE id = ?";
	const [rows] = await db.query(sql, [userId]);
	return rows[0] || null;
};

/**
 * Obtiene todos los usuarios activos de la base de datos.
 * @returns {Promise<Array<object>>} Un array con todos los usuarios.
 */
const findAll = async (limit) => {
	const sql =
		"SELECT id,username,credits,created_at FROM users WHERE is_active = true LIMIT ?";
	const [rows] = await db.query(sql, [limit]);
	return rows || [];
};

//Funciones de creditos y transacciones

/**
 * Obtiene el saldo de créditos actual de un usuario.
 * @param {number} userId - El ID del usuario.
 * @returns {Promise<number|null>} El saldo de créditos.
 */
const getCredits = async (userId) => {
	const sql = "SELECT credits FROM users WHERE id = ?";
	const [rows] = await db.query(sql, [userId]);
	if (rows.length == 0) {
		throw new Error("Usuario no encontrado");
	}
	return parseFloat(rows[0].credits);
};

const getGlobalTop = async (limit) => {
	const sql =
		"SELECT id,username,credits FROM users WHERE is_active = true ORDER BY credits DESC LIMIT ?";
	const [rows] = await db.query(sql, [limit]);
	return rows || [];
};

/**
 * Resta créditos de la cuenta del usuario y crea un registro de transacción.
 * @param {number} userId - El ID del usuario que apuesta.
 * @param {number} amount - El monto a apostar (debe ser positivo).
 * @param {string} gameType - El tipo de juego (ej: "blackjack", "poker").
 * @returns {Promise<number>} El nuevo saldo de créditos actualizado.
 * @throws {Error} Si los créditos son insuficientes o si ocurre un error de BBDD.
 */
const placeBet = async (userId, amount, gameType) => {
	if (amount <= 0) {
		throw new Error("El monto de la apuesta debe ser positivo.");
	}
	let connection;

	try {
		// 1. Iniciar
		connection = await db.getConnection(); // Obtener una conexión del pool
		await connection.beginTransaction();

		// 2. Intenta restar los créditos Y comprueba que el saldo no baje de 0
		const updateSql =
			"UPDATE users SET credits = credits - ? WHERE id = ? AND credits >= ?";
		const [result] = await connection.query(updateSql, [
			amount,
			userId,
			amount,
		]);

		// 3. Comprobar si la actualización falló (créditos insuficientes)
		if (result.affectedRows === 0) {
			throw new Error("Créditos insuficientes");
		}

		// 4. Registrar la transacción
		const transactionSql =
			"INSERT INTO transactions (user_id, amount, type) VALUES (?, ?, ?)";
		// Usamos un valor negativo para las apuestas
		await connection.query(transactionSql, [
			userId,
			-amount,
			`${gameType}_bet`,
		]);

		// 5. Si todo fue bien, confirmar los cambios
		await connection.commit();

		// Devolver el nuevo saldo
		const newCredits = await getCredits(userId); // Leer el saldo actualizado
		return newCredits;
	} catch (error) {
		// 6. Si algo falló, revertir TODOS los cambios
		if (connection) {
			await connection.rollback();
		}
		throw error;
	} finally {
		// 7. Liberar la conexión al pool
		if (connection) {
			connection.release();
		}
	}
};

/**
 * Añade créditos a la cuenta del usuario y crea un registro de transacción.
 * @param {number} userId - El ID del usuario.
 * @param {number} amount - El monto a añadir (debe ser positivo).
 * @param {string} gameType - El tipo de juego o fuente (ej: "blackjack", "system").
 * @param {string} transactionType - El tipo de ganancia (ej: "win", "reward").
 * @returns {Promise<number>} El nuevo saldo de créditos actualizado.
 * @throws {Error} Si ocurre un error de BBDD.
 */
const addCredits = async (userId, amount, gameType, transactionType) => {
	if (amount <= 0) {
		throw new Error("El monto de la apuesta debe ser positivo.");
	}

	let connection;
	try {
		// 1. Iniciar
		connection = await db.getConnection();
		await connection.beginTransaction();

		// 2. Añadir créditos
		const updateSql = "UPDATE users SET credits = credits + ? WHERE id = ?";
		await connection.query(updateSql, [amount, userId]);

		// 3. Registrar transacción
		const transactionSql =
			"INSERT INTO transactions (user_id, amount, type) VALUES (?, ?, ?)";
		await connection.query(transactionSql, [
			userId,
			amount,
			`${gameType}_${transactionType}`,
		]);

		// 4. Confirmar
		await connection.commit();

		// Devolver el nuevo saldo
		const newCredits = await getCredits(userId); // Leer el saldo actualizado
		return newCredits;
	} catch (error) {
		// 5. Si algo falló, revertir TODOS los cambios
		if (connection) {
			await connection.rollback();
		}
		throw error;
	} finally {
		// 6. Liberar la conexión al pool
		if (connection) {
			connection.release();
		}
	}
};

/**
 * Obtiene el historial de transacciones de un usuario, ordenado por fecha.
 * @param {number} userId - El ID del usuario.
 * @returns {Promise<Array<object>>} Un array con las transacciones del usuario.
 */
const getTransactions = async (userId) => {
	const sql =
		"SELECT * FROM transactions WHERE user_id = ? ORDER BY timestamp DESC";
	const [rows] = await db.query(sql, [userId]);
	return rows || [];
};

module.exports = {
	createUser,
	updateProfile,
	deleteUser,
	findByEmail,
	findById,
	findAll,
	addCredits,
	placeBet,
	getTransactions,
	getGlobalTop,
};
