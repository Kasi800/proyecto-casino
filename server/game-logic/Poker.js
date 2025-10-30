const Deck = require("./Deck.js");
const Card = require("./Card.js");
const PokerPlayer = require("./PokerPlayer.js");
const PokerEvaluator = require("poker-evaluator");

/**
 * Importa el tipo de estado público del jugador.
 * @typedef {import('./PokerPlayer.js').PublicPlayerState} PublicPlayerState
 */

/**
 * Eestructura de datos del estado completo del juego.
 * @typedef {Object} GameState
 * @property {Array<object>} pots - Los botes (principal y secundarios).
 * @property {Array<Card>} communityCards - Las cartas en la mesa.
 * @property {string} state - El estado actual del juego (ej: 'pre-flop').
 * @property {number} gameN - El número de mano.
 * @property {number} currentBet - La apuesta actual que hay que igualar.
 * @property {string|null} turnUserId - El ID del jugador con el turno.
 * @property {string|null} dealerUserId - El ID del jugador que es el dealer.
 * @property {Array<PublicPlayerState>} players - La lista de jugadores públicos.
 */

/**
 * Representa una mesa de Poker y gestiona todo el estado de la partida.
 * @class
 */
class Poker {
	/**
	 * Crea una nueva mesa de Poker.
	 * @param {number} smallBlindAmount - Cantidad de la ciega pequeña.
	 * @param {number} bigBlindAmount - Cantidad de la ciega grande.
	 * @param {Object} [savedState=null] - Un estado de juego previo para cargar.
	 */
	constructor(smallBlindAmount, bigBlindAmount, savedState = null) {
		if (savedState) {
			// Lógica para cargar una partida guardada
		} else {
			// --- Estado de la mano (se resetea cada ronda) ---

			/**
			 * El mazo de cartas de la partida.
			 * @type {Deck}
			 */
			this.deck = new Deck();

			/**
			 * Array para botes (principal y secundarios).
			 * @type {Array<object>}
			 */
			this.pots = [];

			/**
			 * Cartas comunes (ej: ["As", "Kd", "7c"]).
			 * @type {Array<Card>}
			 */
			this.communityCards = [];

			/**
			 * Estado actual del juego ('waiting_for_players', 'pre-flop', etc.).
			 * @type {string}
			 */
			this.state = "waiting_for_players";

			/**
			 * Array de objetos de PokerPlayer.
			 * @type {Array<PokerPlayer>}
			 */
			this.players = [];

			/**
			 * Valor de la ciega pequeña.
			 * @type {number}
			 */
			this.smallBlindAmount = smallBlindAmount;

			/**
			 * Valor de la ciega grande.
			 * @type {number}
			 */
			this.bigBlindAmount = bigBlindAmount;

			/**
			 * Apuesta más alta de la ronda actual.
			 * @type {number}
			 */
			this.currentBet = 0;

			/**
			 * Índice (en 'this.players') del jugador que es dealer.
			 * @type {number}
			 */
			this.dealerIndex = -1;

			/**
			 * Índice (en 'this.players') del jugador al que le toca.
			 * @type {number}
			 */
			this.turnIndex = -1;

			/**
			 * Contador de manos jugadas.
			 * @type {number}
			 */
			this.gameN = 0;
		}
	}

	// Funciones públicas (API)

	/**
	 * Añade un nuevo jugador a la mesa de póker.
	 * @param {string} userId - El ID único para el nuevo jugador.
	 * @param {number} chips - La cantidad inicial de fichas del jugador.
	 * @returns {PokerPlayer} El objeto del jugador recién creado.
	 */
	addPlayer(userId, chips) {
		// 1. Evitar duplicados: Comprueba si el jugador ya está en la partida.
		let existingPlayer = this.players.find((item) => item.userId == userId);
		if (existingPlayer) throw new Error("Usuario ya en partida.");

		// 2. Límite de la mesa (max 6 jugadores)
		if (this.players.length >= 6) {
			throw new Error("La mesa está llena.");
		}

		// 3. Crea y añade al nuevo jugador.
		let newPlayer = new PokerPlayer(userId, chips);
		this.players.push(newPlayer);
		return newPlayer;
	}

	/**
	 * Elimina a un jugador de la partida usando su ID.
	 * @param {string} userId - El ID del jugador a eliminar.
	 * @returns {void}
	 */
	removePlayer(userId) {
		// Crear un nuevo array sin el jugador que coincide con el userId y lo guarda
		this.players = this.players.filter((item) => item.userId != userId);
	}

