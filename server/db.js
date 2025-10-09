const mysql = require("mysql2");
const config = require("./config/config.js").db;

const connection = mysql.createConnection({
	host: config.host,
	port: config.port,
	user: config.user,
	password: config.password,
	database: config.database,
});

connection.connect((err) => {
	if (err) {
		console.error("Error al conectar con la base de datos:", err);
	} else {
		console.log("DB conectada");
	}
});

module.exports = connection;
