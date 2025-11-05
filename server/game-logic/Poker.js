const Deck = require("./Deck.js");
const Card = require("./Card.js");
const PokerPlayer = require("./PokerPlayer.js");
const PokerEvaluator = require("poker-evaluator");

/**
 * Importa el tipo de estado público del jugador.
 * @typedef {import('./PokerPlayer.js').PublicPlayerState} PublicPlayerState
 */

/**
 * Estructura de datos del estado completo del juego.
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
 * Estructura de datos
 * @typedef {object} ShowdownResult
 * @property {Array<object>} rankedHands - La clasificación de manos.
 * @property {Array<object>} potResults - El desglose del reparto del bote.
 */

/**
 * Representa una mesa de Poker y gestiona todo el estado de la partida.
 * @class
 */
class Poker {
	/**
	 * El mazo de cartas de la partida.
	 * @type {Deck}
	 */
	#deck;

	/**
	 * Array para botes (principal y secundarios).
	 * @type {Array<object>}
	 */
	#pots;

	/**
	 * Cartas comunes (ej: ["As", "Kd", "7c"]).
	 * @type {Array<Card>}
	 */
	#communityCards;

	/**
	 * Estado actual del juego ('waiting_for_players', 'pre-flop', etc.).
	 * @type {string}
	 */
	#state;

	/**
	 * Array de objetos de PokerPlayer.
	 * @type {Array<PokerPlayer>}
	 */
	#players;

	/**
	 * Valor de la ciega pequeña.
	 * @type {number}
	 */
	#smallBlindAmount;

	/**
	 * Valor de la ciega grande.
	 * @type {number}
	 */
	#bigBlindAmount;

	/**
	 * Apuesta más alta de la ronda actual.
	 * @type {number}
	 */
	#currentBet;

	/**
	 * Índice (en 'this.players') del jugador que es dealer.
	 * @type {number}
	 */
	#dealerIndex;

	/**
	 * Índice (en 'this.players') del jugador al que le toca.
	 * @type {number}
	 */
	#turnIndex;

	/**
	 * Contador de manos jugadas.
	 * @type {number}
	 */
	#gameN;

