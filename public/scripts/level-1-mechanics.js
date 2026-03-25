/**
 * Level 1 Game Mechanics - Complex Chem Quest
 * Handles ligand collection, questions, and fate cards
 */

// Data will be loaded from global window objects set by game-assets component
const getLigands = () => window.LIGANDS_DATA || [];
const getFateCards = () => window.FATE_CARDS_DATA || [];
const getQuestions = () => window.QUESTION_CARDS_DATA || [];

// Game state for Level 1
const level1State = {
  playerInventories: {
    1: [],
    2: [],
    3: [],
    4: [],
  },
  playerPoints: {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
  },
  collectedLigandIds: [], // Track which ligands have been collected globally
  currentPlayer: 1,
};

/**
 * Initialize Level 1 mechanics
 */
export function initLevel1() {
  // Load saved state from session storage if exists
  const saved = sessionStorage.getItem("level1-state");
  if (saved) {
    Object.assign(level1State, JSON.parse(saved));
  }

  // Render ligands for all players
  updateAllPlayerLigandDisplays();

  // Listen for ligand collection continue event
  document.addEventListener("ligand-collected-continue", () => {
    console.log("Ligand collected, continuing game...");
  });

  // Listen for fate card acceptance
  document.addEventListener("fate-accepted", () => {
    console.log("Fate accepted, continuing game...");
  });

  // Listen for question answered
  document.addEventListener("question-answered", (e) => {
    handleQuestionAnswered(e.detail);
  });
}

/**
 * Handle player landing on a tile
 * @param {number} playerId - Player ID (1-4)
 * @param {string} tileType - Type of tile ('ligand', 'question', 'fate', 'start', 'normal')
 */
export function handleTileLanding(playerId, tileType) {
  level1State.currentPlayer = playerId;

  switch (tileType) {
    case "ligand":
      handleLigandTile(playerId);
      break;
    case "question":
      handleQuestionTile(playerId);
      break;
    case "fate":
      handleFateTile(playerId);
      break;
    default:
      console.log(`Player ${playerId} landed on ${tileType} tile`);
  }

  saveState();
}

/**
 * Handle ligand tile - collect a random uncollected ligand
 */
function handleLigandTile(playerId) {
  // Get uncollected ligands
  const uncollected = getLigands().filter(
    (ligand) => !level1State.collectedLigandIds.includes(ligand.id)
  );

  if (uncollected.length === 0) {
    console.log("All ligands collected!");
    return;
  }

  // Pick a random uncollected ligand
  const randomLigand = uncollected[Math.floor(Math.random() * uncollected.length)];

  // Add to player inventory
  level1State.playerInventories[playerId].push(randomLigand);
  level1State.collectedLigandIds.push(randomLigand.id);

  // Update display
  updatePlayerLigandDisplay(playerId);

  // Show collection modal
  showLigandCollectionModal(randomLigand);

  saveState();
}

/**
 * Handle question tile - show random question
 */
function handleQuestionTile(playerId) {
  // Pick a random question
  const questions = getQuestions();
  const randomQuestion = questions[Math.floor(Math.random() * questions.length)];

  // Show question modal
  showQuestionModal(randomQuestion, playerId);
}

/**
 * Handle fate tile - show random fate card
 */
function handleFateTile(playerId) {
  // Pick a random fate card
  const fateCards = getFateCards();
  const randomFate = fateCards[Math.floor(Math.random() * fateCards.length)];

  // Show fate modal
  showFateModal(randomFate, playerId);
}

/**
 * Show ligand collection modal
 */
