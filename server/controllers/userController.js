const User = require("../models/userModel.js");
const bcrypt = require("bcrypt");

/**
 * Obtiene el perfil del usuario actualmente autenticado.
 * Usa el ID extraído del token JWT (req.user.id).
 */
const getMe = async (req, res) => {
	try {
		const user = await User.findById(req.user.id);
		res.status(200).json({
			user: {
				id: user.id,
				username: user.username,
				email: user.email,
				credits: user.credits,
				created_at: user.created_at
			}
		});
	} catch (err) {
		console.error("Error en getMe:", err);
		res
			.status(500)
			.json({ message: "Error en el servidor durante la busqueda", error: err });
	}
};

/**
 * Actualiza los datos del usuario (username, email, password).
 * Si se envía una contraseña, se hashea antes de guardarla.
 */
const updateMe = async (req, res) => {
	try {
		if (req.body.password) {
			req.body.password = await bcrypt.hash(req.body.password, 10);
		}

		await User.updateProfile(req.user.id, req.body);
		const updatedUser = await User.findById(req.user.id);

		res.status(200).json({
			user: {
				id: updatedUser.id,
				username: updatedUser.username,
				email: updatedUser.email,
				credits: updatedUser.credits
			}
		});
	} catch (err) {
		console.error("Error en updateMe:", err);
		res
			.status(500)
			.json({ message: "Error en el servidor durante la actualización", error: err });
	}
};

/**
 * Realiza un "soft delete" (desactivación) del usuario actual.
 */
const deleteMe = async (req, res) => {
	try {
		const user = await User.deleteUser(req.user.id);
		res.status(200).json({ message: "Usuario eliminado correctamente" });
	} catch (err) {
		console.error("Error en deleteMe:", err);
		res
			.status(500)
			.json({ message: "Error en el servidor durante el borrado", error: err });
	}
};

/**
 * Obtiene el perfil público de cualquier usuario por su ID.
 */
const getUserProfile = async (req, res) => {
	try {
		const user = await User.findById(req.params.id);

		if (!user) {
			return res.status(404).json({ message: "Usuario no encontrado" });
		}

		res.status(200).json({
			user: {
				id: user.id,
				username: user.username,
				credits: user.credits,
				is_active: user.is_active,
				created_at: user.created_at
			}
		});
	} catch (err) {
		console.error("Error en getUserProfile:", err);
		res
			.status(500)
			.json({ message: "Error en el servidor durante la busqueda", error: err });
	}
};

/**
 * Obtiene el TOP 10 global de usuarios con más créditos.
 */
const getRankings = async (req, res) => {
	try {
		const topUsers = await User.getGlobalTop(10);
		res.status(200).json({ rankings: topUsers });
	} catch (err) {
		console.error("Error en getRankings:", err);
		res
			.status(500)
			.json({ message: "Error en el servidor al obtener el ranking", error: err });
	}
};

module.exports = { getMe, updateMe, deleteMe, getUserProfile, getRankings };