	/**
	 * Busca y devuelve un objeto de jugador basado en su ID.
	 * @param {string} userId - El ID del jugador a buscar.
	 * @returns {PokerPlayer | undefined} El objeto del jugador o undefined si no se encuentra.
	 */
	getPlayer(userId) {
		// Devuelve el primer player encontrado con ese userId, si no undefined
		let player = this.players.find((item) => item.userId == userId);
		return player;
	}

	/**
	 * Inicia una nueva mano en la partida.
	 * @returns {{firstTurnUserId: string}} El userId del jugador que tiene el primer turno.
	 */
	startNewHand() {
		// 1. Limpia la mesa de cartas y apuestas anteriores.
		this._resetTable();

		// 2. Obtiene solo los jugadores que pueden jugar esta mano.
		const activePlayers = this._getActivePlayers();

		// 3. Verifica si hay suficientes jugadores.
		if (activePlayers.length < 2) {
			this.state = "waiting_for_players";
			throw new Error("Se necesitan al menos 2 jugadores para empezar.");
		}

		// 4. Asigna la posición del 'Dealer' para esta mano.
		this._assignDealer(activePlayers);

		// 5. Lógica para asignar al jugador el small bind y big bind
		const { sbIndex, bbIndex, firstTurnIndex } = this._assignBinds(
			activePlayers.length
		);

		// 6. Cobra las bind y las añade al pot.
		this._postBlinds(sbIndex, bbIndex);

		// 7. Reparte las cartas privadas a cada jugador activo.
		this._dealPrivateCards(activePlayers.length, sbIndex);

		// 8. Inicia la primera ronda ('pre-flop').
		this.state = "pre-flop";
		this.turnIndex = firstTurnIndex;

		// 9. Devuelve el ID del jugador que debe actuar primero.
		return { firstTurnUserId: activePlayers[firstTurnIndex].userId };
	}

	/**
	 * Procesa la acción (fold, check, call...) de un jugador.
	 * @param {string} userId - ID del jugador que realiza la acción.
	 * @param {string} actionType - El tipo de acción ('fold', 'check', 'call', 'bet', 'raise').
	 * @param {number} [amount=0] - La cantidad de fichas (solo para 'bet' o 'raise').
	 * @returns {{game: GameState, evaluatedHands: Array<object>|null}} Un objeto con el estado público de la partida y las manos evaluadas.
	 */
	handleAction(userId, actionType, amount = 0) {
		// Error si la ronda de apuestas ya terminó (nadie tiene el turno).
		if (this.turnIndex == -1) {
			throw new Error(
				"No hay un turno activo. La ronda de apuestas ha terminado."
			);
		}

		// Obtiene el jugador al que le toca el turno.
		const player = this.players[this.turnIndex];

		// Error si el ID no coincide con el del turno actual.
		if (player.userId !== userId) {
			throw new Error("No es tu turno.");
		}

		// Fichas que se añadirán al bote en esta acción.
		let chipsToPot = 0;

		// 1. VALIDAR Y EJECUTAR
		switch (actionType) {
			case "fold":
				player.fold(); // El jugador se retira de la mano.
				break;

			case "check":
				// Valida si el jugador puede pasar (no hay apuestas que igualar).
				this._validateCheck(player);
				break;

			case "call":
				// Iguala la apuesta actual y devuelve cuántas fichas puso.
				chipsToPot = this._executeCall(player);
				break;

			case "bet":
				// Realiza la primera apuesta de la ronda.
				chipsToPot = this._executeBet(player, amount);
				break;

			case "raise":
				// Sube la apuesta actual.
				chipsToPot = this._executeRaise(player, amount);
				break;

			default:
				throw new Error("Acción desconocida.");
		}

		// Marca que este jugador ya actuó en esta ronda de apuestas.
		player.hasActed = true;

		// Almacenará resultados del showdown si la mano termina.
		let evaluatedHands = null;

		// Revisa cuántos jugadores siguen activos (no se han retirado).
		const activePlayersInPot = this._getActivePlayers();

		// 2. MOVER EL JUEGO
		if (activePlayersInPot.length <= 1) {
			// Si solo queda 1 jugador (o 0), la mano termina.
			evaluatedHands = this._moveToNextStage();
		} else if (this._isBettingRoundOver()) {
			// Si todos han actuado y las apuestas están igualadas avanza a la siguiente fase
			evaluatedHands = this._moveToNextStage();
		} else {
			// Si la ronda de apuestas continúa pasa el turno al siguiente jugador.
			this.turnIndex = this._nextPlayerIndex(this.turnIndex);
		}

		// Devuelve el nuevo estado del juego y los resultados (si los hay).
		return { game: this.getGameState(), evaluatedHands: evaluatedHands };
	}

