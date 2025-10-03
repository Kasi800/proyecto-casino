const dotenv = require("dotenv").config({ path: ".env" });
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const app = express();

app.use(cookieParser());
app.use(
	cors({
		origin: "http://localhost:3000",
		credentials: true,
	})
);
app.use(express.json());

const authRoutes = require("./routes/authRoutes.js");
app.use("/api/auth", authRoutes);

const dataRoutes = require("./routes/dataRoutes.js");
app.use("/api", dataRoutes);

app.listen(3001, () => console.log("Servidor en puerto 3001"));
