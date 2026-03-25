/**
 * Game Mechanics with Beautiful Cards
 * Shows ligand flip cards, question flip cards, and fate cards
 */

// Load data from ligands.ts
const LIGANDS_DATA = [
  { id: "h2o", name: "H₂O", color: "#3B82F6", imageFile: "1.png" },
  { id: "phen", name: "phen", color: "#10B981", imageFile: "2.png" },
  { id: "bipy", name: "bipy", color: "#8B5CF6", imageFile: "3.png" },
  { id: "ox", name: "ox", color: "#EF4444", imageFile: "4.png" },
  { id: "py", name: "py", color: "#F59E0B", imageFile: "5.png" },
  { id: "nh3", name: "NH₃", color: "#06B6D4", imageFile: "6.png" },
  { id: "pph3", name: "PPh₃", color: "#EC4899", imageFile: "7.png" },
  { id: "cl", name: "Cl⁻", color: "#14B8A6", imageFile: "8.png" },
  { id: "en", name: "en", color: "#6366F1", imageFile: "9.png" },
  { id: "acac", name: "acac", color: "#F97316", imageFile: "10.png" },
  { id: "co32", name: "CO₃²⁻", color: "#84CC16", imageFile: "11.png" },
  { id: "cn", name: "CN⁻", color: "#A855F7", imageFile: "12.png" },
  { id: "o2", name: "O²⁻", color: "#EF4444", imageFile: "13.png" }
];

// Question cards (6-23.png)
const QUESTION_CARDS = [
  { id: "q1", imageFile: "6.png", difficulty: "easy", points: 3 },
  { id: "q2", imageFile: "7.png", difficulty: "easy", points: 3 },
  { id: "q3", imageFile: "8.png", difficulty: "easy", points: 3 },
  { id: "q4", imageFile: "9.png", difficulty: "easy", points: 3 },
  { id: "q5", imageFile: "10.png", difficulty: "medium", points: 4 },
  { id: "q6", imageFile: "11.png", difficulty: "medium", points: 4 },
  { id: "q7", imageFile: "12.png", difficulty: "medium", points: 4 },
  { id: "q8", imageFile: "13.png", difficulty: "medium", points: 4 },
  { id: "q9", imageFile: "14.png", difficulty: "medium", points: 4 },
  { id: "q10", imageFile: "15.png", difficulty: "medium", points: 4 },
  { id: "q11", imageFile: "16.png", difficulty: "hard", points: 5 },
  { id: "q12", imageFile: "17.png", difficulty: "hard", points: 5 },
  { id: "q13", imageFile: "18.png", difficulty: "hard", points: 5 },
  { id: "q14", imageFile: "19.png", difficulty: "hard", points: 5 },
  { id: "q15", imageFile: "20.png", difficulty: "hard", points: 5 },
  { id: "q16", imageFile: "21.png", difficulty: "hard", points: 5 },
  { id: "q17", imageFile: "22.png", difficulty: "hard", points: 5 },
  { id: "q18", imageFile: "23.png", difficulty: "hard", points: 5 }
];

// Fate cards
// Fate Cards - text-based cards rendered with HTML/CSS (not images)
const FATE_CARDS_DATA = [
  {
    id: "point-booster",
    title: "Point Booster",
    description: "You've earned an Extra Points card. Hold onto it until the end of the game for an extra three points.",
    effect: "point-booster",
    value: 3,
  },
  {
    id: "eureka-moment",
    title: "Eureka Moment",
    description: "Congratulations! Fate smiles upon you, granting you an extra Ligand card.",
    effect: "ligand-gain",
    value: 1,
  },
  {
    id: "minus-card",
    title: "Minus Card",
    description: "You've been dealt a Minus Card, deducting three points from your score. Hold until the end of the game.",
    effect: "minus",
    value: -3,
  },
  {
    id: "ligand-square",
    title: "Ligand Square",
    description: "Move ahead 3 spaces. Fate pushes you forward",
    effect: "move-forward",
    value: 3,
  },
  {
    id: "second-chance",
    title: "Second Chance",
    description: "Fate grants you an extra turn.",
    effect: "extra-turn",
    value: 1,
  },
  {
    id: "destiny-dance",
    title: "Destiny Dance",
    description: "Roll the dice and let fate decide your direction. You might move backward on the board.",
    effect: "destiny-dance",
  },
  {
    id: "swap-card",
    title: "Swap Card",
    description: "Swap one card with another player of your choice.",
    effect: "swap-card",
  },
  {
    id: "karma-kickback",
    title: "Karma Kickback",
    description: "You must return any one of your Ligand cards back.",
    effect: "karma-kickback",
    value: -1,
  },
  {
    id: "twist-fate",
    title: "Twist of Fate",
    description: "You must exchange one of your Ligand cards with the previous player.",
    effect: "twist-fate",
  },
  {
    id: "generous-gesture",
    title: "Generous Gesture",
    description: "Spread the joy by donating one of your Ligand cards to another player.",
    effect: "generous-gesture",
    value: -1,
  },
];