	/**
	 * Obtiene un 'snapshot' del estado actual del juego.
	 * @returns {GameState} Un objeto que representa el estado público de la partida.
	 */
	getGameState() {
		// Comprueba si es la fase de 'showdown' (mostrar cartas).
		const isShowdown = this.state === "showdown";

		// Crea una lista de jugadores "segura" para el público.
		const publicPlayers = this.players.map((player) => {
			// Las manos solo se muestran si es 'showdown' y el jugador no se ha retirado.
			const showHand = isShowdown && player.status !== "folded";

			// Devuelve un objeto "limpio" de cada jugador.
			return player.getState(showHand);
		});

		// Obtiene el ID del jugador que tiene el turno (o null si la ronda ha terminado).
		const turnUserId =
			this.turnIndex >= 0 ? this.players[this.turnIndex].userId : null;

		// Obtiene el ID del jugador que es el dealer.
		const dealerUserId =
			this.dealerIndex >= 0 ? this.players[this.dealerIndex].userId : null;

		// Devuelve el objeto de estado completo para el cliente.
		return {
			pots: this.pots,
			communityCards: this.communityCards,
			state: this.state,
			gameN: this.gameN,
			currentBet: this.currentBet,
			turnUserId: turnUserId,
			dealerUserId: dealerUserId,
			players: publicPlayers,
		};
	}

	//Lógica principal del juego (Privados)

	/**
	 * (Internal) Resetea la mesa para el inicio de una nueva mano.
	 * Limpia las cartas, botes y el estado de los jugadores.
	 * @private
	 * @returns {void}
	 */
	_resetTable() {
		// Coge una baraja nueva (y la baraja).
		this.deck = new Deck();
		// Vacía los botes (principales y secundarios) de la mano anterior.
		this.pots = [];
		// Quita las cartas comunitarias de la mesa.
		this.communityCards = [];
		// Establece que la apuesta a igualar (pre-flop) es la ciega grande.
		this.currentBet = this.bigBlindAmount;
		// Incrementa el contador de manos jugadas.
		this.gameN++;

		// Pide a cada jugador que limpie su mano y estado.
		this.players.forEach((player) => player.clearHand());
	}

	/**
	 * (Internal) Asigna la posición del Dealer para la mano actual.
	 * Si es la primera mano de la partida, lo elige al azar.
	 * Si no, rota el botón al siguiente jugador.
	 * @private
	 * @param {Array<PokerPlayer>} activePlayers - La lista de jugadores activos.
	 * @returns {void}
	 */
	_assignDealer(activePlayers) {
		// Comprueba si es la primera mano (dealerIndex no está asignado).
		if (this.dealerIndex == -1) {
			// --- Lógica de la Primera Mano: Elegir un dealer al azar ---

			// 1. Elige un jugador aleatorio de los que están activos.
			const randomIndex = Math.floor(Math.random() * activePlayers.length);
			const randomPlayer = activePlayers[randomIndex];

			// 2. Actualiza el estado de ese jugador para que sepa que es el dealer.
			randomPlayer.isDealer = true;
			// 3. Guarda el índice global de ese jugador.
			this.dealerIndex = this.players.indexOf(randomPlayer);
		} else {
			// --- Lógica de manos siguientes: Mover el dealer ---

			// 1. Calcula cuál es el índice del siguiente dealer.
			this.dealerIndex = this._nextPlayerIndex(this.dealerIndex);
			this.players[this.dealerIndex].isDealer = true;
		}
	}

	_assignBinds(activePlayersCount) {
		let sbIndex, bbIndex, firstTurnIndex;
		if (activePlayersCount == 2) {
			// Caso 2 jugadores
			sbIndex = this.dealerIndex;
			bbIndex = this._nextPlayerIndex(sbIndex);
			firstTurnIndex = sbIndex;
		} else {
			// Caso normal (3+ jugadores)
			sbIndex = this._nextPlayerIndex(this.dealerIndex);
			bbIndex = this._nextPlayerIndex(sbIndex);
			firstTurnIndex = this._nextPlayerIndex(bbIndex);
		}
		return { sbIndex, bbIndex, firstTurnIndex };
	}

