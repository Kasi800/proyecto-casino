/**
 * Mapea el valor de una carta a su puntuación en Blackjack.
 * @type {Object<string, number>}
 */
const BLACKJACK_VALUES = {
	2: 2,
	3: 3,
	4: 4,
	5: 5,
	6: 6,
	7: 7,
	8: 8,
	9: 9,
	10: 10,
	J: 10,
	Q: 10,
	K: 10,
	A: 11,
};

/**
 * Mapea los palos de Unicode a su representación de una sola
 * letra usada por los evaluadores de poker.
 * @type {Object<string, string>}
 */
const SUIT_POKER_MAP = {
	"♠": "s",
	"♥": "h",
	"♦": "d",
	"♣": "c",
};

/**
 * @class Card
 * @description Representa una carta de juego.
 */
class Card {
	/**
	 * El valor de la carta (ej: "A", "2", "K").
	 * @type {string}
	 * @private
	 */
	#value;

	/**
	 * El palo de la carta (ej: "♠", "♥").
	 * @type {string}
	 * @private
	 */
	#suit;

	/**
	 * Crea una instancia de una Carta.
	 * @param {string} value - El valor de la carta (ej: "A", "2", "10", "K").
	 * @param {string} suit - El palo de la carta (ej: "♠", "♥", "♦", "♣").
	 * @throws {Error} Lanza un error si el valor o el palo no son válidos.
	 */
	constructor(value, suit) {
		if (!BLACKJACK_VALUES[value]) {
			throw new Error(`Valor inválido: ${value}`);
		}
		if (!SUIT_POKER_MAP[suit]) {
			throw new Error(`Palo inválido: ${suit}`);
		}

		this.#value = value;
		this.#suit = suit;

		Object.freeze(this);
	}

	/**
	 * Obtiene el valor de la carta.
	 * @returns {string} (ej: "A", "2", "K")
	 */
	get value() {
		return this.#value;
	}

	/**
	 * Obtiene el palo de la carta.
	 * @returns {string} (ej: "♠", "♥")
	 */
	get suit() {
		return this.#suit;
	}

	/**
	 * Obtiene el valor numérico de la carta específico para Blackjack.
	 * @returns {number} El valor en Blackjack (ej: "K" -> 10, "A" -> 11).
	 */
	getBlackjackValue() {
		return BLACKJACK_VALUES[this.#value];
	}

	/**
	 * Devuelve la representación de la carta para un evaluador de poker.
	 * @returns {string}
	 */
	toPokerEvaluatorString() {
		const valueStr = this.#value === "10" ? "T" : this.#value;
		const suitStr = SUIT_POKER_MAP[this.#suit];
		return valueStr + suitStr;
	}

	/**
	 * Devuelve una representación de string de la carta.
	 * @returns {string} (ej: "K♠")
	 */
	toString() {
		return `${this.value}${this.suit}`;
	}
}

module.exports = Card;
