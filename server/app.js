const dotenv = require("dotenv").config({ path: ".env" });
const config = require("./config/config.js");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const app = express();

app.use(cookieParser());
app.use(
	cors({
		origin: ["http://localhost:3000", "http://192.168.1.137:3000"], //["http://localhost:3000", "http://192.168.1.137:3000"]
		credentials: true,
	})
);
app.use(express.json());

const authRoutes = require("./routes/authRoutes.js");
app.use("/api/auth", authRoutes);

const gamesRoutes = require("./routes/gamesRoutes.js");
app.use("/api/games", gamesRoutes);

const dataRoutes = require("./routes/dataRoutes.js");
app.use("/api", dataRoutes);

app.listen(config.port, "0.0.0.0", () =>
	console.log(`Servidor en puerto ${config.port}`)
);
/**
const Poker = require("./game-logic/Poker.js");
let poker = new Poker(1, 2);
poker.addPlayer("user-a", 100);
poker.addPlayer("user-b", 100);

console.log("--- PRE-FLOP ---");
poker.handleAction(poker.startNewHand().firstTurnUserId, "raise", 20);
poker.handleAction(poker.getGameState().turnUserId, "call");

console.log("\n--- FLOP ---");
poker.handleAction(poker.getGameState().turnUserId, "bet", 20);
poker.handleAction(poker.getGameState().turnUserId, "raise", 30);
poker.handleAction(poker.getGameState().turnUserId, "call");

console.log("\n--- TURN ---");
poker.handleAction(poker.getGameState().turnUserId, "check");
poker.handleAction(poker.getGameState().turnUserId, "check");

console.log("\n--- RIVER ---");
poker.handleAction(poker.getGameState().turnUserId, "check");
let ult = poker.handleAction(poker.getGameState().turnUserId, "check");

console.log("--- Manos Evaluadas ---");
console.log(
	ult.evaluatedHands.rankedHands.map((i) => ({
		userId: i.player.userId,
		handName: i.hand ? i.hand.handName : "N/A",
	}))
);

console.log("\n--- 🏆 Resultados del Bote 🏆 ---");
console.log(ult.evaluatedHands.potResults);

console.log("--- Jugadores Evaluadas ---");
console.log(
	ult.game.players.map((i) => ({ userId: i.userId, chips: i.chips }))
);
*/