	_postBlinds(sbIndex, bbIndex) {
		const sbPlayer = this.players[sbIndex];
		const bbPlayer = this.players[bbIndex];
		sbPlayer.postBlind(this.smallBlindAmount);
		bbPlayer.postBlind(this.bigBlindAmount);
	}

	_dealPrivateCards(activePlayersCount, sbIndex) {
		let dealIndex = sbIndex;
		for (let i = 0; i < 2; i++) {
			for (let j = 0; j < activePlayersCount; j++) {
				this.players[dealIndex].addToHand(this.deck.hit());
				dealIndex = this._nextPlayerIndex(dealIndex);
			}
		}
	}

	_dealCommunityCards(num) {
		for (let i = 0; i < num; i++) {
			this.communityCards.push(this.deck.hit());
		}
	}

	_isBettingRoundOver() {
		const playersStillPot = this.players.filter(
			(p) => p.status == "active" || p.status == "all-in"
		);

		if (playersStillPot.length <= 1) return true;

		const allPlayersHaveActed = playersStillPot.every(
			(p) => p.hasActed == true || p.status == "all-in"
		);

		const allBetsMatch = playersStillPot.every(
			(p) => p.currentBet == this.currentBet || p.status == "all-in"
		);
		return allPlayersHaveActed && allBetsMatch;
	}

	_moveToNextStage() {
		this._settlePot();
		this.currentBet = 0;
		this.players.forEach((player) => {
			if (player.status == "active") {
				player.hasActed = false;
			}
		});

		this.turnIndex = this._nextPlayerIndex(this.dealerIndex);

		let evaluatedHands = null;

		// 'pre-flop', 'flop', 'turn', 'river', 'showdown'
		switch (this.state) {
			case "pre-flop":
				this.state = "flop";
				this._dealCommunityCards(3);
				break;
			case "flop":
				this.state = "turn";
				this._dealCommunityCards(1);
				break;
			case "turn":
				this.state = "river";
				this._dealCommunityCards(1);
				break;
			case "river":
				this.state = "showdown";
				evaluatedHands = this._determinateWinner();
				break;
			case "showdown":
				this.startNewHand();
				break;
		}

		if (this.state == "showdown" || this.state == "waiting_for_players") {
			this.turnIndex = -1;
		} else {
			const activePlayersNow = this.players.filter(
				(p) => p.status === "active"
			);

			if (this.turnIndex === -1 || activePlayersNow.length == 1) {
				if (activePlayersNow.length == 1) activePlayersNow[0].hasActed = true;

				if (this.state != "showdown") {
					evaluatedHands = this._moveToNextStage();
				}
			}
		}

		return evaluatedHands;
	}

	//Lógica de botes y ganador (Privados)
	_settlePot() {
		// 1. Encuentra a todos los que apostaron algo
		const playersInRound = this.players.filter((p) => p.currentBet > 0);
		if (playersInRound.length == 0) return;

		// 2. Encuentra todos los "niveles" de apuesta
		// Usamos Set para eliminar duplicados y ordenamos de menor a mayor
		const betLevels = [
			...new Set(playersInRound.map((p) => p.currentBet)),
		].sort((a, b) => a - b);

		let lastLevel = 0;

		for (const level of betLevels) {
			// La cantidad a coger de cada jugador para este bote
			const amountToContribute = level - lastLevel;

			// 3. Encuentra a todos los jugadores que pueden pagar este nivel
			const eligiblePlayers = this.players.filter(
				(p) => p.currentBet >= level && p.status != "folded"
			);

			// 4. Calcula la cantidad de este bote
			const potAmount = amountToContribute * eligiblePlayers.length;

			// 5. ¿Este bote ya existe? (Si es un "side pot" de una ronda anterior)
			// Buscamos un bote existente con EXACTAMENTE los mismos jugadores elegibles

			const existingPot = this.pots.find(
				(pot) =>
					pot.eligiblePlayers.length == eligiblePlayers.length &&
					pot.eligiblePlayers.every((uid) =>
						eligiblePlayers.find((p) => p.userId == uid)
					)
			);

			if (existingPot) {
				// Añade el dinero a un bote secundario existente
				existingPot.amount += potAmount;
			} else {
				// O crea un nuevo bote (ej. Main Pot, o un nuevo Side Pot)
				this.pots.push({
					amount: potAmount,
					eligiblePlayers: eligiblePlayers.map((p) => p.userId),
				});
			}
			lastLevel = level;
		}

		// 6. Resetea la apuesta de la ronda de TODOS los jugadores
		this.players.forEach((p) => (p.currentBet = 0));
	}

