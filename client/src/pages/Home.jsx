import "../css/home.css";
import UserMenu from "../components/UserMenu";

export default function Home() {
	return (
		<body>
			<header>
				<img src="logo.png" alt="Logo Casino" class="logo" />
				<nav>
					<a href="/">Inicio</a>
					<a href="/blackjack">Juegos</a>
					<a href="/">Promociones</a>
					<a href="/">Contacto</a>
				</nav>
				<UserMenu></UserMenu>
			</header>

			<div class="hero">
				<div>
					<h1>Bienvenido al Mejor Casino Online</h1>
					<button>¡Juega Ahora!</button>
				</div>
			</div>

			<section>
				<h2>Nuestros Juegos</h2>
				<div class="games">
					<div class="game-card">
						<img src="ruleta.jpg" alt="Ruleta" />
						<h3>Ruleta</h3>
					</div>
					<div class="game-card">
						<img src="tragaperras.jpg" alt="Tragaperras" />
						<h3>Tragaperras</h3>
					</div>
					<div class="game-card">
						<img src="blackjack.jpg" alt="Blackjack" />
						<h3>Blackjack</h3>
					</div>
					<div class="game-card">
						<img src="poker.jpg" alt="Poker" />
						<h3>Póker</h3>
					</div>
				</div>
			</section>

			<section>
				<h2>Promociones Especiales</h2>
				<p>
					Obtén bonos exclusivos al registrarte. ¡Duplica tu primera apuesta y
					empieza a ganar hoy!
				</p>
			</section>

			<footer>
				&copy; 2025 KasiNo | <a href="#">Términos</a> |{" "}
				<a href="#">Política de Privacidad</a>
			</footer>
		</body>
	);
}
