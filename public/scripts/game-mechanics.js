/**
 * Game Mechanics for Complex Chem Quest
 * Handles ligand collection, questions, and fate cards
 */

// Simple ligand data (13 ligands)
const LIGANDS = [
  { id: "H2O", name: "H₂O", formula: "H₂O", type: "Neutral" },
  { id: "phen", name: "phen", formula: "C₁₂H₈N₂", type: "Bidentate" },
  { id: "bipy", name: "bipy", formula: "C₁₀H₈N₂", type: "Bidentate" },
  { id: "ox", name: "ox", formula: "C₂O₄²⁻", type: "Bidentate" },
  { id: "py", name: "py", formula: "C₅H₅N", type: "Monodentate" },
  { id: "NH3", name: "NH₃", formula: "NH₃", type: "Monodentate" },
  { id: "PPh3", name: "PPh₃", formula: "P(C₆H₅)₃", type: "Monodentate" },
  { id: "CI", name: "Cl⁻", formula: "Cl⁻", type: "Monodentate" },
  { id: "en", name: "en", formula: "C₂H₈N₂", type: "Bidentate" },
  { id: "acac", name: "acac", formula: "C₅H₇O₂⁻", type: "Bidentate" },
  { id: "CO32", name: "CO₃²⁻", formula: "CO₃²⁻", type: "Bidentate" },
  { id: "CN", name: "CN⁻", formula: "CN⁻", type: "Monodentate" },
  { id: "O2", name: "O²⁻", formula: "O²⁻", type: "Monodentate" }
];

// Simple fate cards data
const FATE_CARDS = [
  { id: "f1", title: "Lucky Draw", description: "Roll again!", effect: "roll-again" },
  { id: "f2", title: "Bonus Points", description: "+3 points", effect: "points", points: 3 },
  { id: "f3", title: "Move Forward", description: "Move 2 spaces forward", effect: "move", spaces: 2 },
  { id: "f4", title: "Move Back", description: "Move 2 spaces back", effect: "move", spaces: -2 },
  { id: "f5", title: "Skip Turn", description: "Skip your next turn", effect: "skip-turn" }
];

// Simple question data
const QUESTIONS = [
  { id: "q1", difficulty: "easy", points: 3, question: "What is a ligand?" },
  { id: "q2", difficulty: "medium", points: 4, question: "Define coordination number" },
  { id: "q3", difficulty: "hard", points: 5, question: "Explain crystal field theory" }
];

// Game state
const gameState = {
  playerLigands: { 1: [], 2: [], 3: [], 4: [] },
  playerPoints: { 1: 0, 2: 0, 3: 0, 4: 0 },
  collectedLigandIds: []
};

/**
 * Initialize game mechanics
 */
function initGameMechanics() {
  console.log("Game mechanics initialized!");

  // Initialize WebSocket connection if available
  if (window.wsClient) {
    setupWebSocketListeners();
  }

  // Fallback: Load saved state from sessionStorage
  const saved = sessionStorage.getItem("game-state");
  if (saved) {
    try {
      Object.assign(gameState, JSON.parse(saved));
      updateAllLigandDisplays();
    } catch (e) {
      console.error("Failed to load game state:", e);
    }
  }

  // Listen for events
  document.addEventListener("ligand-continue", () => {
    console.log("Ligand collected, continuing...");
  });

  document.addEventListener("fate-continue", () => {
    console.log("Fate accepted, continuing...");
  });

  document.addEventListener("question-answered", (e) => {
    handleQuestionAnswer(e.detail);
  });

  // Expose to window for testing
  window.GameMechanics = {
    collectLigand,
    showQuestion,
    showFate,
    testTile,
    awardPoints
  };

  console.log("Test: window.GameMechanics.testTile(1, 'ligand')");
}

/**
 * Setup WebSocket event listeners
 */
