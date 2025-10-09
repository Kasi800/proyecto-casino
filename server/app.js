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
