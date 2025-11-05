const Friends = require("../models/friendsModel.js"); // Importa tu modelo

/**
 * Obtiene la lista de amigos (estado 'accepted') del usuario autenticado.
 */
const getMyFriends = async (req, res) => {
	try {
		const friends = await Friends.getFriends(req.user.id);
		res.status(200).json(friends);
	} catch (error) {
		res
			.status(500)
			.json({ message: "Error al obtener la lista de amigos", error });
	}
};

/**
 * Obtiene las solicitudes de amistad pendientes ('pending') que ha RECIBIDO el usuario autenticado.
 */
const getPendingRequests = async (req, res) => {
	try {
		const requests = await Friends.getPendingRequests(req.user.id);
		res.status(200).json(requests);
	} catch (error) {
		res
			.status(500)
			.json({ message: "Error al obtener las solicitudes pendientes", error });
	}
};

/**
 * Envía una solicitud de amistad a otro usuario.
 */
const sendRequest = async (req, res) => {
	const requesterId = req.user.id;
	const { receiverId } = req.body;

	if (!receiverId) {
		return res.status(400).json({
			message: "Es necesario indicar a quien se enviará la solicitud",
		});
	}

	try {
		await Friends.sendFriendRequest(requesterId, receiverId);
		res.status(201).json({ message: "Solicitud de amistad enviada" });
	} catch (error) {
		// Maneja el error de "solicitud duplicada" que definimos en el modelo
		if (error.message.includes("Ya existe una solicitud")) {
			return res.status(409).json({ message: error.message });
		}
		res.status(500).json({ message: "Error al enviar la solicitud", error });
	}
};

/**
 * Acepta una solicitud de amistad.
 * Espera { requesterId } en el body (el ID de quien ENVIÓ la solicitud).
 */
const acceptRequest = async (req, res) => {
	const receiverId = req.user.id;
	const { requesterId } = req.body;

	if (!requesterId) {
		return res.status(400).json({ message: "Falta 'requesterId' en el body" });
	}

	try {
		const success = await Friends.acceptFriendRequest(receiverId, requesterId);

		if (success) {
			res.status(200).json({ message: "Solicitud aceptada" });
		} else {
			// Esto ocurre si la solicitud no existía o no estaba 'pending'
			res
				.status(404)
				.json({ message: "No se encontró una solicitud pendiente" });
		}
	} catch (error) {
		res.status(500).json({ message: "Error al aceptar la solicitud", error });
	}
};

/**
 * Rechaza una solicitud de amistad (o cancela una enviada).
 * Espera { otherUserId } en el body.
 */
const rejectOrCancelRequest = async (req, res) => {
	const currentUserId = req.user.id;
	const { otherUserId } = req.body;

	if (!otherUserId) {
		return res.status(400).json({ message: "Falta 'otherUserId' en el body" });
	}

	try {
		const success = await Friends.rejectOrCancelRequest(
			currentUserId,
			otherUserId
		);

		if (success) {
			res.status(200).json({ message: "Solicitud rechazada/cancelada" });
		} else {
			res.status(404).json({ message: "No se encontró la solicitud" });
		}
	} catch (error) {
		res.status(500).json({ message: "Error al rechazar la solicitud", error });
	}
};

/**
 * Elimina a un amigo (una relación 'accepted').
 * Espera { friendId } en el body.
 */
const removeFriend = async (req, res) => {
	const userId = req.user.id;
	const { friendId } = req.body;

	if (!friendId) {
		return res.status(400).json({ message: "Falta 'friendId' en el body" });
	}

	try {
		const success = await Friends.removeFriend(userId, friendId);

		if (success) {
			res.status(200).json({ message: "Amigo eliminado" });
		} else {
			res.status(404).json({ message: "No se encontró esa amistad" });
		}
	} catch (error) {
		res.status(500).json({ message: "Error al eliminar amigo", error });
	}
};

/**
 * Obtiene el estado de amistad con un usuario específico.
 * Espera el ID del otro usuario en los parámetros de la ruta (ej: /status/:otherUserId)
 */
const getStatusWithUser = async (req, res) => {
	const userId = req.user.id;
	const { otherUserId } = req.params;

	if (!otherUserId) {
		return res.status(400).json({ message: "Falta 'otherUserId' en params" });
	}

	try {
		const status = await Friends.getFriendshipStatus(userId, otherUserId);
		res.status(200).json(status || { status: "none" });
	} catch (error) {
		res
			.status(500)
			.json({ message: "Error al obtener el estado de amistad", error });
	}
};

module.exports = {
	getMyFriends,
	getPendingRequests,
	sendRequest,
	acceptRequest,
	rejectOrCancelRequest,
	removeFriend,
	getStatusWithUser,
};