	/**
	 * Crea una nueva mesa de Poker.
	 * @param {number} smallBlindAmount - Cantidad de la ciega pequeña.
	 * @param {number} bigBlindAmount - Cantidad de la ciega grande.
	 * @param {Object} [savedState=null] - Un estado de juego guardado para cargar.
	 */
	constructor(smallBlindAmount, bigBlindAmount, savedState = null) {
		if (savedState) {
			// Lógica para cargar una partida guardada
		} else {
			// --- Estado de la mano (se resetea cada ronda) ---
			this.#deck = new Deck();
			this.#pots = [];
			this.#communityCards = [];
			this.#state = "waiting_for_players";
			this.#players = [];
			this.#smallBlindAmount = smallBlindAmount;
			this.#bigBlindAmount = bigBlindAmount;
			this.#currentBet = 0;
			this.#dealerIndex = -1;
			this.#turnIndex = -1;
			this.#gameN = 0;
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
		let existingPlayer = this.#players.find((item) => item.userId == userId);
		if (existingPlayer) throw new Error("Usuario ya en partida.");

		// 2. Límite de la mesa (max 6 jugadores)
		if (this.#players.length >= 6) {
			throw new Error("La mesa está llena.");
		}

		// 3. Crea y añade al nuevo jugador.
		let newPlayer = new PokerPlayer(userId, chips);
		this.#players.push(newPlayer);
		return newPlayer;
	}

	/**
	 * Elimina a un jugador de la partida usando su ID.
	 * @param {string} userId - El ID del jugador a eliminar.
	 * @returns {void}
	 */
	removePlayer(userId) {
		// Crear un nuevo array sin el jugador que coincide con el userId y lo guarda
		this.#players = this.#players.filter((item) => item.userId != userId);
	}

	/**
	 * Busca y devuelve un objeto de jugador basado en su ID.
	 * @param {string} userId - El ID del jugador a buscar.
	 * @returns {PokerPlayer | undefined} El objeto del jugador o undefined si no se encuentra.
	 */
	getPlayer(userId) {
		// Devuelve el primer player encontrado con ese userId, si no undefined
		let player = this.#players.find((item) => item.userId == userId);
		return player;
	}

	/**
	 * Inicia una nueva mano en la partida.
	 * @returns {{firstTurnUserId: string}} El userId del jugador que tiene el primer turno.
	 */
	startNewHand() {
		// 1. Limpia la mesa de cartas y apuestas anteriores.
		this.#resetTable();

		// 2. Obtiene solo los jugadores que pueden jugar esta mano.
		const activePlayers = this.#getActivePlayers();

		// 3. Verifica si hay suficientes jugadores.
		if (activePlayers.length < 2) {
			this.#state = "waiting_for_players";
			throw new Error("Se necesitan al menos 2 jugadores para empezar.");
		}

		// 4. Asigna la posición del 'Dealer' para esta mano.
		this.#assignDealer(activePlayers);

		// 5. Lógica para asignar al jugador el small bind y big bind
		const { sbIndex, bbIndex, firstTurnIndex } = this.#assignBinds(
			activePlayers.length
		);

		// 6. Cobra las bind y las añade al pot.
		this.#postBlinds(sbIndex, bbIndex);

		// 7. Reparte las cartas privadas a cada jugador activo.
		this.#dealPrivateCards(activePlayers.length, sbIndex);

		// 8. Inicia la primera ronda ('pre-flop').
		this.#state = "pre-flop";
		this.#turnIndex = firstTurnIndex;

		// 9. Devuelve el ID del jugador que debe actuar primero.
		return { firstTurnUserId: this.#players[firstTurnIndex].userId };
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
		if (this.#turnIndex == -1) {
			throw new Error(
				"No hay un turno activo. La ronda de apuestas ha terminado."
			);
		}

		// Obtiene el jugador al que le toca el turno.
		const player = this.#players[this.#turnIndex];

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
				this.#validateCheck(player);
				break;

			case "call":
				// Iguala la apuesta actual y devuelve cuántas fichas puso.
				chipsToPot = this.#executeCall(player);
				break;

			case "bet":
				// Realiza la primera apuesta de la ronda.
				chipsToPot = this.#executeBet(player, amount);
				break;

			case "raise":
				// Sube la apuesta actual.
				chipsToPot = this.#executeRaise(player, amount);
				break;

			default:
				throw new Error("Acción desconocida.");
		}

		// Marca que este jugador ya actuó en esta ronda de apuestas.
		player.setHasActed(true);

		// Almacenará resultados del showdown si la mano termina.
		let evaluatedHands = null;

		// Revisa cuántos jugadores siguen activos (no se han retirado).
		const activePlayersInPot = this.#getActivePlayers();

		// 2. MOVER EL JUEGO
		if (activePlayersInPot.length <= 1) {
			// Si solo queda 1 jugador (o 0), la mano termina.
			evaluatedHands = this.#moveToNextStage();
		} else if (this.#isBettingRoundOver()) {
			// Si todos han actuado y las apuestas están igualadas avanza a la siguiente fase
			evaluatedHands = this.#moveToNextStage();
		} else {
			// Si la ronda de apuestas continúa pasa el turno al siguiente jugador.
			this.#turnIndex = this.#nextPlayerIndex(this.#turnIndex);
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
		const isShowdown = this.#state === "showdown";

		// Crea una lista de jugadores "segura" para el público.
		const publicPlayers = this.#players.map((player) => {
			// Las manos solo se muestran si es 'showdown' y el jugador no se ha retirado.
			const showHand = isShowdown && player.status !== "folded";

			// Devuelve un objeto "limpio" de cada jugador.
			return player.getState(showHand);
		});

		// Obtiene el ID del jugador que tiene el turno (o null si la ronda ha terminado).
		const turnUserId =
			this.#turnIndex >= 0 ? this.#players[this.#turnIndex].userId : null;

		// Obtiene el ID del jugador que es el dealer.
		const dealerUserId =
			this.#dealerIndex >= 0 ? this.#players[this.#dealerIndex].userId : null;

