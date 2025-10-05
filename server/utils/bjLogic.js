function calculateScore(mano) {
	let total = 0;
	let ases = 0;

	for (const carta of mano) {
		total += carta.getScore();
		if (carta.value === "A") ases++;
	}

	while (total > 21 && ases > 0) {
		total -= 10;
		ases--;
	}

	return total;
}
