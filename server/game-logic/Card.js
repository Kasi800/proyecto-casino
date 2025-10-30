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

	toEvaluatorString() {
		let rankStr = this.value;
		if (this.value == "10") rankStr = "T"; // 10 es 'T'

		let suitStr = "";
		switch (this.suit) {
			case "♠":
				suitStr = "s";
				break;
			case "♥":
				suitStr = "h";
				break;
			case "♦":
				suitStr = "d";
				break;
			case "♣":
				suitStr = "c";
				break;
			default:
				suitStr = this.suit.charAt(0).toLowerCase();
		}

		return rankStr + suitStr;
	}
}

module.exports = Card;
