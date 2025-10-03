const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel.js");

exports.register = (req, res) => {
	const { username, email, password } = req.body;
	const hashed = bcrypt.hashSync(password, 10);
	User.createUser({ username, email, password: hashed }, (err) => {
		if (err) return res.status(500).send("Error al registrar");
		res.cookie("token", token, {
			httpOnly: true,
			secure: false,
			sameSite: "Strict",
		});
		res.status(201).send("Usuario creado");
		this.login(req, res);
	});
};

exports.login = (req, res) => {
	const { email, password } = req.body;
	User.findByEmail(email, (err, results) => {
		if (err || results.length === 0)
			return res.status(401).send("Credenciales inválidas");
		const user = results[0];
		const valid = bcrypt.compareSync(password, user.password);
		if (!valid) return res.status(401).send("Contraseña incorrecta");
		const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
			expiresIn: "1h",
		});
		res.cookie("token", token, {
			httpOnly: true, // 🔒 no accesible por JS
			secure: false, // 🔒 solo HTTPS (si trabajas local en http://localhost desactívalo temporalmente)
			sameSite: "Strict", // evita CSRF
		});
		user.password = undefined;
		res.json({ success: true, user: user });
	});
};

exports.logout = (req, res) => {
	res.clearCookie("token", {
		httpOnly: true,
		secure: false,
		sameSite: "Strict",
	});
	res.json({ message: "Sesión cerrada" });
};

exports.protected = (req, res) => {
	const token = req.cookies.token;
	if (!token) return res.status(401).json({ message: "No autorizado" });

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		res.json({ message: "Acceso autorizado", user: decoded });
	} catch {
		res.status(403).json({ message: "Token inválido" });
	}
};