function showLigandCollectionModal(ligand) {
  const modal = document.getElementById("ligand-collection-modal");
  const infoContainer = document.getElementById("collected-ligand-info");

  if (!modal || !infoContainer) return;

  // Display ligand info
  infoContainer.innerHTML = `
    <div class="text-center">
      <div class="text-4xl mb-3">🧪</div>
      <h3 class="text-xl font-bold text-gray-800 mb-2">${ligand.name}</h3>
      <p class="text-sm text-gray-600">${ligand.formula}</p>
      <div class="mt-3 text-xs text-gray-500">
        <p>Type: ${ligand.type}</p>
        <p>Denticity: ${ligand.denticity}</p>
      </div>
    </div>
  `;

  // Show modal
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

/**
 * Show question modal
 */
function showQuestionModal(question, playerId) {
  const modal = document.getElementById("question-modal");
  const cardContainer = document.getElementById("question-card-container");
  const optionsContainer = document.getElementById("question-options");

  if (!modal || !cardContainer || !optionsContainer) return;

  // Store current question for answer checking
  modal.dataset.playerId = playerId;
  modal.dataset.questionPoints = question.points;
  modal.dataset.difficulty = question.difficulty;

  // Display question card (flip component)
  cardContainer.innerHTML = `
    <div class="question-flip-card-container w-full aspect-[7/5] cursor-pointer">
      <div class="question-flip-card w-full h-full">
        <div class="question-flip-card-face question-flip-card-front absolute inset-0 rounded-lg border-4 overflow-hidden border-purple-500">
          <div class="w-full h-full bg-no-repeat"
               style="background-image: url('/assets/question-cards/${question.imageFile}'); background-position: 0% center; background-size: 200%;"></div>
          <div class="absolute bottom-2 right-2 px-3 py-1 bg-black/70 text-white text-xs rounded">Click to flip</div>
        </div>
        <div class="question-flip-card-face question-flip-card-back absolute inset-0 rounded-lg border-4 overflow-hidden border-purple-500">
          <div class="w-full h-full bg-no-repeat"
               style="background-image: url('/assets/question-cards/${question.imageFile}'); background-position: 100% center; background-size: 200%;"></div>
          <div class="absolute bottom-2 right-2 px-3 py-1 bg-black/70 text-white text-xs rounded">Click to flip back</div>
        </div>
      </div>
    </div>
  `;

  // Add flip functionality
  const flipCard = cardContainer.querySelector(".question-flip-card-container");
  flipCard?.addEventListener("click", () => {
    flipCard.classList.toggle("flipped");
  });

  // For demo: Show 4 answer options (A, B, C, D)
  optionsContainer.innerHTML = `
    <button class="answer-option w-full p-4 bg-gray-100 hover:bg-purple-100 rounded-lg text-left transition-colors border-2 border-transparent hover:border-purple-500" data-answer="1">
      A. Answer Option 1
    </button>
    <button class="answer-option w-full p-4 bg-gray-100 hover:bg-purple-100 rounded-lg text-left transition-colors border-2 border-transparent hover:border-purple-500" data-answer="2">
      B. Answer Option 2
    </button>
    <button class="answer-option w-full p-4 bg-gray-100 hover:bg-purple-100 rounded-lg text-left transition-colors border-2 border-transparent hover:border-purple-500" data-answer="3">
      C. Answer Option 3
    </button>
    <button class="answer-option w-full p-4 bg-gray-100 hover:bg-purple-100 rounded-lg text-left transition-colors border-2 border-transparent hover:border-purple-500" data-answer="4">
      D. Answer Option 4
    </button>
  `;

  // Add answer selection
  const options = optionsContainer.querySelectorAll(".answer-option");
  options.forEach((option) => {
    option.addEventListener("click", () => {
      options.forEach((o) => o.classList.remove("border-purple-500", "bg-purple-100"));
      option.classList.add("border-purple-500", "bg-purple-100");
      window.setSelectedAnswer(parseInt(option.dataset.answer));
    });
  });

  // Show modal
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

/**
 * Handle question answered
 */
function handleQuestionAnswered(detail) {
  const modal = document.getElementById("question-modal");
  const playerId = parseInt(modal.dataset.playerId);
  const points = parseInt(modal.dataset.questionPoints);
  const difficulty = modal.dataset.difficulty;

  // For demo: Always correct (50% chance in real game)
  const isCorrect = Math.random() > 0.5;

  const feedbackEl = document.getElementById("question-feedback");
  if (feedbackEl && isCorrect) {
    // Award points
    level1State.playerPoints[playerId] += points;

    feedbackEl.innerHTML = `
      <div class="bg-green-100 border-2 border-green-500 text-green-800">
        <p class="font-bold">✅ Correct!</p>
        <p class="text-sm">You earned ${points} points!</p>
      </div>
    `;
    feedbackEl.classList.remove("hidden");

    // Update points display
    updatePlayerPoints(playerId);

    setTimeout(() => {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
      feedbackEl.classList.add("hidden");
    }, 2000);
  } else if (feedbackEl) {
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

  saveState();
}

/**
 * Show fate modal
 */
function showFateModal(fateCard, playerId) {
  const modal = document.getElementById("fate-modal");
  const infoContainer = document.getElementById("fate-card-info");

  if (!modal || !infoContainer) return;

  // Display fate card info
  infoContainer.innerHTML = `
    <div class="text-center">
      <h3 class="text-lg font-bold text-gray-800 mb-2">${fateCard.title}</h3>
      <p class="text-sm text-gray-600">${fateCard.description}</p>
      ${fateCard.effect ? `<p class="text-xs text-gray-500 mt-2">Effect: ${fateCard.effect}</p>` : ""}
    </div>
  `;

  // Show modal
  modal.classList.remove("hidden");
  modal.classList.add("flex");

  // Apply fate effect (simplified for now)
  if (fateCard.points) {
    level1State.playerPoints[playerId] += fateCard.points;
    updatePlayerPoints(playerId);
    saveState();
  }
}

/**
 * Update player ligand display
 */
function updatePlayerLigandDisplay(playerId) {
  const container = document.getElementById(`player-${playerId}-ligands`);
  if (!container) return;

  const ligands = level1State.playerInventories[playerId];

  container.innerHTML = ligands
    .map(
      (ligand) => `
    <div class="w-8 h-8 rounded bg-green-500 flex items-center justify-center text-white text-xs font-bold"
         title="${ligand.name}">
      🧪
    </div>
  `
    )
    .join("");
}

/**
 * Update all player ligand displays
 */
function updateAllPlayerLigandDisplays() {
  [1, 2, 3, 4].forEach((playerId) => updatePlayerLigandDisplay(playerId));
}

/**
 * Update player points display
 */
function updatePlayerPoints(playerId) {
  console.log(`Player ${playerId} now has ${level1State.playerPoints[playerId]} points`);
  // Points display can be added to player card in future enhancement
}

/**
 * Save state to session storage
 */
function saveState() {
  sessionStorage.setItem("level1-state", JSON.stringify(level1State));
}

/**
 * Get player inventory
 */
export function getPlayerInventory(playerId) {
  return level1State.playerInventories[playerId] || [];
}

/**
 * Get player points
 */
export function getPlayerPoints(playerId) {
  return level1State.playerPoints[playerId] || 0;
}

// Initialize on load
if (typeof window !== "undefined") {
  window.Level1 = {
    init: initLevel1,
    handleTileLanding,
    getPlayerInventory,
    getPlayerPoints,
  };
}
