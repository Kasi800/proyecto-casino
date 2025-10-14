const db = require("../db.js");

//Funciones básicas de usuario
const createUser = (user) => {
	return new Promise((resolve, reject) => {
		const sql =
			"INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
		db.query(sql, [user.username, user.email, user.password], (err, result) => {
			if (err) return reject(err);
			resolve(result);
		});
	});
};

const findByEmail = (email) => {
	return new Promise((resolve, reject) => {
		const sql = "SELECT * FROM users WHERE email = ?";
		db.query(sql, [email], (err, result) => {
			if (err) return reject(err);
			resolve(result[0] || null);
		});
	});
};

const findAll = () => {
	return new Promise((resolve, reject) => {
		const sql = "SELECT * FROM users";
		db.query(sql, (err, result) => {
			if (err) return reject(err);
			resolve(result || []);
		});
	});
};

//Funciones de creditos y transacciones
const getCredits = (userId) => {
	return new Promise((resolve, reject) => {
		const sql = "SELECT credits FROM users WHERE id = ?";
		db.query(sql, [userId], (err, result) => {
			if (err) reject(err);
			if (result.length === 0)
				return reject(new Error("Usuario no encontrado"));
			resolve(result[0].credits || null);
		});
	});
};

const updateCredits = (userId, newCredits) => {
	return new Promise((resolve, reject) => {
		const sql = "UPDATE users SET credits = ? WHERE id = ?";
		db.query(sql, [newCredits, userId], (err, result) => {
			if (err) return reject(err);
			resolve(result);
		});
	});
};

const createTransaction = (userId, amount, type) => {
	return new Promise((resolve, reject) => {
		const sql =
			"INSERT INTO transactions (user_id, amount, type) VALUES (?, ?, ?)";
		db.query(sql, [userId, amount, type], (err, result) => {
			if (err) return reject(err);
			resolve(result);
		});
	});
};

const addCredits = async (userId, amount) => {
	const currentCredits = await getCredits(userId);
	const newCredits = currentCredits + amount;
	await updateCredits(userId, newCredits);
	return await createTransaction(userId, amount, "deposit");
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
	return await createTransaction(userId, amount, `${gameType}_bet`);
};

const resolveBet = async (userId, amount, gameType, transactionType) => {
	const currentCredits = await getCredits(userId);
	const newCredits = currentCredits + amount;
	await updateCredits(userId, newCredits);
	return await createTransaction(
		userId,
		amount,
		`${gameType}_${transactionType}`
	);
};

const getTransactions = (userId) => {
	return new Promise((resolve, reject) => {
		const sql =
			"SELECT * FROM transactions WHERE user_id = ? ORDER BY timestamp DESC";
		db.query(sql, [userId], (err, results) => {
			if (err) return reject(err);
			resolve(results || []);
		});
	});
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
