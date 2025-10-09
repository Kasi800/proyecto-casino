const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel.js");
const config = require("../config/config.js");

const register = (req, res) => {
	const { username, email, password } = req.body;
	const hashed = bcrypt.hashSync(password, 10);
	User.createUser({ username, email, password: hashed }, (err) => {
		console.log(err);

		if (err) return res.status(500).send("Error al registrar");
		login(req, res);
	});
};

const login = (req, res) => {
	const { email, password } = req.body;
	User.findByEmail(email, (err, results) => {
		if (err || results.length === 0)
			return res.status(401).send("Credenciales inválidas");
		const user = results[0];
		const valid = bcrypt.compareSync(password, user.password);
		if (!valid) return res.status(401).send("Contraseña incorrecta");
		const token = jwt.sign({ id: user.id }, config.jwtSecret, {
			expiresIn: "1h",
		});
		res.cookie("token", token, {
			httpOnly: true,
			secure: false,
			sameSite: "Lax",
		});
		user.password = undefined;
		res.json({ success: true, user: user });
	});
};

const logout = (req, res) => {
	res.clearCookie("token", {
		httpOnly: true,
		secure: false,
		sameSite: "Lax",
	});
	res.json({ message: "Sesión cerrada" });
};

module.exports = { register, login, logout };
