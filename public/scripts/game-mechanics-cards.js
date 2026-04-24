/**
 * Game Mechanics with Beautiful Cards
 * Shows ligand flip cards, question flip cards, and fate cards
 */

// Load data from ligands.ts
// Image files verified: 1.png=H₂O, 2.png=NH₃, 3.png=py, 4.png=PPh₃, 5.png=CN⁻, 6.png=O²⁻,
// 7.png=CI, 8.png=ox, 9.png=acac, 10.png=CO₃²⁻, 11.png=phen, 12.png=bipy, 13.png=en
const LIGANDS_DATA = [
  { id: "h2o", name: "H₂O", color: "#3B82F6", imageFile: "1.png" },      // 1.png = H₂O
  { id: "nh3", name: "NH₃", color: "#06B6D4", imageFile: "2.png" },      // 2.png = NH₃
  { id: "py", name: "py", color: "#F59E0B", imageFile: "3.png" },        // 3.png = py
  { id: "pph3", name: "PPh₃", color: "#EC4899", imageFile: "4.png" },    // 4.png = PPh₃
  { id: "cn", name: "CN⁻", color: "#A855F7", imageFile: "5.png" },       // 5.png = CN⁻
  { id: "o2", name: "O²⁻", color: "#EF4444", imageFile: "6.png" },       // 6.png = O²⁻
  { id: "cl", name: "CI", color: "#14B8A6", imageFile: "7.png" },        // 7.png = CI (Board uses "CI" not "Cl⁻")
  { id: "ox", name: "ox", color: "#EF4444", imageFile: "8.png" },        // 8.png = ox
  { id: "acac", name: "acac", color: "#F97316", imageFile: "9.png" },    // 9.png = acac
  { id: "co32", name: "CO₃²⁻", color: "#84CC16", imageFile: "10.png" },  // 10.png = CO₃²⁻
  { id: "phen", name: "phen", color: "#10B981", imageFile: "11.png" },   // 11.png = phen
  { id: "bipy", name: "bipy", color: "#8B5CF6", imageFile: "12.png" },   // 12.png = bipy
  { id: "en", name: "en", color: "#6366F1", imageFile: "13.png" }        // 13.png = en
];