// Game state
const gameState = {
  playerLigands: { 1: [], 2: [], 3: [], 4: [] },
  playerPoints: { 1: 0, 2: 0, 3: 0, 4: 0 }, // Question points for each player
  collectedLigandIds: [],
  currentPlayer: 1 // Track whose turn it is
};

// Question points based on difficulty
const QUESTION_POINTS = {
  easy: 2,    // Green
  medium: 3,  // Yellow
  hard: 5     // Red
};

function initGameMechanics() {
  console.log("Game mechanics with cards initialized!");

  const saved = sessionStorage.getItem("game-state");
  if (saved) {
    Object.assign(gameState, JSON.parse(saved));
    updateAllLigandDisplays();
    updateAllPointsDisplays(); // Update points displays from saved state
  }

  // Listen for question answered events
  document.addEventListener("question-answered", handleQuestionAnswered);

  window.GameMechanics = {
    collectLigand,
    showQuestion,
    showFate,
    setCurrentPlayer,
    getCurrentPlayer: () => gameState.currentPlayer,
    awardPoints: awardQuestionPoints,
    getPlayerPoints: (playerId) => gameState.playerPoints[playerId],
    testTile: (playerId, tileType) => {
      if (tileType === "ligand") collectLigand(playerId);
      else if (tileType === "question") showQuestion(playerId);
      else if (tileType === "fate") showFate(playerId);
    }
  };

  console.log("Test commands:");
  console.log("  window.GameMechanics.testTile(1, 'ligand') - Collect ligand for player 1");
  console.log("  window.GameMechanics.setCurrentPlayer(2) - Change turn to player 2");
  console.log("  window.GameMechanics.getCurrentPlayer() - Check whose turn it is");
  console.log("  window.GameMechanics.getPlayerPoints(1) - Get player 1 points");
}

/**
 * Handle question answered event - award points if correct
 */
function handleQuestionAnswered(event) {
  const { answer } = event.detail;
  const modal = document.getElementById("question-modal");
  if (!modal) return;

  const playerId = parseInt(modal.dataset.playerId);
  const correctAnswer = parseInt(modal.dataset.correctAnswer);
  const difficulty = modal.dataset.difficulty;
  const points = QUESTION_POINTS[difficulty] || 0;

  console.log(`🎯 Question answered: Player ${playerId}, Answer: ${answer}, Correct: ${correctAnswer}, Difficulty: ${difficulty}`);

  const isCorrect = answer === correctAnswer;

  if (isCorrect) {
    awardQuestionPoints(playerId, points, difficulty);
    console.log(`✅ Correct! Player ${playerId} earned ${points} points (${difficulty})`);
  } else {
    console.log(`❌ Incorrect! No points awarded`);
  }

  // Show feedback in modal
  showQuestionFeedback(isCorrect, points, difficulty);
}

/**
 * Award question points to a player
 */
function awardQuestionPoints(playerId, points, difficulty) {
  gameState.playerPoints[playerId] += points;
  updatePointsDisplay(playerId);
  saveState();

  console.log(`💰 Player ${playerId} total points: ${gameState.playerPoints[playerId]}`);
}

/**
 * Update points display for a specific player
 */
function updatePointsDisplay(playerId) {
  const pointsElement = document.getElementById(`player-${playerId}-points`);
  if (pointsElement) {
    pointsElement.textContent = gameState.playerPoints[playerId];
  }
}

