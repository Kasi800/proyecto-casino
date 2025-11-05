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
	/**
	 * Id del jugador.
	 * @type {string}
	 * @private
	 */
	#userId;

	/**
	 * Fichas del jugador.
	 * @type {number}
	 * @private
	 */
	#chips;

	/**
	 * Apuesta actual del jugador en la ronda.
	 * @type {number}
	 * @private
	 */
	#currentBet;

	/**
	 * Mano de cartas del jugador.
	 * @type {Array<Card>}
	 * @private
	 */
	#hand;

	/**
	 * Estado en el que encuentra el jugador.
	 * @type {string}
	 * @private
	 */
	#status; // 'waiting', 'active', 'folded', 'all-in', 'inactive'

	/**
	 * Indica si el jugador es el dealer de la mano.
	 * @type {boolean}
	 * @private
	 */
	#isDealer;

	/**
	 * Indica si el jugador ya ha actuado en la ronda.
	 * @type {boolean}
	 * @private
	 */
	#hasActed;

	/**
	 * Crea una instancia de PokerPlayer.
	 * @param {string} userId - El ID único del jugador.
	 * @param {number} initialChips - La cantidad inicial de fichas.
	 */
	constructor(userId, initialChips) {
		this.#userId = userId;
		this.#chips = initialChips;
		this.#currentBet = 0;
		this.#hand = [];
		this.#status = "waiting"; // 'waiting', 'active', 'folded', 'all-in', 'inactive'
		this.#isDealer = false;
		this.#hasActed = false;
	}

	// --- Getters (Acceso de solo lectura) ---

	/**
	 * @returns {string} El ID del jugador.
	 */
	get userId() {
		return this.#userId;
	}
	/**
	 * @returns {number} La cantidad de fichas del jugador.
	 */
	get chips() {
		return this.#chips;
	}
	/**
	 * @returns {number} La apuesta actual del jugador en esta ronda.
	 */
	get currentBet() {
		return this.#currentBet;
	}
	/**
	 * @returns {Array<Card>} Una copia de la mano del jugador.
	 */
	get hand() {
		return this.#hand;
	}
	/**
	 * @returns {string} El estado actual del jugador.
	 */
	get status() {
		return this.#status;
	}
	/**
	 * @returns {boolean} True si el jugador es el dealer.
	 */
	get isDealer() {
		return this.#isDealer;
	}
	/**
	 * @returns {boolean} True si el jugador ya ha actuado.
	 */
	get hasActed() {
		return this.#hasActed;
	}

	// --- Métodos Públicos ---

	/**
	 * Devuelve el estado público del jugador.
	 * @param {boolean} [showHand=false] - Si es true, revela las cartas del jugador.
	 * @returns {PublicPlayerState} Un objeto con el estado público del jugador.
	 */
	getState(showHand = false) {
		return {
			userId: this.#userId,
			chips: this.#chips,
			currentBet: this.#currentBet,
			hand: showHand ? this.#hand : [],
			status: this.#status,
			isDealer: this.#isDealer,
			hasActed: this.#hasActed,
		};
	}

	/**
	 * Realizar una apuesta.
	 * @param {number} amount - La cantidad total a la que se quiere hacer la apuesta.
	 * @returns {number} La cantidad real de fichas apostadas.
	 */
	makeBet(amount) {
		return this.#commmitChips(amount);
	}

	/**
	 * Paga una ciega (blind).
	 * @param {number} amount - La cantidad a pagar.
	 * @returns {number} La cantidad real de fichas pagadas.
	 */
	postBlind(amount) {
		return this.#commmitChips(amount);
	}

	/**
	 * Maneja la lógica de restar fichas y actualizar el estado.
	 * @param {number} amount - La cantidad a pagar.
	 * @returns {number} La cantidad real pagada.
	 * @private
	 */
	#commmitChips(amount) {
		const chipsToPost = Math.min(this.#chips, amount);
		this.#chips -= chipsToPost;
		this.#currentBet += chipsToPost;
		if (this.#chips === 0) {
			this.#status = "all-in";
		}
		return chipsToPost;
	}

	/**
	 * Marca al jugador como 'folded' (retirado) y limpia su mano y apuesta.
	 */
	fold() {
		this.#status = "folded";
		this.#currentBet = 0;
		this.#hand = [];
	}

	/**
	 * Añade una carta a la mano del jugador (ej. al repartir).
	 * @param {Card} card - La carta a añadir.
	 */
	addToHand(card) {
		this.#hand.push(card);
	}

	/**
	 * Limpia la mano, apuesta y estados del jugador para la siguiente ronda.
	 * Actualiza el estado a 'active' o 'inactive' (si no tiene fichas).
	 */
	clearHand() {
		this.#hand = [];
		this.#currentBet = 0;
		this.#hasActed = false;
		this.#isDealer = false;

		if (this.#chips > 0) {
			this.#status = "active";
		} else {
			this.#status = "inactive";
		}
	}

	/**
	 * Añade fichas al stack del jugador (ej. al ganar un bote).
	 * @param {number} amount - La cantidad de fichas a añadir.
	 */
	addChips(amount) {
		this.#chips += amount;
	}

	/**
	 * Establece la apuesta del jugador.
	 * @param {string} currentBet - La apuesta actual del jugador en esta ronda.
	 */
	setCurrentBet(currentBet) {
		this.#currentBet = currentBet;
	}

	/**
	 * Establece el estado de dealer del jugador.
	 * @param {boolean} isDealer - True si el jugador es el dealer.
	 */
	setDealer(isDealer) {
		this.#isDealer = isDealer;
	}

	/**
	 * Establece el estado de "ha actuado" del jugador.
	 * @param {boolean} hasActed - True si el jugador ha actuado.
	 */
	setHasActed(hasActed) {
		this.#hasActed = hasActed;
	}
}

module.exports = PokerPlayer;