// Question cards (6-23.png)
// Background colors: red=hard(5pts), yellow=medium(3pts), green=easy(2pts)
// correctAnswer: 1=A, 2=B, 3=C, 4=D (1-based to match button data-answer values)
const QUESTION_CARDS = [
  // ==========================================
  // HARD QUESTIONS (Red border - 5 points)
  // ==========================================
  {
    id: "q1",
    imageFile: "6.png",
    difficulty: "hard",
    points: 5,
    correctAnswer: 3, // C
    answers: ["4", "5", "6", "7"]
  },
  {
    id: "q2",
    imageFile: "7.png",
    difficulty: "hard",
    points: 5,
    correctAnswer: 3, // C
    answers: ["+1", "+2", "+3", "+4"]
  },
  {
    id: "q3",
    imageFile: "8.png",
    difficulty: "hard",
    points: 5,
    correctAnswer: 2, // B
    answers: ["+1", "+2", "+3", "+4"]
  },
  {
    id: "q4",
    imageFile: "9.png",
    difficulty: "hard",
    points: 5,
    correctAnswer: 3, // C
    answers: ["+1", "+2", "+3", "+4"]
  },
  {
    id: "q5",
    imageFile: "10.png",
    difficulty: "hard",
    points: 5,
    correctAnswer: 3, // C
    answers: [
      "Tetraammoniadiwater chromium (III) ion",
      "Tetraammoniadiaquachromate (III) ion",
      "Tetraammoniadi aquachromium (III) ion",
      "Tetraammoniediaquachromate (III) ion"
    ]
  },
  {
    id: "q6",
    imageFile: "11.png",
    difficulty: "hard",
    points: 5,
    correctAnswer: 2, // B
    answers: ["2", "4", "6", "8"]
  },

  // ==========================================
  // MEDIUM QUESTIONS (Yellow border - 3 points)
  // ==========================================
  {
    id: "q7",
    imageFile: "12.png",
    difficulty: "medium",
    points: 3,
    correctAnswer: 2, // B
    answers: [
      "Donates one pair of electrons to a metal ion",
      "Forms a ring structure with the metal ion",
      "Bonds with metal ions through hydrogen bonds",
      "Releases electrons to become positively charged"
    ]
  },
  {
    id: "q8",
    imageFile: "13.png",
    difficulty: "medium",
    points: 3,
    correctAnswer: 1, // A
    answers: ["K⁺", "Co³⁺", "NH₃", "Br⁻"]
  },
  {
    id: "q9",
    imageFile: "14.png",
    difficulty: "medium",
    points: 3,
    correctAnswer: 1, // A
    answers: ["4", "5", "6", "7"]
  },
  {
    id: "q10",
    imageFile: "15.png",
    difficulty: "medium",
    points: 3,
    correctAnswer: 2, // B
    answers: [
      "[Cu(H₂O)₄]²⁺",
      "[Co(NH₃)₆]³⁺",
      "[Fe(CN)₆]⁴⁻",
      "[PtCl₄]²⁻"
    ]
  },
  {
    id: "q11",
    imageFile: "16.png",
    difficulty: "medium",
    points: 3,
    correctAnswer: 3, // C
    answers: [
      "Cyanide (CN⁻)",
      "Ammonia (NH₃)",
      "Ethylenediamine (en)",
      "Water (H₂O)"
    ]
  },
  {
    id: "q12",
    imageFile: "17.png",
    difficulty: "medium",
    points: 3,
    correctAnswer: 3, // C
    answers: [
      "They can only form monodentate complexes with metal ions.",
      "They possess four donor atoms capable of coordinating to a metal ion.",
      "They are known for their ability to form stable chelate complexes with metal ions.",
      "They exhibit z-donor properties, facilitating the stabilization of metal complexes."
    ]
  },

  // ==========================================
  // EASY QUESTIONS (Green border - 2 points)
  // ==========================================
  {
    id: "q13",
    imageFile: "18.png",
    difficulty: "easy",
    points: 2,
    correctAnswer: 3, // C
    answers: ["Square Planar", "Tetrahedral", "Octahedral", "Linear"]
  },
  {
    id: "q14",
    imageFile: "19.png",
    difficulty: "easy",
    points: 2,
    correctAnswer: 3, // C
    answers: ["CH₃COO⁻", "CO₃²⁻", "C₂O₄²⁻", "S₂O₃²⁻"]
  },
  {
    id: "q15",
    imageFile: "20.png",
    difficulty: "easy",
    points: 2,
    correctAnswer: 3, // C
    answers: ["NH₃", "H₂O", "C₂O₄²⁻", "Cl⁻"]
  },
  {
    id: "q16",
    imageFile: "21.png",
    difficulty: "easy",
    points: 2,
    correctAnswer: 4, // D
    answers: [
      "Cationic complex",
      "Anionic complex",
      "Heterobimetallic complex",
      "Homobimetallic complex"
    ]
  },
  {
    id: "q17",
    imageFile: "22.png",
    difficulty: "easy",
    points: 2,
    correctAnswer: 2, // B
    answers: ["2", "4", "6", "8"]
  },
  {
    id: "q18",
    imageFile: "23.png",
    difficulty: "easy",
    points: 2,
    correctAnswer: 2, // B
    answers: ["I only", "I and II only", "I, II, and III"]
  }
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
  piecePositions: {}, // Track all piece positions: { "Player1H1": 5, "Player2H1": 12, ... }
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

    // Restore piece positions after a delay to ensure DOM and movement scripts are ready
    setTimeout(() => {
      console.log("⏱️ Starting piece position restoration...");
      restorePiecePositions();
    }, 1500); // Increased delay to ensure all scripts loaded
  }

  // Listen for question answered events
  document.addEventListener("question-answered", handleQuestionAnswered);

  // Listen for piece movement to save positions
  // Tile handling (ligand/fate/question modals) is done by the inline script in game-board.astro
  document.addEventListener("piece-moved", (event) => {
    console.log("🎯 Piece moved, saving positions...");
    savePiecePositions();
  });

  window.GameMechanics = {
    collectLigand,
    showQuestion,
    showFate,
    setCurrentPlayer,
    getCurrentPlayer: () => gameState.currentPlayer,
    awardPoints: awardQuestionPoints,
    getPlayerPoints: (playerId) => gameState.playerPoints[playerId],
    getGlobalUncollectedLigands,
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
 * Get ligands that haven't been collected by ANY player yet
 * @returns {Array} Array of uncollected ligand objects
 */
function getGlobalUncollectedLigands() {
  return LIGANDS_DATA.filter(ligand =>
    !gameState.collectedLigandIds.includes(ligand.id)
  );
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
    if (window.AudioManager) window.AudioManager.play('correct');
  } else {
    console.log(`❌ Incorrect! No points awarded`);
    if (window.AudioManager) window.AudioManager.play('wrong');
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
  const modal = document.getElementById("question-modal");
  const cardContainer = document.getElementById("question-card-container");
  if (!feedbackEl || !modal) return;

  const correctAnswer = parseInt(modal.dataset.correctAnswer);
  const selectedAnswer = parseInt(modal.dataset.selectedAnswer || 0);

  // Update card to show the actual question (right side of image) with enhanced styling
  if (cardContainer) {
    const difficultyConfig = {
      easy: {
        color: "#10B981",
        bgSolid: "bg-green-500",
        label: "EASY",
        icon: ""
      },
      medium: {
        color: "#F59E0B",
        bgSolid: "bg-amber-500",
        label: "MEDIUM",
        icon: ""
      },
      hard: {
        color: "#EF4444",
        bgSolid: "bg-red-500",
        label: "HARD",
        icon: ""
      }
    };

    const config = difficultyConfig[difficulty] || difficultyConfig.easy;

    // Get the question image file from the existing card
    // The bg image is on the inner div (absolute inset-0), not the outer wrapper div
    // Use imageFile from modal data attribute (stored in showQuestion)
    const imageFile = modal.dataset.imageFile || '';

    cardContainer.innerHTML = `
      <div class="question-card w-full rounded-2xl overflow-hidden shadow-2xl border-4 transform transition-all duration-300 hover:scale-[1.01]" style="border-color: ${config.color};">
        <!-- Show actual question (right side of card image) -->
        <div class="w-full aspect-[7/5] bg-no-repeat relative group" style="${imageFile ? "background-image: url('/assets/question-cards/" + imageFile + "'); " : ''}background-position: 100% center; background-size: 200%;">

          <!-- Difficulty badge with modern design -->
          <div class="absolute top-3 left-3 px-4 py-2 rounded-xl text-xs font-bold text-white backdrop-blur-md shadow-lg ${config.bgSolid} flex items-center gap-2 animate-slideInLeft">
            <span class="text-base">${config.icon}</span>
            <span>${config.label} • ${points} PTS</span>
          </div>

          <!-- Result badge with animation -->
          <div class="absolute bottom-3 right-3 px-4 py-2 bg-black/80 backdrop-blur-md text-white text-sm rounded-xl font-bold shadow-lg flex items-center gap-2 ${isCorrect ? 'animate-bounceIn' : 'animate-shakeX'}">
            <span class="text-lg font-bold">${isCorrect ? 'Correct' : 'Wrong'}</span>
            <span>${isCorrect ? 'Correct!' : 'Wrong'}</span>
          </div>

          <!-- Solid overlay for better readability -->
          <div class="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
      </div>
    `;
  }

  // Highlight correct and wrong answers with beautiful animations
  const optionsContainer = document.getElementById("question-options");
  if (optionsContainer) {
    const options = optionsContainer.querySelectorAll(".answer-option");
    options.forEach((option, index) => {
      const answerNum = parseInt(option.dataset.answer);

      // Disable all options
      option.style.pointerEvents = 'none';
      option.style.cursor = 'not-allowed';

      if (answerNum === correctAnswer) {
        // Highlight correct answer with beautiful green design
        option.className = "answer-option w-full p-5 rounded-2xl text-left border-4 border-green-500 bg-green-50 text-green-900 font-bold shadow-lg transform transition-all duration-300 animate-pulse-once";
        option.innerHTML = option.innerHTML.replace(/^[A-D]\.\s/, match => `<span class="inline-flex items-center gap-2"><span class="text-xl font-bold text-green-600">&#10003;</span>${match}</span> `);
      } else if (answerNum === selectedAnswer && !isCorrect) {
        // Highlight wrong selected answer with red design
        option.className = "answer-option w-full p-5 rounded-2xl text-left border-4 border-red-500 bg-red-50 text-red-900 font-semibold shadow-md";
        option.innerHTML = option.innerHTML.replace(/^[A-D]\.\s/, match => `<span class="inline-flex items-center gap-2"><span class="text-xl font-bold text-red-600">&#10007;</span>${match}</span> `);
      } else {
        // Fade out other options with subtle styling
        option.className = "answer-option w-full p-4 rounded-xl text-left border-2 border-gray-200 bg-gray-50 text-gray-400 opacity-60";
      }
    });
  }

  // Create celebration effect for correct answer
  if (isCorrect && typeof window.UIAnimations !== 'undefined') {
    window.UIAnimations.celebrateLigandCollection(feedbackEl);
  }

  // Show beautiful feedback with chemistry theme
  const feedbackDesign = isCorrect ? {
    solidColor: 'bg-green-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-400',
    textColor: 'text-green-600',
    icon: '',
    title: 'Outstanding!',
    emoji: '',
    animation: 'animate-bounceIn'
  } : {
    solidColor: 'bg-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-400',
    textColor: 'text-red-600',
    icon: '',
    title: 'Not quite!',
    emoji: '',
    animation: 'animate-shakeX'
  };

  feedbackEl.className = `p-6 rounded-2xl mb-4 border-4 ${feedbackDesign.borderColor} ${feedbackDesign.bgColor} shadow-2xl ${feedbackDesign.animation} overflow-hidden relative`;
  feedbackEl.innerHTML = `
    <div class="absolute top-0 left-0 w-full h-1 ${feedbackDesign.solidColor}"></div>
    <div class="flex items-start gap-4">
      <div class="flex-shrink-0 w-14 h-14 rounded-2xl ${feedbackDesign.solidColor} flex items-center justify-center text-3xl shadow-lg transform hover:scale-110 transition-transform">
        ${feedbackDesign.icon}
      </div>
      <div class="flex-1">
        <div class="flex items-center gap-2 mb-2">
          <h3 class="font-black text-2xl ${isCorrect ? 'text-green-900' : 'text-red-900'}">${feedbackDesign.title}</h3>
          <span class="text-xl">${feedbackDesign.emoji}</span>
        </div>
        ${isCorrect
          ? `<div class="space-y-1">
              <p class="text-lg font-bold text-green-800">You earned <span class="text-2xl ${feedbackDesign.textColor} font-black">+${points} points</span></p>
              <p class="text-sm text-green-700 flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-green-500"></span>
                ${difficulty.toUpperCase()} difficulty question completed
              </p>
            </div>`
          : `<div class="space-y-1">
              <p class="text-lg font-bold text-red-800">No points earned this time</p>
              <p class="text-sm text-red-700 flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-red-500"></span>
                The correct answer is highlighted in green above
              </p>
            </div>`
        }
      </div>
    </div>

    <!-- Progress bar animation -->
    <div class="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
      <div class="h-full ${feedbackDesign.solidColor} rounded-full animate-progress" style="width: 0%; animation: progress 4s linear forwards;"></div>
    </div>
  `;
  feedbackEl.classList.remove("hidden");

  // Auto-hide feedback after 4 seconds and close modal
  setTimeout(() => {
    feedbackEl.classList.add("hidden");
    document.getElementById("question-modal")?.classList.add("hidden");
    document.getElementById("question-modal")?.classList.remove("flex");

    // Dispatch event to notify orchestrator that modal is closed
    document.dispatchEvent(new CustomEvent("question-continue"));
  }, 4000);
}

// Add CSS animations for feedback
const style = document.createElement('style');
style.textContent = `
  @keyframes bounceIn {
    0% { opacity: 0; transform: scale(0.3); }
    50% { opacity: 1; transform: scale(1.05); }
    70% { transform: scale(0.9); }
    100% { transform: scale(1); }
  }

  @keyframes shakeX {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
    20%, 40%, 60%, 80% { transform: translateX(10px); }
  }

  @keyframes slideInLeft {
    from { opacity: 0; transform: translateX(-20px); }
    to { opacity: 1; transform: translateX(0); }
  }

  @keyframes progress {
    from { width: 0%; }
    to { width: 100%; }
  }

  @keyframes pulse-once {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.02); }
  }

  .animate-bounceIn { animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
  .animate-shakeX { animation: shakeX 0.6s; }
  .animate-slideInLeft { animation: slideInLeft 0.4s ease-out; }
  .animate-pulse-once { animation: pulse-once 0.8s ease-in-out 3; }
`;
document.head.appendChild(style);

function collectLigand(playerId, landedCell = null) {
  console.log(`\n🧪 [LIGAND] === LIGAND COLLECTION ===`);
  console.log(`   Player: ${playerId}`);
  console.log(`   Landed cell:`, landedCell);
  console.log(`   Cell type:`, typeof landedCell);

  // Get the specific ligand from the tile the player landed on
  let ligandName = null;

  if (landedCell) {
    // If landedCell is a string (class name), get the element
    if (typeof landedCell === 'string') {
      const className = landedCell.startsWith('.') ? landedCell.substring(1) : landedCell;
      console.log(`   Looking up class: ${className}`);
      const tileInfo = window.TileDetector?.getTileByClassName(className);
      if (tileInfo && tileInfo.element) {
        ligandName = window.TileDetector.getLigandName(tileInfo.element);
        console.log(`   Found ligand name from tile: "${ligandName}"`);
      } else {
        console.warn(`   ⚠️ Could not get tileInfo for class: ${className}`);
      }
    } else if (landedCell && landedCell.tagName === 'TD') {
      // It's already a cell element - try TileDetector first, fallback to direct extraction
      if (window.TileDetector) {
        ligandName = window.TileDetector.getLigandName(landedCell);
      }
      if (!ligandName) {
        // Direct extraction: get span text content from the cell
        const span = landedCell.querySelector('span');
        ligandName = span ? span.textContent.trim() : null;
      }
      console.log(`   Extracted ligand name from TD element: "${ligandName}"`);
    } else {
      console.warn(`   ⚠️ Landed cell is not a string or TD element:`, landedCell);
    }
  } else {
    console.warn(`   ⚠️ No landed cell provided!`);
  }

  console.log(`   Ligand to find: "${ligandName}"`);

  // Find the specific ligand that matches the tile text
  let ligand = null;
  if (ligandName) {
    // Normalize ligand name for matching (handle subscripts/superscripts)
    const trimmedName = ligandName.trim();
    ligand = LIGANDS_DATA.find(l => {
      // Match by name (exact match with Unicode subscripts/superscripts)
      if (l.name === trimmedName) return true;
      // Also try case-insensitive match for simple names
      if (l.name.toLowerCase() === trimmedName.toLowerCase()) return true;
      // Also try trimmed comparison
      if (l.name.trim() === trimmedName) return true;
      return false;
    });

    if (ligand) {
      console.log(`   ✅ Found matching ligand: ${ligand.name} (${ligand.id})`);

      if (gameState.collectedLigandIds.includes(ligand.id)) {
        console.log(`   Ligand "${ligandName}" already collected — skipping, treat as normal tile`);
        return;
      }
    } else {
      console.warn(`   ⚠️ No matching ligand found for "${ligandName}"`);
      console.log(`   Available ligands:`, LIGANDS_DATA.map(l => l.name));
    }
  }

  // Fallback to random if ligand not found or not specified
  if (!ligand) {
    console.warn(`   ⚠️ Could not find ligand "${ligandName}", selecting random uncollected ligand`);
    const uncollected = LIGANDS_DATA.filter(l => !gameState.collectedLigandIds.includes(l.id));
    if (uncollected.length === 0) {
      console.error(`   All ligands collected!`);
      showLigandModal(
        { name: "—", color: "#9CA3AF", imageFile: "" },
        "No More Ligands",
        "All ligands have been collected. Keep moving!"
      );
      return;
    }
    ligand = uncollected[Math.floor(Math.random() * uncollected.length)];
    console.log(`   Random ligand selected: ${ligand.name}`);
  }

  console.log(`✅ [LIGAND] Collecting ligand: ${ligand.name} (${ligand.id})`);

  gameState.playerLigands[playerId].push(ligand);
  gameState.collectedLigandIds.push(ligand.id);

  updateLigandDisplay(playerId);
  showLigandModal(ligand, "Ligand Collected!", "Click card to see details");

  saveState();
  console.log(`==========================================\n`);
}

function viewLigandDetail(ligand) {
  showLigandModal(ligand, "Ligand Details", "Review your collected ligand");
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

    // Play ligand pickup SFX only on fresh collect (not when reviewing details)
    if (window.AudioManager && /collected/i.test(title)) {
      window.AudioManager.play('ligand');
    }
  }
}

