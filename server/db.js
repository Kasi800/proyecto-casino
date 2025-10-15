const mysql = require("mysql2/promise");
const config = require("./config/config.js").db;

const pool = mysql.createPool({
	host: config.host,
	port: config.port,
	user: config.user,
	password: config.password,
	database: config.database,
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0,
});

pool
	.getConnection()
	.then((connection) => {
		console.log("DB conectada correctamente a través del pool");
		connection.release();
	})
	.catch((err) => {
		console.error("Error al conectar con la base de datos:", err);
	});

module.exports = pool;