/**
 * Update all players' points displays
 */
function updateAllPointsDisplays() {
  [1, 2, 3, 4].forEach(id => updatePointsDisplay(id));
}

/**
 * Show feedback after answering a question
 */
function showQuestionFeedback(isCorrect, points, difficulty) {
  const feedbackEl = document.getElementById("question-feedback");
  if (!feedbackEl) return;

  const difficultyColors = {
    easy: "bg-green-100 border-green-500 text-green-800",
    medium: "bg-yellow-100 border-yellow-500 text-yellow-800",
    hard: "bg-red-100 border-red-500 text-red-800"
  };

  const bgColor = isCorrect ? "bg-green-100 border-green-500" : "bg-red-100 border-red-500";
  const textColor = isCorrect ? "text-green-800" : "text-red-800";

  feedbackEl.className = `p-4 rounded-lg mb-4 border-2 ${bgColor} ${textColor}`;
  feedbackEl.innerHTML = `
    <div class="flex items-center gap-3">
      <span class="text-3xl">${isCorrect ? '✅' : '❌'}</span>
      <div>
        <p class="font-bold text-lg">${isCorrect ? 'Correct!' : 'Incorrect'}</p>
        ${isCorrect ? `<p class="text-sm">You earned <strong>${points} points</strong> (${difficulty} question)</p>` : '<p class="text-sm">Better luck next time!</p>'}
      </div>
    </div>
  `;
  feedbackEl.classList.remove("hidden");

  // Auto-hide feedback after 3 seconds and close modal
  setTimeout(() => {
    feedbackEl.classList.add("hidden");
    document.getElementById("question-modal")?.classList.add("hidden");
    document.getElementById("question-modal")?.classList.remove("flex");

    // Dispatch event to notify orchestrator that modal is closed
    document.dispatchEvent(new CustomEvent("question-continue"));
  }, 3000);
}

function collectLigand(playerId) {
  const uncollected = LIGANDS_DATA.filter(l => !gameState.collectedLigandIds.includes(l.id));
  if (uncollected.length === 0) return;

  const ligand = uncollected[Math.floor(Math.random() * uncollected.length)];
  gameState.playerLigands[playerId].push(ligand);
  gameState.collectedLigandIds.push(ligand.id);

  updateLigandDisplay(playerId);
  showLigandModal(ligand, "🧪 Ligand Collected!", "Click card to see details");

  saveState();
}

function viewLigandDetail(ligand) {
  showLigandModal(ligand, "🔍 Ligand Details", "Review your collected ligand");
}

function showLigandModal(ligand, title, subtitle) {
  const modal = document.getElementById("ligand-modal");
  const container = document.getElementById("ligand-card-container");
  const modalTitle = modal?.querySelector("h2");
  const modalSubtitle = modal?.querySelector("p");

  if (modal && container) {
    // Update modal title and subtitle
    if (modalTitle) modalTitle.textContent = title;
    if (modalSubtitle) modalSubtitle.textContent = subtitle;

    // Render ligand flip card
    container.innerHTML = `
      <div class="ligand-flip-card-container w-full aspect-[3/4] cursor-pointer">
        <div class="ligand-flip-card w-full h-full">
          <div class="ligand-flip-card-face ligand-flip-card-front absolute inset-0 rounded-lg border-4 overflow-hidden" style="border-color: ${ligand.color};">
            <div class="w-full h-full bg-no-repeat" style="background-image: url('/assets/ligand-cards/${ligand.imageFile}'); background-position: 0% center; background-size: 200%;"></div>
            <div class="absolute bottom-2 right-2 px-3 py-1 bg-black/70 text-white text-xs rounded">Click to flip</div>
          </div>
          <div class="ligand-flip-card-face ligand-flip-card-back absolute inset-0 rounded-lg border-4 overflow-hidden" style="border-color: ${ligand.color};">
            <div class="w-full h-full bg-no-repeat" style="background-image: url('/assets/ligand-cards/${ligand.imageFile}'); background-position: 100% center; background-size: 200%;"></div>
            <div class="absolute bottom-2 right-2 px-3 py-1 bg-black/70 text-white text-xs rounded">Click to flip back</div>
          </div>
        </div>
      </div>
    `;

    // Add flip handler
    const flipCard = container.querySelector(".ligand-flip-card-container");
    flipCard.addEventListener("click", () => flipCard.classList.toggle("flipped"));

    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }
}

