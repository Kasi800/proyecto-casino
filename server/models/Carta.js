class Card {
	constructor(suit, value) {
		this.img = new Image();
		this.suit = suit;
		this.value = value;
	}

	getScore() {
		score = this.value;
		if (["K", "Q", "J"].includes(this.value)) score = 10;
		if (this.value == "A") score = 11;
		return parseInt(score);
	}

	toString() {
		return `${this.value}${this.suit}`;
	}
}
