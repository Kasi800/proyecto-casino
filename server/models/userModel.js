const db = require("../db.js");

//Funciones básicas de usuario
const createUser = (user) => {
	const sql = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
	return db.query(sql, [user.username, user.email, user.password]);
};

const findByEmail = async (email) => {
	const sql = "SELECT * FROM users WHERE email = ?";
	const [rows] = await db.query(sql, [email]);
	return rows[0] || null;
};

const findAll = async () => {
	const sql = "SELECT * FROM users";
	const [rows] = await db.query(sql);
	return rows || [];
};

//Funciones de creditos y transacciones
const getCredits = async (userId) => {
	const sql = "SELECT credits FROM users WHERE id = ?";
	const [rows] = await db.query(sql, [userId]);
	if (rows.length == 0) {
		throw new Error("Usuario no encontrado");
	}
	return rows[0].credits || null;
};

const updateCredits = (userId, newCredits) => {
	const sql = "UPDATE users SET credits = ? WHERE id = ?";
	return db.query(sql, [newCredits, userId]);
};

const createTransaction = (userId, amount, type) => {
	const sql =
		"INSERT INTO transactions (user_id, amount, type) VALUES (?, ?, ?)";
	return db.query(sql, [userId, amount, type]);
};

const addCredits = async (userId, amount) => {
	const currentCredits = await getCredits(userId);
	const newCredits = currentCredits + amount;
	await updateCredits(userId, newCredits);
	return createTransaction(userId, amount, "deposit");
};

const placeBet = async (userId, amount, gameType) => {
	if (amount <= 0) {
		throw new Error("El monto de la apuesta debe ser positivo.");
	}

	const currentCredits = await getCredits(userId);
	if (currentCredits < amount) {
		throw new Error("Créditos insuficientes");
	}

	const newCredits = currentCredits - amount;
	await updateCredits(userId, newCredits);
	return createTransaction(userId, amount, `${gameType}_bet`);
};

const resolveBet = async (userId, amount, gameType, transactionType) => {
	if (amount <= 0) {
		throw new Error("El monto de la apuesta debe ser positivo.");
	}

	const currentCredits = await getCredits(userId);
	const newCredits = currentCredits + amount;
	await updateCredits(userId, newCredits);
	return createTransaction(userId, amount, `${gameType}_${transactionType}`);
};

const getTransactions = (userId) => {
	const sql =
		"SELECT * FROM transactions WHERE user_id = ? ORDER BY timestamp DESC";
	const [rows] = db.query(sql, [userId]);
	return rows || [];
};

module.exports = {
	createUser,
	findByEmail,
	findAll,
	addCredits,
	placeBet,
	resolveBet,
	getTransactions,
};
