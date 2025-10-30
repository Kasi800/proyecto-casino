const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel.js");
const config = require("../config/config.js");

const register = async (req, res) => {
	const { username, email, password } = req.body;

	try {
		const hashed = bcrypt.hashSync(password, 10);
		await User.createUser({ username, email, password: hashed });
		login(req, res);
	} catch (err) {
		console.log(err);
		if (err.code === "ER_DUP_ENTRY") {
			return res
				.status(409)
				.json({ message: "El correo electrónico ya está en uso." });
		}
		if (err) return res.status(500).send("Error al registrar");
	}
};

const login = async (req, res) => {
	const { email, password } = req.body;

	try {
		const user = await User.findByEmail(email);
		if (!user) {
			return res.status(401).json({ message: "Credenciales inválidas" });
		}

		const valid = await bcrypt.compare(password, user.password);
		if (!valid) {
			return res.status(401).json({ message: "Credenciales inválidas" });
		}

		const token = jwt.sign({ id: user.id }, config.jwtSecret, {
			expiresIn: "1h",
		});

		res.cookie("token", token, {
			httpOnly: true,
			secure: false,
			sameSite: "Lax",
		});
		user.password = undefined;

		res.json({ success: true, user });
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Error en el servidor durante el login" });
	}
};

const logout = (req, res) => {
	res.cookie("token", "", {
		httpOnly: true,
		expires: new Date(0),
	});
	res.status(200).json({ message: "Sesión cerrada correctamente" });
};

module.exports = { register, login, logout };