	_determinateWinner() {
		this._settlePot();
		const playersStillPot = this.players.filter(
			(p) => p.status == "active" || p.status == "all-in"
		);

		let rankedHands = [];

		for (const player of playersStillPot) {
			const sevenCards = [...player.hand, ...this.communityCards];

			const cardsForEvaluator = sevenCards.map((card) =>
				card.toEvaluatorString()
			);

			const bestHand = PokerEvaluator.evalHand(cardsForEvaluator);
			rankedHands.push({
				player: player,
				hand: bestHand,
			});
		}

		let potResults = this._awardPots(rankedHands);
		return { rankedHands, potResults };
	}

	_awardPots(rankedHands) {
		let potResults = [];
		// Si solo hay un ganador (todos se retiraron), dale todo
		if (rankedHands.length == 1) {
			const totalPot = this.pots.reduce((sum, pot) => sum + pot.amount, 0);
			rankedHands[0].player.chips += totalPot;
			this.pots = [];

			potResults.push({
				potName: "Main Pot",
				amount: totalPot,
				winners: [rankedHands[0].player.userId],
				handName: "Todos los demás se retiraron",
			});
			return potResults;
		}

		// Itera sobre cada bote (main, side 1, side 2...)
		let potIndex = 1;
		for (const pot of this.pots) {
			// 1. Encuentra las manos elegibles SOLO para este bote
			const eligibleHands = rankedHands.filter((rh) =>
				pot.eligiblePlayers.includes(rh.player.userId)
			);

			if (eligibleHands.length == 0) {
				potIndex++;
				continue;
			}

			// 2. Encuentra al ganador(es) SOLO de ese grupo
			const maxValue = eligibleHands.reduce((max, rh) => {
				return rh.hand.value > max.hand.value ? rh : max;
			});
			const winners = eligibleHands.filter(
				(i) => i.hand.value == maxValue.hand.value
			);

			// 3. Reparte ese bote
			const amountPerWinner = pot.amount / winners.length;
			for (const winner of winners) {
				winner.player.chips += amountPerWinner;
			}

			potResults.push({
				potName: this.pots.length > 1 ? `Side Pot ${potIndex}` : "Main Pot",
				amount: pot.amount,
				winners: winners.map((w) => w.player.userId),
				handName: winners[0].hand.handName,
			});
			potIndex++;
		}
		this.pots = []; // Vacía los botes
		return potResults;
	}

	//Helpers de handleAction (Privados)
	_validateCheck(player) {
		if (player.currentBet < this.currentBet) {
			throw new Error("No puedes pasar, hay una apuesta pendiente.");
		}
	}

	_executeCall(player) {
		const amountToCall = this.currentBet - player.currentBet;
		if (amountToCall <= 0) {
			throw new Error("No hay nada que igualar, debes pasar (check).");
		}
		return player.makeBet(amountToCall);
	}

	_executeBet(player, amount) {
		if (this.currentBet > 0) {
			throw new Error(
				"No puedes apostar, debes 'igualar' (call) o 'subir' (raise)."
			);
		}
		if (amount < this.bigBlindAmount) {
			throw new Error(`La apuesta mínima es ${this.bigBlindAmount}.`);
		}

		const actualBet = player.makeBet(amount);
		this.currentBet = actualBet;
		return actualBet;
	}

	_executeRaise(player, amount) {
		if (this.currentBet == 0) {
			throw new Error("No puedes subir, debes 'apostar' (bet).");
		}
		const raiseAmount = amount - this.currentBet;
		if (raiseAmount < this.bigBlindAmount) {
			throw new Error("La subida es demasiado pequeña.");
		}

		const chipsToCommit = amount - player.currentBet;
		const actualRaise = player.makeBet(chipsToCommit);
		this.currentBet = player.currentBet;
		return actualRaise;
	}

	//Helpers de utilidad (Privados)
	_getActivePlayers() {
		return this.players.filter((p) => p.status == "active");
	}

	_nextPlayerIndex(currentIndex) {
		let nextIndex = (currentIndex + 1) % this.players.length;
		let player = this.players[nextIndex];
		while (player.status != "active") {
			nextIndex = (nextIndex + 1) % this.players.length;
			if (nextIndex == currentIndex) {
				console.log("error");
				return -1;
			}
			player = this.players[nextIndex];
		}
		return nextIndex;
	}
}

module.exports = Poker;
