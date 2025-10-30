/**
 * Define la estructura de datos pública de un jugador (segura para enviar al cliente).
 * @typedef {Object} PublicPlayerState
 * @property {string} userId
 * @property {number} chips
 * @property {number} currentBet
 * @property {Array<Card>} hand - Array de cartas (estará vacío si están ocultas).
 * @property {string} status
 * @property {boolean} isDealer
 * @property {boolean} hasActed
 */

/**
 * Representa un jugador de Poker.
 * @class
 */
class PokerPlayer {
	constructor(userId, initialChips) {
		/**
		 * Id del jugador.
		 * @type {string}
		 */
		this.userId = userId;

		/**
		 * Fichas del jugador.
		 * @type {number}
		 */
		this.chips = initialChips;

		/**
		 * Apuesta actual del jugador en la ronda.
		 * @type {number}
		 */
		this.currentBet = 0;

		/**
		 * Mano de cartas del jugador.
		 * @type {Array<Card>}
		 */
		this.hand = [];

		/**
		 * Estado en el que encuentra el jugador.
		 * @type {string}
		 */
		this.status = "waiting"; // 'waiting', 'active', 'folded', 'all-in', 'inactive'

		/**
		 * Indica si el jugador es el dealer de la mano.
		 * @type {boolean}
		 */
		this.isDealer = false;

		/**
		 * Indica si el jugador ya ha actuado en la ronda.
		 * @type {boolean}
		 */
		this.hasActed = false;
	}

	/**
	 * Devuelve el estado público del jugador.
	 * @param {boolean} showHand - Si es true, revela las cartas del jugador.
	 * @returns {PublicPlayerState} Un objeto con el estado público del jugador.
	 */
	getState(showHand) {
		return {
			userId: this.userId,
			chips: this.chips,
			currentBet: this.currentBet,
			hand: showHand ? this.hand : [],
			status: this.status,
			isDealer: this.isDealer,
			hasActed: this.hasActed,
		};
	}

	makeBet(amount) {
		return this._commmitChips(amount);
	}

	postBlind(amount) {
		return this._commmitChips(amount);
	}

	_commmitChips(amount) {
		const chipsToPost = Math.min(this.chips, amount);
		this.chips -= chipsToPost;
		this.currentBet += chipsToPost;
		if (this.chips == 0) {
			this.status = "all-in";
		}
		return chipsToPost;
	}

	fold() {
		this.status = "folded";
		this.currentBet = 0;
		this.hand = [];
	}

	addToHand(card) {
		this.hand.push(card);
	}

	clearHand() {
		this.hand = [];
		this.currentBet = 0;
		this.hasActed = false;
		this.isDealer = false;

		if (this.chips > 0) {
			this.status = "active";
		} else {
			this.status = "inactive";
		}
	}
}

module.exports = PokerPlayer;