function showQuestion(playerId, tileColor = null) {
  // Map tile background color to question difficulty
  // Red zone (#ef4444) = hard, Yellow zone (#eab308) = medium,
  // Green zone (#10b981) = easy, Blue zone (#3b82f6) = medium
  let targetDifficulty = null;
  if (tileColor) {
    const colorLower = tileColor.toLowerCase();
    if (colorLower === '#ef4444') targetDifficulty = 'hard';
    else if (colorLower === '#eab308') targetDifficulty = 'medium';
    else if (colorLower === '#10b981') targetDifficulty = 'easy';
    else if (colorLower === '#3b82f6') targetDifficulty = 'medium';
  }

  // Filter questions by zone difficulty, fallback to all if no match
  let pool = QUESTION_CARDS;
  if (targetDifficulty) {
    const filtered = QUESTION_CARDS.filter(q => q.difficulty === targetDifficulty);
    if (filtered.length > 0) pool = filtered;
    console.log(`🎯 [QUESTION] Zone color: ${tileColor} → difficulty: ${targetDifficulty} (${pool.length} questions)`);
  }

  const question = pool[Math.floor(Math.random() * pool.length)];
  const modal = document.getElementById("question-modal");
  const cardContainer = document.getElementById("question-card-container");
  const optionsContainer = document.getElementById("question-options");
  const modalHeader = modal?.querySelector('.bg-gradient-to-r');

  if (!modal || !cardContainer || !optionsContainer) return;

  modal.dataset.playerId = playerId;
  modal.dataset.points = question.points;
  modal.dataset.difficulty = question.difficulty;
  modal.dataset.correctAnswer = question.correctAnswer;
  modal.dataset.imageFile = question.imageFile;

  // Update modal header color to match tile background (if provided)
  if (modalHeader && tileColor) {
    modalHeader.style.background = tileColor;
    console.log(`🎨 [QUESTION] Modal header color: ${tileColor}`);
  } else if (modalHeader) {
    // Reset to default gradient
    modalHeader.style.background = '';
  }

  const difficultyConfig = {
    easy: {
      color: "#10B981",
      bgSolid: "bg-green-500",
      label: "EASY",
      icon: "",
      borderGlow: "shadow-green-500/50"
    },
    medium: {
      color: "#F59E0B",
      bgSolid: "bg-amber-500",
      label: "MEDIUM",
      icon: "",
      borderGlow: "shadow-amber-500/50"
    },
    hard: {
      color: "#EF4444",
      bgSolid: "bg-red-500",
      label: "HARD",
      icon: "",
      borderGlow: "shadow-red-500/50"
    }
  };

  const config = difficultyConfig[question.difficulty] || difficultyConfig.easy;

  // Render beautiful question card with proper image display
  cardContainer.innerHTML = `
    <div class="question-card-wrapper animate-slideIn">
      <div class="question-card w-full rounded-2xl border-4 overflow-hidden shadow-2xl ${config.borderGlow} transform transition-all duration-300 hover:scale-[1.02] group" style="border-color: ${config.color};">
        <!-- Chemistry fact card from left side of image -->
        <div class="relative w-full aspect-[7/5] bg-gray-50 overflow-hidden">
          <!-- Background image with proper sizing -->
          <div class="absolute inset-0 bg-no-repeat" style="background-image: url('/assets/question-cards/${question.imageFile}'); background-position: 100% center; background-size: 200%;">
            <!-- Overlay for better text readability -->
            <div class="absolute inset-0 bg-black/5"></div>
          </div>

          <!-- Difficulty badge with modern glassmorphism -->
          <div class="absolute top-3 left-3 px-4 py-2 rounded-xl text-xs font-bold text-white backdrop-blur-lg ${config.bgSolid} shadow-xl flex items-center gap-2 animate-slideInLeft z-10">
            <span class="text-base">${config.icon}</span>
            <span>${config.label}</span>
            <span class="w-px h-4 bg-white/30"></span>
            <span>${question.points} PTS</span>
          </div>

          <!-- Tap hint -->
          <div class="absolute bottom-3 right-3 px-3 py-2 rounded-lg bg-black/70 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
            <span class="font-bold text-sm">?</span>
            <span>Did you know?</span>
          </div>
        </div>
      </div>
    </div>
  `;

  // Modern answer options with beautiful hover effects
  optionsContainer.innerHTML = `
    <button class="answer-option group w-full p-5 bg-gray-50 hover:bg-purple-50 rounded-2xl text-left transition-all duration-300 border-3 border-gray-200 hover:border-purple-400 hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]" data-answer="1">
      <div class="flex items-center gap-3">
        <div class="flex-shrink-0 w-8 h-8 rounded-lg bg-white shadow-sm group-hover:bg-purple-500 group-hover:text-white flex items-center justify-center font-bold text-gray-700 group-hover:scale-110 transition-all">A</div>
        <span class="font-medium text-gray-800 group-hover:text-purple-900 transition-colors">${question.answers[0]}</span>
      </div>
    </button>
    <button class="answer-option group w-full p-5 bg-gray-50 hover:bg-purple-50 rounded-2xl text-left transition-all duration-300 border-3 border-gray-200 hover:border-purple-400 hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]" data-answer="2">
      <div class="flex items-center gap-3">
        <div class="flex-shrink-0 w-8 h-8 rounded-lg bg-white shadow-sm group-hover:bg-purple-500 group-hover:text-white flex items-center justify-center font-bold text-gray-700 group-hover:scale-110 transition-all">B</div>
        <span class="font-medium text-gray-800 group-hover:text-purple-900 transition-colors">${question.answers[1]}</span>
      </div>
    </button>
    <button class="answer-option group w-full p-5 bg-gray-50 hover:bg-purple-50 rounded-2xl text-left transition-all duration-300 border-3 border-gray-200 hover:border-purple-400 hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]" data-answer="3">
      <div class="flex items-center gap-3">
        <div class="flex-shrink-0 w-8 h-8 rounded-lg bg-white shadow-sm group-hover:bg-purple-500 group-hover:text-white flex items-center justify-center font-bold text-gray-700 group-hover:scale-110 transition-all">C</div>
        <span class="font-medium text-gray-800 group-hover:text-purple-900 transition-colors">${question.answers[2]}</span>
      </div>
    </button>
    <button class="answer-option group w-full p-5 bg-gray-50 hover:bg-purple-50 rounded-2xl text-left transition-all duration-300 border-3 border-gray-200 hover:border-purple-400 hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]" data-answer="4">
      <div class="flex items-center gap-3">
        <div class="flex-shrink-0 w-8 h-8 rounded-lg bg-white shadow-sm group-hover:bg-purple-500 group-hover:text-white flex items-center justify-center font-bold text-gray-700 group-hover:scale-110 transition-all">D</div>
        <span class="font-medium text-gray-800 group-hover:text-purple-900 transition-colors">${question.answers[3]}</span>
      </div>
    </button>
  `;

  const options = optionsContainer.querySelectorAll(".answer-option");
  options.forEach(option => {
    option.addEventListener("click", () => {
      options.forEach(o => o.classList.remove("border-purple-500", "bg-purple-100"));
      option.classList.add("border-purple-500", "bg-purple-100");
      const selectedAnswer = parseInt(option.dataset.answer);
      modal.dataset.selectedAnswer = selectedAnswer; // Store selected answer
      window.setSelectedAnswer(selectedAnswer);
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
    // Only show a ± points badge when the card actually changes score.
    // For spaces-moved / ligand-count effects, the value isn't points
    // and the badge would be confusing.
    const POINTS_EFFECTS = ["point-booster", "minus"];
    const valueHTML = (fate.value !== undefined && POINTS_EFFECTS.includes(fate.effect))
      ? `<div class="mt-3 px-3 py-1 bg-red-100 rounded-full text-red-700 font-bold text-sm">
           ${fate.value > 0 ? '+' : ''}${fate.value} pts
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
          width: clamp(60px, 10vw, 80px);
          height: clamp(52px, 8.5vw, 70px);
        }
        .triangle {
          position: relative;
          width: 0;
          height: 0;
          border-left: clamp(30px, 5vw, 40px) solid transparent;
          border-right: clamp(30px, 5vw, 40px) solid transparent;
          border-bottom: clamp(52px, 8.5vw, 70px) solid #dc2626;
        }
        .triangle-text {
          position: absolute;
          top: clamp(24px, 4vw, 32px);
          left: 50%;
          transform: translateX(-50%);
          color: white;
          font-size: clamp(28px, 4.5vw, 36px);
          font-weight: 900;
          line-height: 1;
        }
      </style>
    `;

    modal.classList.remove("hidden");
    modal.classList.add("flex");

    // Play fate card SFX when the card appears
    if (window.AudioManager) window.AudioManager.play('fate-card');
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

/**
 * Save all piece positions from window variables to gameState
 */
function savePiecePositions() {
  const positions = {};

  // Save positions for all 4 players, 4 pieces each
  for (let player = 1; player <= 4; player++) {
    for (let horse = 1; horse <= 4; horse++) {
      const key = `Player${player}H${horse}`;
      const lastPosKey = `lastPos${key.toUpperCase()}`;

      if (typeof window[lastPosKey] !== 'undefined') {
        positions[key] = window[lastPosKey];
      }
    }
  }

  gameState.piecePositions = positions;
  saveState();
  console.log("💾 Piece positions saved:", positions);
}

/**
 * Restore all piece positions from gameState to window variables AND visually move pieces
 */
function restorePiecePositions() {
  if (!gameState.piecePositions) {
    console.log("No saved piece positions found");
    return;
  }

  console.log("📦 Restoring piece positions:", gameState.piecePositions);

  // Map player numbers to their color prefixes
  const playerColors = {
    1: 'r', // red
    2: 'b', // blue
    3: 'y', // yellow
    4: 'g'  // green
  };

  Object.keys(gameState.piecePositions).forEach(key => {
    const lastPosKey = `lastPos${key.toUpperCase()}`;
    const position = gameState.piecePositions[key];

    // Set window variable
    window[lastPosKey] = position;
    console.log(`  Restoring ${key} to position ${position}`);

    // Extract player number and horse number from key (e.g., "Player1H1" -> player=1, horse=1)
    const match = key.match(/Player(\d)H(\d)/);
    if (!match) return;

    const playerNum = parseInt(match[1]);
    const horseNum = parseInt(match[2]);
    const colorPrefix = playerColors[playerNum];
    const pieceClass = `player${playerNum}h${horseNum}`;

    // Find the piece element
    const piece = document.querySelector(`img.${pieceClass}`);
    if (!piece) {
      console.warn(`  ⚠️ Piece element not found: ${pieceClass}`);
      return;
    }

    // Determine target cell based on position
    let targetCell;
    if (position === undefined || position === 0 || position < 1) {
      // Piece is in home/starting area
      targetCell = document.querySelector(`#Player-${playerNum}-h${horseNum}`);
    } else if (position === 57) {
      // Piece has finished (reached home)
      targetCell = document.querySelector(`#${colorPrefix}h6`);
    } else if (position >= 53 && position <= 56) {
      // Piece is in final path (home stretch)
      const homePos = position - 52; // 53->1, 54->2, 55->3, 56->4
      targetCell = document.querySelector(`#${colorPrefix}h${homePos}`);
    } else if (position >= 1 && position <= 52) {
      // Piece is on main path
      targetCell = document.querySelector(`#${colorPrefix}${position}`);
    }

    // Move piece to target cell
    if (targetCell && piece.parentElement !== targetCell) {
      console.log(`  🎯 Moving ${pieceClass} to cell ${targetCell.id}`);

      // Remove piece from current location
      piece.remove();

      // Check if target cell already has pieces (for merging)
      const existingPieces = targetCell.querySelectorAll('img');
      if (existingPieces.length > 0) {
        // There are already pieces here - create/use merge span
        let mergeSpan = targetCell.querySelector('span');
        if (!mergeSpan) {
          mergeSpan = document.createElement('span');
          // Move existing pieces into span
          existingPieces.forEach(p => mergeSpan.appendChild(p));
          targetCell.appendChild(mergeSpan);
        }
        // Add new piece to merge span
        mergeSpan.appendChild(piece);
      } else {
        // No other pieces - just append directly
        targetCell.appendChild(piece);
      }
    } else if (!targetCell) {
      console.warn(`  ⚠️ Target cell not found for position ${position}`);
    }
  });

  console.log("✅ Visual restoration complete!");
}

// Expose to window for movement scripts to use
window.savePiecePositions = savePiecePositions;
window.restorePiecePositions = restorePiecePositions;

// CSS for flip cards
const flipCardStyle = document.createElement("style");
flipCardStyle.textContent = `
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
document.head.appendChild(flipCardStyle);

if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initGameMechanics);
  } else {
    initGameMechanics();
  }
}
