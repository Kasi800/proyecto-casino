const Deck = require("./Deck");

function calculateScore(hand) {
	let total = 0;
	let ases = 0;

	for (const card of hand) {
		let value = card.getScore();
		if (["K", "Q", "J"].includes(value)) value = 10;
		if (value == "A") {
			value = 11;
			ases++;
		}
		total += parseInt(value);
	}

	while (total > 21 && ases > 0) {
		total -= 10;
		ases--;
	}

	return total;
}

class Blackjack {
	constructor() {
		this.deck = new Deck();
		this.playerHand = [this.deck.hit(), this.deck.hit()];
		this.dealerHand = [this.deck.hit(), this.deck.hit()];
		this.finished = false;
		this.winner = null;

		this.checkInitialBlackjack();
	}

	checkInitialBlackjack() {
		const playerHasBlackjack = this.isBlackjack(this.playerHand);
		const dealerHasBlackjack = this.isBlackjack(this.dealerHand);

		if (playerHasBlackjack) {
			this.finished = true;
			this.winner = dealerHasBlackjack ? "draw" : "player_blackjack";
		} else if (dealerHasBlackjack) {
			this.finished = true;
			this.winner = "dealer_blackjack";
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
		this.finished = true;
		while (this.getDealerScore() < 17) {
			this.dealerHand.push(this.deck.hit());
		}
		this.winner = this.determineWinner();
	}

	getPlayerScore() {
		return calculateScore(this.playerHand);
	}

	getDealerScore() {
		let dealerVisibleHand = [this.dealerHand[0]];
		if (this.finished) dealerVisibleHand = this.dealerHand;
		return calculateScore(dealerVisibleHand);
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

module.exports = Blackjack;