		// Devuelve el objeto de estado completo para el cliente.
		return {
			pots: this.#pots,
			communityCards: this.#communityCards,
			state: this.#state,
			gameN: this.#gameN,
			currentBet: this.#currentBet,
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
	#resetTable() {
		// Coge una baraja nueva (y la baraja).
		this.#deck = new Deck();
		// Vacía los botes (principales y secundarios) de la mano anterior.
		this.#pots = [];
		// Quita las cartas comunitarias de la mesa.
		this.#communityCards = [];
		// Establece que la apuesta a igualar (pre-flop) es la ciega grande.
		this.#currentBet = this.#bigBlindAmount;
		// Incrementa el contador de manos jugadas.
		this.#gameN++;

		// Pide a cada jugador que limpie su mano y estado.
		this.#players.forEach((player) => player.clearHand());
	}

	/**
	 * (Internal) Asigna la posición del Dealer para la mano actual.
	 * Si es la primera mano de la partida, lo elige al azar.
	 * Si no, rota el botón al siguiente jugador.
	 * @private
	 * @param {Array<PokerPlayer>} activePlayers - La lista de jugadores activos.
	 * @returns {void}
	 */
	#assignDealer(activePlayers) {
		// Comprueba si es la primera mano (dealerIndex no está asignado).
		if (this.#dealerIndex == -1) {
			// --- Lógica de la Primera Mano: Elegir un dealer al azar ---

			// 1. Elige un jugador aleatorio de los que están activos.
			const randomIndex = Math.floor(Math.random() * activePlayers.length);
			const randomPlayer = activePlayers[randomIndex];

			// 2. Actualiza el estado de ese jugador para que sepa que es el dealer.
			randomPlayer.setDealer(true);
			// 3. Guarda el índice global de ese jugador.
			this.#dealerIndex = this.#players.indexOf(randomPlayer);
		} else {
			// --- Lógica de manos siguientes: Mover el dealer ---

			// 1. Calcula cuál es el índice del siguiente dealer.
			this.#dealerIndex = this.#nextPlayerIndex(this.#dealerIndex);
			this.#players[this.#dealerIndex].setDealer(true);
		}
	}

	/**
	 * (Internal) Calcula las posiciones de las ciegas (SB, BB)
	 * y el primer jugador en jugar (en pre-flop), basado en las reglas del poker.
	 * @private
	 * @param {number} activePlayersCount - El número de jugadores activos en la mano.
	 * @returns {{sbIndex: number, bbIndex: number, firstTurnIndex: number}}
	 * Un objeto con los índices (para `this.players`) de las posiciones clave.
	 */
	#assignBinds(activePlayersCount) {
		let sbIndex, bbIndex, firstTurnIndex;

		// Comprueba si es "Heads-Up" (solo 2 jugadores), que tiene reglas especiales.
		if (activePlayersCount === 2) {
			// En Heads-Up, el Dealer es también la Ciega Pequeña (SB).
			sbIndex = this.#dealerIndex;
			// El otro jugador es la Ciega Grande (BB).
			bbIndex = this.#nextPlayerIndex(sbIndex);
			// El primero en jugar es el Dealer/SB.
			firstTurnIndex = sbIndex;
		} else {
			// Caso normal (3+ jugadores)
			// La SB es el jugador a la izquierda del Dealer.
			sbIndex = this.#nextPlayerIndex(this.#dealerIndex);
			// La BB es el jugador a la izquierda de la SB.
			bbIndex = this.#nextPlayerIndex(sbIndex);
			// El primero en jugar es el jugador a la izquierda de la BB.
			firstTurnIndex = this.#nextPlayerIndex(bbIndex);
		}

		return { sbIndex, bbIndex, firstTurnIndex };
	}

	/**
	 * (Internal) Cobra las apuestas ciegas (SB y BB) y las añade al bote.
	 * @private
	 * @param {number} sbIndex - El índice del jugador en la Ciega Pequeña.
	 * @param {number} bbIndex - El índice del jugador en la Ciega Grande.
	 * @returns {void}
	 */
	#postBlinds(sbIndex, bbIndex) {
		const sbPlayer = this.#players[sbIndex];
		const bbPlayer = this.#players[bbIndex];

		// 1. El jugador paga y DEVUELVE la cantidad que realmente apostó.
		sbPlayer.postBlind(this.#smallBlindAmount);
		bbPlayer.postBlind(this.#bigBlindAmount);

		// 2. AÑADE esas cantidades al bote.
		if (!this.#pots[0]) {
			this.#pots[0] = {
				amount: 0,
				eligiblePlayers: this.#getActivePlayers().map((p) => p.userId),
			};
		}
	}

	/**
	 * (Internal) Reparte las dos cartas privadas a cada jugador activo.
	 * Empieza a repartir desde la Ciega Pequeña (sbIndex) y da una
	 * carta a cada jugador, luego repite el proceso una segunda vez.
	 * @private
	 * @param {number} activePlayersCount - El número de jugadores que reciben cartas.
	 * @param {number} sbIndex - El índice del jugador que es Ciega Pequeña (el primero).
	 * @returns {void}
	 */
	#dealPrivateCards(activePlayersCount, sbIndex) {
		// Fija el punto de inicio del reparto (el jugador en la Ciega Pequeña).
		let dealIndex = sbIndex;

		// Bucle para las 2 cartas (i = 0 es la primera carta, i = 1 es la segunda).
		for (let i = 0; i < 2; i++) {
			// Reparte una carta a cada jugador activo.
			for (let j = 0; j < activePlayersCount; j++) {
				this.#players[dealIndex].addToHand(this.#deck.hit());
				dealIndex = this.#nextPlayerIndex(dealIndex);
			}
		}
	}

	/**
	 * (Internal) Reparte un número específico de cartas comunitarias.
	 * (Se usa para el Flop, Turn y River).
	 * @private
	 * @param {number} num - El número de cartas a repartir (ej. 3 para el Flop, 1 para Turn/River).
	 * @returns {void}
	 */
	#dealCommunityCards(num) {
		// Añade cartas a la mesa 'num' veces.
		for (let i = 0; i < num; i++) {
			this.#communityCards.push(this.#deck.hit());
		}
	}

	/**
	 * (Internal) Revisa si la ronda de apuestas actual (ej. flop) ha terminado.
	 * @private
	 * @returns {boolean} - 'true' si la ronda terminó, 'false' si debe continuar.
	 */
	#isBettingRoundOver() {
		// Obtengo todos los jugadores que no se han retirado ('folded').
		const playersStillPot = this.#players.filter(
			(p) => p.status === "active" || p.status === "all-in"
		);

		// Si solo queda 1 jugador (o 0), la ronda (y la mano) se acaba automáticamente.
		if (playersStillPot.length <= 1) return true;

		// 1. ¿Han actuado todos?
		const allPlayersHaveActed = playersStillPot.every(
			(p) => p.hasActed === true || p.status === "all-in"
		);

		// 2. ¿Están las apuestas igualadas?
		const allBetsMatch = playersStillPot.every(
			(p) => p.currentBet === this.#currentBet || p.status === "all-in"
		);
		return allPlayersHaveActed && allBetsMatch;
	}

	/**
	 * (Internal) Avanza el juego a la siguiente fase (flop, turn, river, showdown).
	 * Se encarga de asentar los botes, resetear las apuestas, repartir cartas
	 * comunitarias y, finalmente, determinar un ganador o empezar una nueva mano.
	 * @private
	 * @returns {Array<object>|null} - Los resultados del showdown (si ocurre),
	 * o 'null' si la mano continúa.
	 */
	#moveToNextStage() {
		// 1. ASENTAR EL BOTE: Mueve las apuestas de los jugadores al bote principal.
		this.#settlePot();
		// Resetea la apuesta a igualar para la nueva ronda (ej. en el flop, la apuesta es 0).
		this.#currentBet = 0;

		// 2. RESETEAR JUGADORES: Resetea 'hasActed' para la nueva ronda de apuestas.
		this.#players.forEach((player) => {
			if (player.status === "active") {
				player.setHasActed(false);
			}
		});

		// 3. ASIGNAR TURNO (POST-FLOP): El primer jugador en jugar.
		const activePlayersInPot = this.#players.filter(
			(p) => p.status === "active" || p.status === "all-in"
		);

		if (activePlayersInPot.length === 2) {
			// En Heads-Up, el Dealer (SB) juega primero post-flop.
			this.#turnIndex = this.#dealerIndex;
		} else {
			// 3+ jugadores, el SB (izquierda del dealer) juega primero.
			this.#turnIndex = this.#nextPlayerIndex(this.#dealerIndex);
		}

		// Almacenará los resultados del showdown si la mano termina aquí.
		let evaluatedHands = null;

		// 4. AVANZAR EL ESTADO DEL JUEGO 'pre-flop', 'flop', 'turn', 'river', 'showdown'
		switch (this.#state) {
			case "pre-flop":
				this.#state = "flop";
				this.#dealCommunityCards(3);
				break;
			case "flop":
				this.#state = "turn";
				this.#dealCommunityCards(1);
				break;
			case "turn":
				this.#state = "river";
				this.#dealCommunityCards(1);
				break;
			case "river":
				this.#state = "showdown";
				evaluatedHands = this.#determinateWinner();
				break;
			case "showdown":
				this.startNewHand();
				break;
		}

		// 5. LÓGICA DE AUTO-AVANCE (SKIP)
		// Si la mano ha terminado (showdown) o está esperando, quita el turno.
		if (this.#state === "showdown" || this.#state === "waiting_for_players") {
			this.#turnIndex = -1;
		} else {
			// Si la mano no ha terminado, comprueba si se debe saltar la ronda de apuestas.
			const activePlayersNow = this.#players.filter(
				(p) => p.status === "active"
			);

			// Si no hay jugadores activos (todos all-in) o solo 1 puede apostar.
			if (this.#turnIndex === -1 || activePlayersNow.length === 1) {
				// Marca al último jugador activo como "ha actuado" (para el 'auto-check').
				if (activePlayersNow.length === 1)
					activePlayersNow[0].setHasActed(true);

				// Si no hemos llegado al showdown, avanza automáticamente a la siguiente fase.
				// (Llamada recursiva para "correr" las cartas restantes).
				if (this.#state !== "showdown") {
					evaluatedHands = this.#moveToNextStage();
				}
			}
		}

		// Devuelve los resultados del showdown (o null si la mano sigue).
		return evaluatedHands;
	}

	//Lógica de botes y ganador (Privados)

	/**
	 * (Internal) Asienta el bote al final de una ronda de apuestas.
	 * Mueve el dinero de 'player.currentBet' de cada jugador a los
	 * botes ('this.pots'), creando botes secundarios (side pots) si es necesario.
	 * @private
	 * @returns {void}
	 */
	#settlePot() {
		// 1. Encuentra a todos los que apostaron algo
		const playersInRound = this.#players.filter((p) => p.currentBet > 0);
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
			const eligiblePlayers = this.#players.filter(
				(p) => p.currentBet >= level && p.status != "folded"
			);

			// 4. Calcula la cantidad de este bote
			const potAmount = amountToContribute * eligiblePlayers.length;

			// 5. ¿Este bote ya existe? (Si es un "side pot" de una ronda anterior)
			// Buscamos un bote existente con EXACTAMENTE los mismos jugadores elegibles
			const existingPot = this.#pots.find(
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
				this.#pots.push({
					amount: potAmount,
					eligiblePlayers: eligiblePlayers.map((p) => p.userId),
				});
			}
			lastLevel = level;
		}

		// 6. Resetea la apuesta de la ronda de TODOS los jugadores
		this.#players.forEach((p) => p.setCurrentBet(0));
	}

	/**
	 * (Internal) Determina el ganador(es) al llegar al 'showdown'.
	 * Evalúa las manos de los jugadores restantes y llama a la lógica
	 * para repartir los botes.
	 * @private
	 * @returns {ShowdownResult}
	 * Un objeto que contiene:
	 * - `rankedHands`: La lista de jugadores y su mejor mano evaluada.
	 * - `potResults`: El resultado de quién ganó qué bote (devuelto por `_awardPots`).
	 */
	#determinateWinner() {
		// 1. Asienta el bote final (mueve las apuestas de la ronda 'river' a 'this.pots').
		this.#settlePot();

		// 2. Obtiene a todos los jugadores que no se han retirado ('folded').
		const playersStillPot = this.#players.filter(
			(p) => p.status === "active" || p.status === "all-in"
		);

		let rankedHands = [];

		// 3. Evalúa la mejor mano de 5 cartas para CADA jugador (de sus 7 disponibles).
		for (const player of playersStillPot) {
			// Combina las 2 cartas del jugador + 5 de la mesa.
			const sevenCards = [...player.hand, ...this.#communityCards];

			// Convierte las cartas al formato que requiere la librería 'PokerEvaluator'.
			const cardsForEvaluator = sevenCards.map((card) =>
				card.toPokerEvaluatorString()
			);

			// La librería encuentra la mejor mano (ej. "Full House").
			const bestHand = PokerEvaluator.evalHand(cardsForEvaluator);

			// Almacena el resultado junto con el objeto 'player' para el reparto.
			rankedHands.push({
				player: player,
				hand: bestHand,
			});
		}

		// 4. Llama a la función que compara las 'rankedHands' y reparte el dinero de 'this.pots'.
		let potResults = this.#awardPots(rankedHands);

		// 5. Devuelve la clasificación y el desglose del reparto de premios.
		return { rankedHands, potResults };
	}

	/**
	 * (Internal) Reparte el dinero de `this.pots` a los ganadores.
	 * @private
	 * @param {Array<{player: PokerPlayer, hand: object}>} rankedHands - Una lista
	 * de jugadores que no se han retirado y su mejor mano evaluada.
	 * @returns {Array<object>} Un array de objetos que describe quién ganó qué bote.
	 */
	#awardPots(rankedHands) {
		let potResults = [];
		// Si solo hay un ganador (todos se retiraron), dale todo
		if (rankedHands.length === 1) {
			const totalPot = this.#pots.reduce((sum, pot) => sum + pot.amount, 0);
			rankedHands[0].player.addChips(totalPot);

			potResults.push({
				potName: "Main Pot",
				amount: totalPot,
				winners: [rankedHands[0].player.userId],
				handName: "Todos los demás se retiraron",
			});
		} else {
			// Itera sobre cada bote (main, side 1, side 2...)
			let potIndex = 1;
			for (const pot of this.#pots) {
				// 1. Encuentra las manos elegibles SOLO para este bote
				const eligibleHands = rankedHands.filter((rh) =>
					pot.eligiblePlayers.includes(rh.player.userId)
				);

				if (eligibleHands.length === 0) {
					potIndex++;
					continue;
				}

				// 2. Encuentra al ganador(es) SOLO de ese grupo
				const maxValue = eligibleHands.reduce((max, rh) => {
					return rh.hand.value > max.hand.value ? rh : max;
				});
				const winners = eligibleHands.filter(
					(i) => i.hand.value === maxValue.hand.value
				);

				// 3. Reparte ese bote
				const amountPerWinner = Math.floor(pot.amount / winners.length);
				let remainder = pot.amount % winners.length; // Fichas sobrantes

				for (const winner of winners) {
					let amountToAward = amountPerWinner;
					// Da la ficha sobrante al primer ganador de la lista
					if (remainder > 0) {
						amountToAward += 1;
						remainder -= 1;
					}
					winner.player.addChips(amountToAward);
				}

				potResults.push({
					potName: potIndex === 1 ? "Main Pot" : `Side Pot ${potIndex - 1}`,
					amount: pot.amount,
					winners: winners.map((w) => w.player.userId),
					handName: winners[0].hand.handName,
				});
				potIndex++;
			}
		}

		this.#pots = []; // Vacía los botes
		return potResults;
	}

	//Helpers de handleAction (Privados)

	/**
	 * (Internal) Valida si un jugador puede legalmente 'pasar' (check).
	 * Da un error si el jugador tiene una apuesta pendiente que debe igualar.
	 * @private
	 * @param {PokerPlayer} player - El jugador que intenta pasar.
	 * @returns {void}
	 * @throws {Error} Si el jugador no puede pasar.
	 */
	#validateCheck(player) {
		if (player.currentBet < this.#currentBet) {
			throw new Error("No puedes pasar, hay una apuesta pendiente.");
		}
	}

	/**
	 * (Internal) Ejecuta la acción de 'igualar' (Call) para un jugador.
	 * Calcula la cantidad necesaria para igualar y le pide al jugador
	 * que pague esa cantidad.
	 * @private
	 * @param {PokerPlayer} player - El jugador que realiza la acción.
	 * @returns {number} La cantidad de fichas que el jugador realmente ha
	 * aportado (manejando casos de 'all-in').
	 * @throws {Error} Si el jugador intenta igualar cuando debería pasar.
	 */
	#executeCall(player) {
		const amountToCall = this.#currentBet - player.currentBet;
		if (amountToCall <= 0) {
			throw new Error("No hay nada que igualar, debes pasar (check).");
		}
		return player.makeBet(amountToCall);
	}

	/**
	 * (Internal) Ejecuta la acción de 'apostar' (Bet) para un jugador.
	 * Esta acción solo es válida si nadie más ha apostado en esta ronda.
	 * @private
	 * @param {PokerPlayer} player - El jugador que realiza la acción.
	 * @param {number} amount - La cantidad que el jugador desea apostar.
	 * @returns {number} La cantidad real que el jugador apostó (manejando all-in).
	 * @throws {Error} Si ya hay una apuesta en la ronda (se debe usar 'raise' o 'call').
	 * @throws {Error} Si la apuesta es menor que la Ciega Grande.
	 */
	#executeBet(player, amount) {
		if (this.#currentBet > 0) {
			throw new Error(
				"No puedes apostar, debes 'igualar' (call) o 'subir' (raise)."
			);
		}
		if (amount < this.#bigBlindAmount) {
			throw new Error(`La apuesta mínima es ${this.#bigBlindAmount}.`);
		}

		const actualBet = player.makeBet(amount);
		this.#currentBet = actualBet;
		return actualBet;
	}

	/**
	 * (Internal) Ejecuta la acción de 'subir' (Raise) para un jugador.
	 * Valida que la subida sea legal y actualiza la apuesta de la mesa.
	 * @private
	 * @param {PokerPlayer} player - El jugador que realiza la acción.
	 * @param {number} amount - La cantidad TOTAL a la que se sube (ej. "subir A 500").
	 * @returns {number} La cantidad real de fichas que el jugador añadió.
	 * @throws {Error} Si se intenta subir cuando se debe apostar (bet).
	 * @throws {Error} Si el tamaño de la subida es menor al mínimo legal.
	 */
	#executeRaise(player, amount) {
		if (this.#currentBet === 0) {
			throw new Error("No puedes subir, debes 'apostar' (bet).");
		}

		const chipsToCommit = amount - player.currentBet;
		const isAllIn = chipsToCommit >= player.chips;

		const raiseAmount = amount - this.#currentBet;
		if (!isAllIn && raiseAmount < this.#bigBlindAmount) {
			throw new Error("La subida es demasiado pequeña.");
		}

		if (amount < this.#currentBet) {
			throw new Error("La subida debe ser mayor que la apuesta actual.");
		}

		const actualRaise = player.makeBet(chipsToCommit);
		this.#currentBet = player.currentBet;
		return actualRaise;
	}

	//Helpers de utilidad (Privados)

	/**
	 * (Internal) Devuelve una lista de jugadores con estado 'active'.
	 * Se usa para determinar quién puede participar en una nueva mano
	 * y quién es elegible para el bote principal al inicio.
	 * @private
	 * @returns {Array<PokerPlayer>} Un array filtrado de instancias de PokerPlayer.
	 */
	#getActivePlayers() {
		return this.#players.filter((p) => p.status === "active");
	}

	/**
	 * (Internal) Encuentra el índice del *siguiente* jugador con estado 'active'.
	 * Da la vuelta a la mesa (circularmente) y se salta a todos los
	 * jugadores que no estén 'active' (ej. 'folded', 'all-in', 'out').
	 * @private
	 * @param {number} currentIndex - El índice del jugador actual (el punto de partida).
	 * @returns {number} El índice del siguiente jugador activo.
	 * Devuelve -1 si no se encuentra ningún *otro* jugador activo.
	 */
	#nextPlayerIndex(currentIndex) {
		let nextIndex = (currentIndex + 1) % this.#players.length;

		while (
			nextIndex !== currentIndex &&
			this.#players[nextIndex].status !== "active"
		) {
			nextIndex = (nextIndex + 1) % this.#players.length;
		}

		if (this.#players[nextIndex].status !== "active") {
			nextIndex = -1;
		}

		return nextIndex;
	}
}

module.exports = Poker;
