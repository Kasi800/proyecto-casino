const express = require("express");
const router = express.Router();
const User = require("../models/userModel.js");

router.get("/users", (req, res) => {
	User.findAll((err, results) => {
		if (err) {
			console.error("Error al obtener usuarios:", err);
			return res.status(500).json({ error: "Error al obtener usuarios" });
		}
		res.json(results);
	});
});

module.exports = router;
