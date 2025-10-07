const db = require("../db.js");
module.exports = {
	createUser: (user, callback) => {
		const sql =
			"INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
		db.query(sql, [user.username, user.email, user.password], callback);
	},

	findByEmail: (email, callback) => {
		const sql = "SELECT * FROM users WHERE email = ?";
		db.query(sql, [email], callback);
	},

	findAll: (callback) => {
		const sql = "SELECT * FROM users";
		db.query(sql, callback);
	},

	getCredits: (userId, callback) => {
		const sql = "SELECT credits FROM users WHERE id = ?";
		db.query(sql, [userId], callback);
	},

	addCredits: (userId, amount, callback) => {
		this.getCredits(userId, (err, results) => {
			if (err) return callback(err);

			const currentCredits = results[0].credits;
			const newCredits = currentCredits + amount;
			const sqlUpdate = "UPDATE users SET credits = ? WHERE id = ?";

			db.query(sqlUpdate, [newCredits, userId], (err2) => {
				if (err2) return callback(err2);
				const sqlInsert =
					"INSERT INTO transactions (user_id, amount, type) VALUES (?, ?, ?)";
				db.query(sqlInsert, [userId, amount, "deposit"], callback);
			});
		});
	},

	betCredits: (userId, amount, callback) => {
		this.getCredits(userId, (err, results) => {
			if (err) return callback(err);

			const currentCredits = results[0].credits;
			if (currentCredits < amount) {
				return callback(new Error("Créditos insuficientes"));
			}

			const newCredits = currentCredits - amount;
			const sqlUpdate = "UPDATE users SET credits = ? WHERE id = ?";

			db.query(sqlUpdate, [newCredits, userId], (err2) => {
				if (err2) return callback(err2);

				const sqlInsert =
					"INSERT INTO transactions (user_id, amount, type) VALUES (?, ?, ?)";
				db.query(sqlInsert, [userId, amount, "bet"], callback);
			});
		});
	},

	winCredits: (userId, amount, winType, callback) => {
		const validTypes = ["player", "player_blackjack"];
		if (!validTypes.includes(winType)) {
			return callback(new Error("Tipo de transacción inválido"));
		}

		this.getCredits(userId, (err, results) => {
			if (err) return callback(err);

			const currentCredits = results[0].credits;
			const bonus = winType == validTypes[0] ? 2 : 2.5;
			const newCredits = currentCredits + amount * bonus;
			const sqlUpdate = "UPDATE users SET credits = ? WHERE id = ?";

			db.query(sqlUpdate, [newCredits, userId], (err2) => {
				if (err2) return callback(err2);
				const sqlInsert =
					"INSERT INTO transactions (user_id, amount, type) VALUES (?, ?, ?)";
				db.query(sqlInsert, [userId, amount, "win"], callback);
			});
		});
	},

	lossCredits: (userId, amount, callback) => {
		const sql =
			"INSERT INTO transactions (user_id, amount, type) VALUES (?, ?, ?)";
		db.query(sql, [userId, amount, "loss"], callback);
	},

	getTransactions: (userId, callback) => {
		const sql =
			"SELECT * FROM transactions WHERE user_id = ? ORDER BY timestamp DESC";
		db.query(sql, [userId], callback);
	},
};
