const express = require("express");
const router = express.Router();
const bjController = require("../controllers/bjController.js");
const { protected } = require("../controllers/authController.js");

router.post("/blackjack/start", protected, bjController.startGame);
router.post("/blackjack/hit", protected, bjController.hit);
router.post("/blackjack/stand", protected, bjController.stand);

module.exports = router;
