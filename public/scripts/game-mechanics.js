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

  // Load saved state
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
    testTile
  };

  console.log("Test: window.GameMechanics.testTile(1, 'ligand')");
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
function collectLigand(playerId) {
  // Get uncollected ligands
  const uncollected = LIGANDS.filter(
    (l) => !gameState.collectedLigandIds.includes(l.id)
  );

  if (uncollected.length === 0) {
    console.log("All ligands collected!");
    return;
  }

  // Pick random ligand
  const ligand = uncollected[Math.floor(Math.random() * uncollected.length)];

  // Add to player inventory
  gameState.playerLigands[playerId].push(ligand);
  gameState.collectedLigandIds.push(ligand.id);

  // Update display
  updateLigandDisplay(playerId);

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

  saveState();
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

      saveState();
    } else {
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
    saveState();
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
