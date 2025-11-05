const db = require("../db.js");

/**
 * Envía una solicitud de amistad.
 * @param {number} requesterId - El ID del usuario que envía la solicitud.
 * @param {number} receiverId - El ID del usuario que recibe la solicitud.
 * @returns {Promise<object>} El resultado de la consulta de inserción.
 * @throws {Error} Si la solicitud ya existe o si el usuario intenta agregarse a sí mismo.
 */
const sendFriendRequest = async (requesterId, receiverId) => {
	if (requesterId === receiverId) {
		throw new Error("No puedes agregarte a ti mismo como amigo.");
	}

	try {
		const sql =
			"INSERT INTO friends (id_requester, id_receiver, status) VALUES (?, ?, 'pending')";
		return await db.query(sql, [requesterId, receiverId]);
	} catch (error) {
		if (error.code === "ER_DUP_ENTRY") {
			throw new Error("Ya existe una solicitud de amistad con este usuario.");
		}
		throw error;
	}
};

/**
 * Acepta una solicitud de amistad pendiente.
 *
 * @param {number} receiverId - El ID del usuario que ACEPTA (el que recibió la solicitud).
 * @param {number} requesterId - El ID del usuario que ENVIÓ la solicitud.
 * @returns {Promise<boolean>} True si la solicitud fue aceptada, false si no se encontró.
 */
const acceptFriendRequest = async (receiverId, requesterId) => {
	const sql =
		"UPDATE friends SET status = 'accepted' WHERE id_receiver = ? AND id_requester = ? AND status = 'pending'";
	const [result] = await db.query(sql, [receiverId, requesterId]);
	return result.affectedRows > 0;
};

/**
 * Rechaza o cancela una solicitud de amistad pendiente.
 * @param {number} currentUserId - El ID del usuario que toma la acción.
 * @param {number} otherUserId - El ID del otro usuario en la solicitud.
 * @returns {Promise<boolean>} True si la solicitud fue borrada, false si no.
 */
const rejectOrCancelRequest = async (currentUserId, otherUserId) => {
	// Borra la solicitud sin importar quién fue el solicitante o receptor, siempre y cuando esté 'pendiente'.
	const sql =
		"DELETE FROM friends WHERE status = 'pending' AND ((id_requester = ? AND id_receiver = ?) OR (id_requester = ? AND id_receiver = ?))";
	const [result] = await db.query(sql, [
		currentUserId,
		otherUserId,
		otherUserId,
		currentUserId,
	]);
	return result.affectedRows > 0;
};

/**
 * Elimina una amistad existente (estado 'accepted').
 * @param {number} userId - El ID del usuario que inicia la eliminación.
 * @param {number} friendId - El ID del amigo a eliminar.
 * @returns {Promise<boolean>} True si la amistad fue eliminada, false si no.
 */
const removeFriend = async (userId, friendId) => {
	// Usa las columnas generadas (id_user_a, id_user_b) para encontrar la fila de amistad
	const sql =
		"DELETE FROM friends WHERE id_user_a = LEAST(?, ?) AND id_user_b = GREATEST(?, ?) AND status = 'accepted'";

	const [result] = await db.query(sql, [userId, friendId, userId, friendId]);
	return result.affectedRows > 0;
};

/**
 * Obtiene la lista de amigos aceptados de un usuario.
 * @param {number} userId - El ID del usuario.
 * @returns {Promise<Array<object>>} Una lista de objetos de usuario (amigos).
 */
const getFriends = async (userId) => {
	// 1. Busca en 'friends' donde el usuario sea requester O receiver.
	// 2. Hace JOIN con 'users' para obtener los datos del *otro* usuario.
	// 3. Usa CASE para decidir qué ID (requester o receiver) es el del amigo.
	const sql = `
        SELECT 
            u.id, 
            u.username,
            f.created_at AS friendship_date
        FROM friends f
        JOIN users u ON u.id = (
            CASE 
                WHEN f.id_requester = ? THEN f.id_receiver 
                ELSE f.id_requester 
            END
        )
        WHERE (f.id_requester = ? OR f.id_receiver = ?) 
        AND f.status = 'accepted'
        AND u.is_active = true
    `;
	const [rows] = await db.query(sql, [userId, userId, userId]);
	return rows;
};

/**
 * Obtiene las solicitudes de amistad pendientes recibidas por un usuario.
 * @param {number} userId - El ID del usuario (el receptor).
 * @returns {Promise<Array<object>>} Una lista de objetos (ID y username) de quienes enviaron la solicitud.
 */
const getPendingRequests = async (userId) => {
	// Trae los datos del *solicitante* (requester)
	const sql = `
        SELECT 
            f.id_requester AS id, 
            u.username,
            f.created_at AS request_date
        FROM friends f
        JOIN users u ON f.id_requester = u.id
        WHERE f.id_receiver = ? AND f.status = 'pending'
    `;
	const [rows] = await db.query(sql, [userId]);
	return rows;
};

/**
 * Obtiene el estado de amistad entre dos usuarios.
 * @param {number} userId1 - ID del primer usuario.
 * @param {number} userId2 - ID del segundo usuario.
 * @returns {Promise<object|null>} El estado de la amistad o null si no existe.
 */
const getFriendshipStatus = async (userId1, userId2) => {
	const sql =
		"SELECT id_requester, id_receiver, status FROM friends WHERE id_user_a = LEAST(?, ?) AND id_user_b = GREATEST(?, ?)";
	const [rows] = await db.query(sql, [userId1, userId2, userId1, userId2]);
	return rows[0] || null;
};

module.exports = {
	sendFriendRequest,
	acceptFriendRequest,
	rejectOrCancelRequest,
	removeFriend,
	getFriends,
	getPendingRequests,
	getFriendshipStatus,
};