function setupWebSocketListeners() {
  const ws = window.wsClient;

  // Handle initial state sync
  ws.on('init', (gameStateData) => {
    console.log('Received initial game state:', gameStateData);
    syncGameState(gameStateData);
  });

  // Handle ligand collection from other players
  ws.on('ligandCollected', ({ playerId, ligand }) => {
    console.log(`Player ${playerId} collected ligand:`, ligand);

    // Update local state
    const playerIdNum = parseInt(playerId.split('_')[0]) || 1;
    if (!gameState.playerLigands[playerIdNum]) {
      gameState.playerLigands[playerIdNum] = [];
    }
    gameState.playerLigands[playerIdNum].push(ligand);
    gameState.collectedLigandIds.push(ligand.id);

    updateLigandDisplay(playerIdNum);
  });

  // Handle question answers
  ws.on('questionAnswered', ({ playerId, isCorrect, points, totalPoints }) => {
    console.log(`Player ${playerId} answered: ${isCorrect ? 'Correct' : 'Incorrect'} (${points} pts)`);

    const playerIdNum = parseInt(playerId.split('_')[0]) || 1;
    gameState.playerPoints[playerIdNum] = totalPoints;
  });

  // Handle fate cards
  ws.on('fateDrawn', ({ playerId, fateCard }) => {
    console.log(`Player ${playerId} drew fate:`, fateCard);
  });

  // Handle dice rolls
  ws.on('diceRolled', ({ playerId, value }) => {
    console.log(`Player ${playerId} rolled: ${value}`);
  });

  // Handle piece movement
  ws.on('pieceMoved', ({ playerId, position }) => {
    console.log(`Player ${playerId} moved to position ${position}`);
  });

  // Handle turn changes
  ws.on('turnChanged', ({ currentTurn }) => {
    console.log(`Turn changed to player: ${currentTurn}`);
    updateTurnIndicator(currentTurn);
  });

  console.log('WebSocket listeners configured');
}

/**
 * Sync local game state with server state
 */
function syncGameState(serverState) {
  if (!serverState || !serverState.players) return;

  // Convert server format to local format
  Object.keys(serverState.players).forEach((playerId, index) => {
    const player = serverState.players[playerId];
    const localId = index + 1;

    gameState.playerLigands[localId] = player.ligands || [];
    gameState.playerPoints[localId] = player.points || 0;
  });

  gameState.collectedLigandIds = serverState.collectedLigandIds || [];

  updateAllLigandDisplays();
}

/**
 * Update turn indicator UI
 */
function updateTurnIndicator(currentTurn) {
  // Update turn indicator if element exists
  const indicator = document.querySelector('[data-turn-indicator]');
  if (indicator) {
    indicator.textContent = `Current Turn: ${currentTurn}`;
  }
}

/**
 * Award points to player (exposed for fate cards)
 */
function awardPoints(playerId, points) {
  gameState.playerPoints[playerId] += points;

  // Sync with WebSocket if connected
  if (window.wsClient && window.wsClient.isConnected) {
    // Points will be synced through fate/question handlers
  } else {
    saveState();
  }
}

/**
 * Test function - simulate tile landing
 */
function testTile(playerId, tileType) {
  switch (tileType) {
    case "ligand":
      collectLigand(playerId);
      break;
    case "question":
      showQuestion(playerId);
      break;
    case "fate":
      showFate(playerId);
      break;
    default:
      console.log(`Unknown tile type: ${tileType}`);
  }
}

/**
 * Collect a random ligand
 */
function collectLigand(playerId, ligandId = null) {
  // Get uncollected ligands
  const uncollected = LIGANDS.filter(
    (l) => !gameState.collectedLigandIds.includes(l.id)
  );

  if (uncollected.length === 0) {
    console.log("All ligands collected!");
    return;
  }

  // Pick specific ligand or random
  let ligand;
  if (ligandId) {
    ligand = LIGANDS.find(l => l.id === ligandId);
  }
  if (!ligand) {
    ligand = uncollected[Math.floor(Math.random() * uncollected.length)];
  }

  // Update local state
  gameState.playerLigands[playerId].push(ligand);
  gameState.collectedLigandIds.push(ligand.id);
  updateLigandDisplay(playerId);

  // Sync with WebSocket if connected
  if (window.wsClient && window.wsClient.isConnected) {
    window.wsClient.collectLigand(ligand.id, ligand);
  } else {
    saveState();
  }

  // Show modal
  const modal = document.getElementById("ligand-modal");
  const infoEl = document.getElementById("ligand-info");

  if (modal && infoEl) {
    infoEl.innerHTML = `
      <div class="text-center">
        <h3 class="text-xl font-bold text-gray-800 mb-2">${ligand.name}</h3>
        <p class="text-sm text-gray-600 mb-1">${ligand.formula}</p>
        <p class="text-xs text-gray-500">${ligand.type}</p>
      </div>
    `;

    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }
}

/**
 * Show question modal
 */
