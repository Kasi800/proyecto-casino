const User = require("../models/userModel.js");
const bcrypt = require("bcrypt");

const getMe = async (req, res) => {
	try {
		const user = await User.findById(req.user.id);
		res.status(200).json({
			id: user.id,
			username: user.username,
			email: user.email,
			credits: user.credits,
			created_at: user.created_at,
		});
	} catch (err) {
		res
			.status(500)
			.json({ message: "Error en el servidor durante la busqueda", err });
	}
};

const updateMe = async (req, res) => {
	try {
		if (req.body.password) {
			req.body.password = await bcrypt.hash(req.body.password, 10);
		}

		await User.updateProfile(req.user.id, req.body);
		const updatedUser = await User.findById(req.user.id);

		res.status(200).json({
			id: updatedUser.id,
			username: updatedUser.username,
			email: updatedUser.email,
			credits: updatedUser.credits,
		});
	} catch (err) {
		res
			.status(500)
			.json({ message: "Error en el servidor durante la actualización", err });
	}
};

const deleteMe = async (req, res) => {
	try {
		const user = await User.deleteUser(req.user.id);
		res.status(200).json({ message: "Usuario eliminado correctamente" });
	} catch (error) {
		res
			.status(500)
			.json({ message: "Error en el servidor durante el borrado", err });
	}
};

const getUserProfile = async (req, res) => {
	try {
		const user = await User.findById(req.params.id);
		res.status(200).json({
			id: user.id,
			username: user.username,
			credits: user.credits,
			is_active: user.is_active,
			created_at: user.created_at,
		});
	} catch (error) {
		res
			.status(500)
			.json({ message: "Error en el servidor durante la busqueda", err });
	}
};

const getRankings = async (req, res) => {
	try {
		const topUsers = await User.getGlobalTop(10);
		res.status(200).json(topUsers);
	} catch (error) {
		res
			.status(500)
			.json({ message: "Error en el servidor al obtener el ranking", err });
	}
};

module.exports = { getMe, updateMe, deleteMe, getUserProfile, getRankings };
