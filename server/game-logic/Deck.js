const Card = require("./Card.js");

/**
 * Array de los palos estándar.
 * @type {string[]}
 */
const suits = ["♠", "♥", "♦", "♣"];

/**
 * Array de los valores estándar.
 * @type {string[]}
 */
const values = [
	"A",
	"2",
	"3",
	"4",
	"5",
	"6",
	"7",
	"8",
	"9",
	"10",
	"J",
	"Q",
	"K",
];

/**
 * @class Deck
 * @description Representa una baraja de 52 cartas.
 */
class Deck {
	/**
	 * Array de las cartas (objetos Card) que contiene la baraja.
	 * @type {Card[]}
	 * @private
	 */
	#cards = [];

	/**
	 * Crea una instancia de una baraja.
	 * Si se proporciona `savedCards`, la baraja se restaura desde ese estado.
	 * Si no, se crea una baraja estándar de 52 cartas y se baraja.
	 * @param {Object[]} [savedCards=null] - Un array de objetos simples
	 * (ej: de JSON) con `{ value, suit }` para restaurar una baraja.
	 */
	constructor(savedCards = null) {
		if (savedCards) {
			this.#cards = savedCards.map((c) => new Card(c.value, c.suit));
		} else {
			this.reset();
			this.shuffle();
		}
	}

	/**
	 * (Re)llena la baraja con las 52 cartas estándar, ordenadas.
	 */
	reset() {
		this.#cards = [];

		for (const suit of suits) {
			for (const value of values) {
				this.#cards.push(new Card(value, suit));
			}
		}
	}

	/**
	 * Baraja las cartas en la baraja usando el algoritmo Fisher-Yates.
	 * Garantiza un barajado aleatorio e imparcial.
	 */
	shuffle() {
		for (let i = this.#cards.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[this.#cards[i], this.#cards[j]] = [this.#cards[j], this.#cards[i]];
		}
	}

	/**
	 * Saca (elimina y devuelve) la carta superior de la baraja.
	 * @returns {Card | undefined} La carta sacada, o undefined si la baraja está vacía.
	 */
	hit() {
		return this.#cards.pop();
	}

	/**
	 * Obtiene el número de cartas que quedan en la baraja.
	 * @returns {number}
	 */
	get length() {
		return this.#cards.length;
	}

	/**
	 * Devuelve una copia del array de cartas actual.
	 * @returns {Card[]} Una copia del array de cartas.
	 */
	getCards() {
		return [...this.#cards];
	}
}

module.exports = Deck;
