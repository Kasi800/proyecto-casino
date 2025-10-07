const Card = require("./Card.js");
const suits = ["♠", "♥", "♦", "♣"];
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

class Deck {
	constructor() {
		this.cards = [];
		this.reset();
		this.shuffle();
	}

	reset() {
		this.cards = [];

		for (const suit of suits) {
			for (const value of values) {
				this.cards.push(new Card(value, suit));
			}
		}
	}

	shuffle() {
		this.cards.sort(() => Math.random() - 0.5);
	}

	hit() {
		return this.cards.pop();
	}

	deckLength() {
		return this.cards.length;
	}

	toString() {
		return `${this.value}${this.suit}`;
	}
}

module.exports = Deck;