function showQuestion(playerId) {
  const question = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
  const modal = document.getElementById("question-modal");
  const contentEl = document.getElementById("question-content");
  const optionsEl = document.getElementById("question-options");

  if (!modal || !contentEl || !optionsEl) return;

  // Store question data
  modal.dataset.playerId = playerId;
  modal.dataset.points = question.points;

  // Display question
  contentEl.innerHTML = `
    <div class="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
      <p class="text-sm text-purple-600 font-bold mb-2">${question.difficulty.toUpperCase()} - ${question.points} points</p>
      <p class="text-lg font-semibold text-gray-800">${question.question}</p>
    </div>
  `;

  // Display options
  optionsEl.innerHTML = `
    <button class="answer-option w-full p-4 bg-gray-100 hover:bg-purple-100 rounded-lg text-left transition-colors border-2 border-transparent" data-answer="1">
      A. Answer Option 1
    </button>
    <button class="answer-option w-full p-4 bg-gray-100 hover:bg-purple-100 rounded-lg text-left transition-colors border-2 border-transparent" data-answer="2">
      B. Answer Option 2
    </button>
    <button class="answer-option w-full p-4 bg-gray-100 hover:bg-purple-100 rounded-lg text-left transition-colors border-2 border-transparent" data-answer="3">
      C. Answer Option 3
    </button>
    <button class="answer-option w-full p-4 bg-gray-100 hover:bg-purple-100 rounded-lg text-left transition-colors border-2 border-transparent" data-answer="4">
      D. Answer Option 4
    </button>
  `;

  // Add selection handlers
  const options = optionsEl.querySelectorAll(".answer-option");
  options.forEach((option) => {
    option.addEventListener("click", () => {
      options.forEach((o) => {
        o.classList.remove("border-purple-500", "bg-purple-100");
      });
      option.classList.add("border-purple-500", "bg-purple-100");
      window.setSelectedAnswer(parseInt(option.dataset.answer));
    });
  });

  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

/**
 * Handle question answer
 */
function handleQuestionAnswer(detail) {
  const modal = document.getElementById("question-modal");
  const feedbackEl = document.getElementById("question-feedback");
  const playerId = parseInt(modal.dataset.playerId);
  const points = parseInt(modal.dataset.points);

  // Simulate 50% correct chance
  const isCorrect = Math.random() > 0.5;

  if (feedbackEl) {
    if (isCorrect) {
      gameState.playerPoints[playerId] += points;

      // Sync with WebSocket if connected
      if (window.wsClient && window.wsClient.isConnected) {
        window.wsClient.answerQuestion(isCorrect, points);
      } else {
        saveState();
      }

      feedbackEl.innerHTML = `
        <div class="bg-green-100 border-2 border-green-500 text-green-800">
          <p class="font-bold">✅ Correct!</p>
          <p class="text-sm">You earned ${points} points!</p>
        </div>
      `;
      feedbackEl.classList.remove("hidden");

      setTimeout(() => {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
        feedbackEl.classList.add("hidden");
      }, 2000);
    } else {
      // Sync incorrect answer too
      if (window.wsClient && window.wsClient.isConnected) {
        window.wsClient.answerQuestion(isCorrect, 0);
      }

      feedbackEl.innerHTML = `
        <div class="bg-red-100 border-2 border-red-500 text-red-800">
          <p class="font-bold">❌ Incorrect</p>
          <p class="text-sm">No points awarded</p>
        </div>
      `;
      feedbackEl.classList.remove("hidden");

      setTimeout(() => {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
        feedbackEl.classList.add("hidden");
      }, 2000);
    }
  }
}

/**
 * Show fate card
 */
function showFate(playerId) {
  const fate = FATE_CARDS[Math.floor(Math.random() * FATE_CARDS.length)];
  const modal = document.getElementById("fate-modal");
  const infoEl = document.getElementById("fate-info");

  if (!modal || !infoEl) return;

  infoEl.innerHTML = `
    <div class="text-center">
      <h3 class="text-lg font-bold text-gray-800 mb-2">${fate.title}</h3>
      <p class="text-sm text-gray-600">${fate.description}</p>
    </div>
  `;

  modal.classList.remove("hidden");
  modal.classList.add("flex");

  // Apply fate effect
  if (fate.effect === "points" && fate.points) {
    gameState.playerPoints[playerId] += fate.points;

    // Sync with WebSocket if connected
    if (window.wsClient && window.wsClient.isConnected) {
      window.wsClient.drawFate(fate);
    } else {
      saveState();
    }
  }
}

/**
 * Update ligand display for a player
 */
function updateLigandDisplay(playerId) {
  const container = document.getElementById(`ligand-display-${playerId}`);
  if (!container) return;

  const ligands = gameState.playerLigands[playerId];

  container.innerHTML = ligands
    .map(
      (ligand) => `
    <div class="w-6 h-6 rounded bg-green-500 flex items-center justify-center text-white text-xs"
         title="${ligand.name}">
      🧪
    </div>
  `
    )
    .join("");
}

/**
 * Update all ligand displays
 */
function updateAllLigandDisplays() {
  [1, 2, 3, 4].forEach((id) => updateLigandDisplay(id));
}

/**
 * Save state to session storage
 */
function saveState() {
  sessionStorage.setItem("game-state", JSON.stringify(gameState));
}

// Auto-initialize
if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initGameMechanics);
  } else {
    initGameMechanics();
  }
}
