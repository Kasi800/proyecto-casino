const express = require("express");
const router = express.Router();
const bjController = require("../controllers/bjController.js");
const auth = require("../middlewares/auth.js");

router.post("/blackjack/start", auth, bjController.startGame);
router.post("/blackjack/hit", auth, bjController.hit);
router.post("/blackjack/stand", auth, bjController.stand);

module.exports = router;
