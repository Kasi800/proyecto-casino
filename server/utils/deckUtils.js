function createDeck() {
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
	const deck = [];

	for (const suit of suits) {
		for (const value of values) {
			deck.push(new Carta(value, suit));
		}
	}

	return deck.sort(() => Math.random() - 0.5);
}
