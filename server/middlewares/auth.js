const jwt = require("jsonwebtoken");
module.exports = (req, res, next) => {
	const token = req.cookies.token;

	if (!token) return res.status(401).json({ message: "No autorizado" });

	try {
		const decoded = jwt.verify(token, config.jwtSecret);
		req.user = decoded;
		next();
	} catch {
		res.status(403).json({ message: "Token inválido" });
	}
};
