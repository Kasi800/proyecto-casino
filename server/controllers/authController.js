const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel.js");
const config = require("../config/config.js");

/**
 * Función helper para crear y enviar el token como cookie y JSON
 */
const sendTokenResponse = (user, res) => {
	// 1. Crear el Token
	const token = jwt.sign({ id: user.id }, config.jwtSecret, {
		expiresIn: "1h",
	});

	// 2. Configurar la Cookie
	res.cookie("token", token, {
		httpOnly: true,
		secure: false,
		sameSite: "strict",
		maxAge: 3600 * 1000,
	});

	// 3. Enviar respuesta JSON
	res.status(200).json({
		id: user.id,
		username: user.username,
		email: user.email,
		credits: user.credits,
	});
};

const register = async (req, res) => {
	const { username, email, password } = req.body;

	try {
		const hashed = await bcrypt.hash(password, 10);
		const [result] = await User.createUser({
			username,
			email,
			password: hashed,
		});

		const newUser = await User.findByEmail(email);

		sendTokenResponse(newUser, res);
	} catch (err) {
		console.log(err);
		if (err.code === "ER_DUP_ENTRY") {
			return res
				.status(409)
				.json({ message: "El correo electrónico ya está en uso." });
		}
		res.status(500).send("Error al registrar", err);
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

		sendTokenResponse(user, res);
	} catch (err) {
		res
			.status(500)
			.json({ message: "Error en el servidor durante el login", err });
	}
};

const logout = (req, res) => {
	res.cookie("token", "", {
		httpOnly: true,
		expires: new Date(0),
	});
	res.status(200).json({ message: "Sesión cerrada correctamente", err });
};

module.exports = { register, login, logout };