function showQuestion(playerId) {
  const question = QUESTION_CARDS[Math.floor(Math.random() * QUESTION_CARDS.length)];
  const modal = document.getElementById("question-modal");
  const cardContainer = document.getElementById("question-card-container");
  const optionsContainer = document.getElementById("question-options");

  if (!modal || !cardContainer || !optionsContainer) return;

  modal.dataset.playerId = playerId;
  modal.dataset.points = question.points;
  modal.dataset.difficulty = question.difficulty;
  modal.dataset.correctAnswer = "1"; // TODO: Add correct answers to QUESTION_CARDS data

  const difficultyColors = {
    easy: "#10B981",
    medium: "#F59E0B",
    hard: "#EF4444"
  };

  // Render question flip card
  cardContainer.innerHTML = `
    <div class="question-flip-card-container w-full aspect-[7/5] cursor-pointer">
      <div class="question-flip-card w-full h-full">
        <div class="question-flip-card-face question-flip-card-front absolute inset-0 rounded-lg border-4 overflow-hidden" style="border-color: ${difficultyColors[question.difficulty]};">
          <div class="w-full h-full bg-no-repeat" style="background-image: url('/assets/question-cards/${question.imageFile}'); background-position: 0% center; background-size: 200%;"></div>
          <div class="absolute bottom-2 right-2 px-3 py-1 bg-black/70 text-white text-xs rounded">Click to flip</div>
        </div>
        <div class="question-flip-card-face question-flip-card-back absolute inset-0 rounded-lg border-4 overflow-hidden" style="border-color: ${difficultyColors[question.difficulty]};">
          <div class="w-full h-full bg-no-repeat" style="background-image: url('/assets/question-cards/${question.imageFile}'); background-position: 100% center; background-size: 200%;"></div>
          <div class="absolute bottom-2 right-2 px-3 py-1 bg-black/70 text-white text-xs rounded">Click to flip back</div>
        </div>
      </div>
    </div>
  `;

  // Add flip handler
  const flipCard = cardContainer.querySelector(".question-flip-card-container");
  flipCard.addEventListener("click", () => flipCard.classList.toggle("flipped"));

  // Options
  optionsContainer.innerHTML = `
    <button class="answer-option w-full p-4 bg-gray-100 hover:bg-purple-100 rounded-lg text-left transition-colors border-2 border-transparent" data-answer="1">A. Answer Option 1</button>
    <button class="answer-option w-full p-4 bg-gray-100 hover:bg-purple-100 rounded-lg text-left transition-colors border-2 border-transparent" data-answer="2">B. Answer Option 2</button>
    <button class="answer-option w-full p-4 bg-gray-100 hover:bg-purple-100 rounded-lg text-left transition-colors border-2 border-transparent" data-answer="3">C. Answer Option 3</button>
    <button class="answer-option w-full p-4 bg-gray-100 hover:bg-purple-100 rounded-lg text-left transition-colors border-2 border-transparent" data-answer="4">D. Answer Option 4</button>
  `;

  const options = optionsContainer.querySelectorAll(".answer-option");
  options.forEach(option => {
    option.addEventListener("click", () => {
      options.forEach(o => o.classList.remove("border-purple-500", "bg-purple-100"));
      option.classList.add("border-purple-500", "bg-purple-100");
      window.setSelectedAnswer(parseInt(option.dataset.answer));
    });
  });

  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function showFate(playerId) {
  const fate = FATE_CARDS_DATA[Math.floor(Math.random() * FATE_CARDS_DATA.length)];
  const modal = document.getElementById("fate-modal");
  const container = document.getElementById("fate-card-container");

  if (modal && container) {
    // Store fate card data in modal for later use
    modal.dataset.playerId = playerId;
    modal.dataset.fateEffect = fate.effect;
    modal.dataset.fateValue = fate.value || 0;
    modal.dataset.fateTitle = fate.title;

    console.log(`🔺 [FATE] Player ${playerId} got fate card: ${fate.title} (${fate.effect}, value: ${fate.value || 0})`);

    // Render fate card with HTML/CSS (matching FateCard component design)
    const valueHTML = fate.value !== undefined
      ? `<div class="mt-3 px-3 py-1 bg-red-100 rounded-full text-red-700 font-bold text-sm">
           ${fate.value > 0 ? '+' : ''}${fate.value}
         </div>`
      : '';

    container.innerHTML = `
      <div class="fate-card relative bg-white border-4 border-red-600 rounded-lg flex flex-col items-center justify-center p-6 w-full aspect-[3/4] shadow-xl">
        <!-- Warning Triangle at Top -->
        <div class="triangle-container mb-4">
          <div class="triangle">
            <span class="triangle-text">!</span>
          </div>
        </div>

        <!-- Card Title -->
        <h3 class="font-black text-red-600 text-center text-base uppercase mb-3 leading-tight">
          ${fate.title}
        </h3>

        <!-- Card Description -->
        <p class="text-xs text-center leading-relaxed text-gray-800">
          ${fate.description}
        </p>

        <!-- Value Badge -->
        ${valueHTML}
      </div>

      <style>
        .triangle-container {
          position: relative;
          width: 60px;
          height: 52px;
        }
        .triangle {
          position: relative;
          width: 0;
          height: 0;
          border-left: 30px solid transparent;
          border-right: 30px solid transparent;
          border-bottom: 52px solid #dc2626;
        }
        .triangle-text {
          position: absolute;
          top: 24px;
          left: 50%;
          transform: translateX(-50%);
          color: white;
          font-size: 28px;
          font-weight: 900;
          line-height: 1;
        }
      </style>
    `;

    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }
}

function updateLigandDisplay(playerId) {
  const container = document.getElementById(`ligand-display-${playerId}`);
  if (!container) return;

  const isCurrentPlayer = gameState.currentPlayer === playerId;
  const cursorClass = isCurrentPlayer ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed opacity-60';
  const titleText = isCurrentPlayer ? 'Click to view' : 'Wait for your turn';

  container.innerHTML = gameState.playerLigands[playerId]
    .map((l, index) => `
      <div class="ligand-mini-card aspect-[3/4] rounded border-2 overflow-hidden shadow-sm transition-transform ${cursorClass}"
           style="border-color: ${l.color};"
           title="${l.name} - ${titleText}"
           data-ligand-id="${l.id}"
           data-player-id="${playerId}"
           data-index="${index}">
        <div class="w-full h-full bg-cover bg-center" style="background-image: url('/assets/ligand-cards/${l.imageFile}'); background-position: 0% center; background-size: 200%;"></div>
      </div>
    `)
    .join("");

  // Add click listeners to mini cards - ONLY for current player
  if (isCurrentPlayer) {
    container.querySelectorAll('.ligand-mini-card').forEach(card => {
      card.addEventListener('click', () => {
        const ligandId = card.dataset.ligandId;
        const ligand = LIGANDS_DATA.find(l => l.id === ligandId);
        if (ligand) {
          viewLigandDetail(ligand);
        }
      });
    });
  }
}

function updateAllLigandDisplays() {
  [1, 2, 3, 4].forEach(id => updateLigandDisplay(id));
}

function setCurrentPlayer(playerId) {
  gameState.currentPlayer = playerId;
  updateAllLigandDisplays(); // Refresh all displays to update clickable state
  saveState();
  console.log(`Current turn: Player ${playerId}`);
}

function saveState() {
  sessionStorage.setItem("game-state", JSON.stringify(gameState));
}

// CSS for flip cards
const style = document.createElement("style");
style.textContent = `
  .ligand-flip-card-container, .question-flip-card-container {
    perspective: 1000px;
  }
  .ligand-flip-card, .question-flip-card {
    transform-style: preserve-3d;
    transition: transform 0.6s;
    position: relative;
  }
  .ligand-flip-card-face, .question-flip-card-face {
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
  }
  .ligand-flip-card-back, .question-flip-card-back {
    transform: rotateY(180deg);
  }
  .ligand-flip-card-container.flipped .ligand-flip-card,
  .question-flip-card-container.flipped .question-flip-card {
    transform: rotateY(180deg);
  }
`;
document.head.appendChild(style);

if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initGameMechanics);
  } else {
    initGameMechanics();
  }
}
