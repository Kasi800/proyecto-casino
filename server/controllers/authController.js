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

	const isProduction = process.env.NODE_ENV === "production";

	// 2. Configurar la Cookie
	res.cookie("token", token, {
		httpOnly: true,
		secure: isProduction,
		sameSite: "strict",
		maxAge: 3600 * 1000,
	});

	// 3. Enviar respuesta JSON
	res.status(200).json({
		message: "Autenticación exitosa",
		user: {
			id: user.id,
			username: user.username,
			email: user.email,
			credits: user.credits
		}
	});
};

/**
 * Registra un nuevo usuario, hashea su contraseña y lo loguea automáticamente.
 */
const register = async (req, res) => {
	const { username, email, password } = req.body;

	try {
		const hashed = await bcrypt.hash(password, 10);
		await User.createUser({
			username,
			email,
			password: hashed,
		});

		const newUser = await User.findByEmail(email);

		sendTokenResponse(newUser, res);
	} catch (err) {
		console.error("Error en register:", err);

		if (err.code === "ER_DUP_ENTRY") {
			return res
				.status(409)
				.json({ message: "El nombre de usuario o correo electrónico ya están en uso." });
		}

		return res.status(500).json({
			message: "Error interno al registrar usuario",
			error: err
		});
	}
};

/**
 * Autentica a un usuario verificando email y contraseña.
 */
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
		console.error("Error en login:", err);
		res
			.status(500)
			.json({ message: "Error en el servidor durante el login", error: err });
	}
};

/**
 * Cierra la sesión eliminando la cookie del token.
 */
const logout = (req, res) => {
	try {
		res.cookie("token", "", {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			expires: new Date(0),
		});
		res.status(200).json({ message: "Sesión cerrada correctamente" });
	} catch (err) {
		console.error("Error en logout:", err)
		res
			.status(500)
			.json({ message: "Error en el servidor durante el logout", error: err });
	}
};

module.exports = { register, login, logout };
