const config = {
	port: process.env.PORT || 3001,
	frontendIps: process.env.FRONTEND_IPS || "http://localhost:3000",
	db: {
		host: process.env.DB_HOST || "localhost",
		user: process.env.DB_USER || "root",
		password: process.env.DB_PASSWORD || "",
		database: process.env.DB_NAME || "casino_db",
		port: process.env.DB_PORT || 3306,
	},
	jwtSecret: process.env.JWT_SECRET || "sin jwt secreto",
};

module.exports = config;
