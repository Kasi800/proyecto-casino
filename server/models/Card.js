class Card {
	constructor(value, suit) {
		this.suit = suit;
		this.value = value;
	}

	getScore() {
		return this.value;
	}

	toString() {
		return `${this.value}${this.suit}`;
	}
}

module.exports = Card;
