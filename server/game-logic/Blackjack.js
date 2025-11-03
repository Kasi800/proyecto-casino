const Card = require("./Card");
const Deck = require("./Deck");

/**
 * @class Blackjack
 * @description Representa una partida de Blackjack y gestiona el estado y la lógica.
 */
class Blackjack {
	/** @type {Deck} */
	#deck;
	/** @type {Card[]} */
	#playerHand;
	/** @type {Card[]} */
	#dealerHand;
	/** @type {boolean} */
	#finished;
	/** @type {string | null} */
	#winner;

	/**
	 * Crea una instancia de Blackjack, ya sea una partida nueva o
	 * restaurada desde un estado guardado.
	 * @param {Object} [savedState=null] - Un estado de juego guardado para cargar.
	 */
	constructor(savedState = null) {
		if (savedState) {
			// Restaurar desde un estado (de la BBDD)
			this.#deck = new Deck(savedState.deck);
			this.#playerHand = savedState.playerHand.map(
				(c) => new Card(c.value, c.suit)
			);
			this.#dealerHand = savedState.dealerHand.map(
				(c) => new Card(c.value, c.suit)
			);
			this.#finished = savedState.finished;
			this.#winner = savedState.winner;
		} else {
			// Empezar una partida nueva
			this.#deck = new Deck();
			this.#playerHand = [this.#deck.hit(), this.#deck.hit()];
			this.#dealerHand = [this.#deck.hit(), this.#deck.hit()];
			this.#finished = false;
			this.#winner = null;

			this.#checkInitialBlackjack();
		}
	}

	/**
	 * Comprueba si hay un Blackjack natural al inicio de partida.
	 * @private
	 */
	#checkInitialBlackjack() {
		const playerHasBlackjack = this.#isBlackjack(this.#playerHand);
		const dealerHasBlackjack = this.#isBlackjack(this.#dealerHand);

		if (playerHasBlackjack) {
			this.#finished = true;
			this.#winner = dealerHasBlackjack ? "draw" : "player_blackjack";
		} else if (dealerHasBlackjack) {
			this.#finished = true;
			this.#winner = "dealer_blackjack";
		}
	}

	/**
	 * Comprueba si una mano es un Blackjack natural (2 cartas = 21).
	 * @param {Card[]} hand
	 * @returns {boolean}
	 * @private
	 */
	#isBlackjack(hand) {
		return hand.length === 2 && this.#calculateScore(hand) === 21;
	}

	/**
	 * Calcula la puntuación de una mano, manejando los Ases.
	 * @param {Card[]} hand - El array de cartas.
	 * @returns {number} La puntuación total.
	 * @private
	 */
	#calculateScore(hand) {
		let total = 0;
		let ases = 0;

		for (const card of hand) {
			let value = card.getBlackjackValue();
			if (value == 11) {
				ases++;
			}
			total += value;
		}

		// Ajusta los Ases de 11 a 1 si el total supera 21
		while (total > 21 && ases > 0) {
			total -= 10;
			ases--;
		}

		return total;
	}

	/**
	 * Determina el ganador después de que el crupier haya jugado.
	 * Asume que el jugador no se ha pasado (puntuación <= 21).
	 * @returns {string} "player", "dealer" o "draw"
	 * @private
	 */
	#determineWinner() {
		const p = this.getPlayerScore();
		const d = this.#getDealerFullScore();
		let winner = "player";
		if (p < d && d <= 21) winner = "dealer";
		else if (p == d) winner = "draw";
		return winner;
	}

	/**
	 * Obtiene la puntuación total real de la mano del crupier.
	 * @returns {number}
	 * @private
	 */
	#getDealerFullScore() {
		return this.#calculateScore(this.#dealerHand);
	}

	/**
	 * Obtiene la puntuación de la mano visible del crupier (para la UI).
	 * Si la partida ha terminado, muestra la puntuación total.
	 * @returns {number}
	 */
	getDealerVisibleScore() {
		let dealerScore = this.#calculateScore([this.#dealerHand[0]]);
		if (this.#finished) {
			dealerScore = this.#getDealerFullScore();
		}
		return dealerScore;
	}

	/**
	 * Obtiene la puntuación actual de la mano del jugador.
	 * @returns {number}
	 */
	getPlayerScore() {
		return this.#calculateScore(this.#playerHand);
	}

	/**
	 * El jugador pide una carta ("Hit").
	 */
	playerHit() {
		if (this.#finished) return;
		this.#playerHand.push(this.#deck.hit());
		if (this.getPlayerScore() > 21) {
			this.#finished = true;
			this.#winner = "dealer"; // El jugador se ha pasado
		}
	}

	/**
	 * El jugador se planta ("Stand").
	 * El crupier juega su turno y se determina el ganador.
	 */
	playerStand() {
		if (this.#finished) return;

		// El crupier saca cartas hasta 17 o más
		let dealerScore = this.#getDealerFullScore();
		while (dealerScore < 17) {
			this.#dealerHand.push(this.#deck.hit());
			dealerScore = this.#getDealerFullScore();
		}
		this.#finished = true;
		this.#winner = this.#determineWinner();
	}

	/**
	 * Devuelve el estado del juego para el Front-End (UI).
	 * Oculta la carta del crupier si la partida no ha terminado.
	 * @returns {Object}
	 */
	getState() {
		return {
			playerHand: this.#playerHand.map((c) => c.toString()),
			dealerHand: this.#finished
				? this.#dealerHand.map((c) => c.toString())
				: [this.#dealerHand[0].toString(), "???"],
			playerScore: this.getPlayerScore(),
			dealerScore: this.getDealerVisibleScore(),
			finished: this.#finished,
			winner: this.#winner,
		};
	}

	/**
	 * Devuelve el estado interno completo para ser serializado (JSON)
	 * y guardado en la base de datos.
	 * @returns {Object} Un objeto simple con datos puros.
	 */
	getInternalState() {
		const serializeCards = (cards) =>
			cards.map((card) => ({
				value: card.value,
				suit: card.suit,
			}));

		return {
			deck: serializeCards(this.#deck.getCards()),
			playerHand: serializeCards(this.#playerHand),
			dealerHand: serializeCards(this.#dealerHand),
			finished: this.#finished,
			winner: this.#winner,
		};
	}
}

module.exports = Blackjack;
