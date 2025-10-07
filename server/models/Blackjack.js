const Deck = require("./Deck");

class Blackjack {
	constructor() {
		this.deck = new Deck();
		this.playerHand = [this.deck.hit(), this.deck.hit()];
		this.dealerHand = [this.deck.hit(), this.deck.hit()];
		this.finished = false;
		this.winner = null;

		if (this.isBlackjack(this.playerHand)) {
			this.finished = true;
			if (this.isBlackjack(this.dealerHand)) {
				this.winner = "draw";
			} else {
				this.winner = "player_blackjack";
			}
		}
	}

	playerHit() {
		if (this.finished) return;
		this.playerHand.push(this.deck.hit());
		if (this.getPlayerScore() > 21) {
			this.finished = true;
			this.winner = "dealer";
		}
	}

	playerStand() {
		if (this.finished) return;
		while (this.getDealerScore() < 17) {
			this.dealerHand.push(this.deck.hit());
		}
		this.finished = true;
		this.winner = this.determineWinner();
	}

	getPlayerScore() {
		return calculateScore(this.playerHand);
	}

	getDealerScore() {
		return calculateScore(this.dealerHand);
	}

	determineWinner() {
		const p = this.getPlayerScore();
		const d = this.getDealerScore();
		let winner = "player";
		if (p > 21 || (p < d && d <= 21)) winner = "dealer";
		else if (p == d) winner = "draw";
		return winner;
	}

	isBlackjack(hand) {
		return hand.length === 2 && calculateScore(hand) === 21;
	}

	getState() {
		return {
			playerHand: this.playerHand.map((c) => c.toString()),
			dealerHand: this.finished
				? this.dealerHand.map((c) => c.toString())
				: [this.dealerHand[0].toString(), "??"],
			playerScore: this.getPlayerScore(),
			dealerScore: this.getDealerScore(),
			finished: this.finished,
			winner: this.winner,
		};
	}
}

function calculateScore(hand) {
	let total = 0;
	let ases = 0;

	for (const card of hand) {
		score = card.getScore();
		if (["K", "Q", "J"].includes(score)) score = 10;
		if (score == "A") {
			score = 11;
			ases++;
		}
		total += parseInt(score);
	}

	while (total > 21 && ases > 0) {
		total -= 10;
		ases--;
	}

	return total;
}

module.exports = Blackjack;
