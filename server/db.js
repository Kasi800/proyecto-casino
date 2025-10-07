const mysql = require("mysql2");

const connection = mysql.createConnection({
	host: "localhost",
	port: 3306,
	user: "root",
	password: process.env.DB_PASSWORD,
	database: "casino_db",
});

connection.connect((err) => {
	if (err) {
		console.error("Error al conectar con la base de datos:", err);
	} else {
		console.log("DB conectada");
	}
});

module.exports = connection;
