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
	constructor(savedCards = null) {
		this.cards = [];
		if (savedCards) {
			this.cards = savedCards.map((c) => new Card(c.value, c.suit));
		} else {
			this.reset();
			this.shuffle();
		}
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

	getCards() {
		return this.cards;
	}
}

module.exports = Deck;
