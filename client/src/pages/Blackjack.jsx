import { startGame, hitGame, standGame } from "../services/gamesService.js";
import { useState, useEffect } from "react";

export default function Blackjack() {
	const [game, setGame] = useState(null);
	const [loading, setLoading] = useState(false);

	const start = async () => {
		const res = await startGame();
		setGame(res.data.games.blackjack);
	};

	const hit = async () => {
		setLoading(true);
		const res = await hitGame();
		setGame(res.data.games.blackjack);
		setLoading(false);
	};

	const stand = async () => {
		setLoading(true);
		const res = await standGame();
		setGame(res.data.games.blackjack);
		setLoading(false);
	};

	useEffect(() => {
		start();
	}, []);

	if (!game) return <div>Cargando partida...</div>;
	return (
		<div className="blackjack-container">
			<h2>Blackjack</h2>
			<nav>
				<a href="/">Inicio</a>
				<a href="/blackjack">Juegos</a>
				<a href="#">Promociones</a>
				<a href="#">Contacto</a>
			</nav>
			<div className="hands">
				<div>
					<h3>Jugador</h3>
					<p>Cartas: {game.playerHand.join(", ")}</p>
					<p>Puntuación: {game.playerScore}</p>
				</div>

				<div>
					<h3>Dealer</h3>
					<p>Cartas: {game.dealerHand.join(", ")}</p>
					{game.finished && <p>Puntuación: {game.dealerScore}</p>}
				</div>
			</div>

			{!game.finished ? (
				<div className="actions">
					<button style={{ color: "black" }} onClick={hit} disabled={loading}>
						Pedir carta
					</button>
					<button style={{ color: "black" }} onClick={stand} disabled={loading}>
						Plantarse
					</button>
				</div>
			) : (
				<div className="result">
					<h3>
						Resultado:{" "}
						{game.winner === "player"
							? "¡Ganaste!"
							: game.winner === "dealer"
							? "Perdiste"
							: game.winner === "player_blackjack"
							? "¡Blackjack!"
							: "Empate"}
					</h3>
					<button style={{ color: "black" }} onClick={start}>
						Jugar otra vez
					</button>
				</div>
			)}
		</div>
	);
}
