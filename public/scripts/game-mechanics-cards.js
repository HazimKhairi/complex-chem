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
  { id: "cl", name: "Cl", color: "#14B8A6", imageFile: "7.png" },        // 7.png = Cl (chloride)
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
    question: "Coordination number of the central metal ion in the complex [Cr(C₂O₄)₃]³⁻?",
    hintTitle: "EDTA",
    hint: "In your morning routine, EDTA might be in your shampoo! It helps prevent minerals in water from binding to hair, keeping it soft and manageable. EDTA is a ligand — its structure contains multiple donor sites capable of forming coordination bonds with metal ions, making it an effective chelating agent.",
    answers: ["4", "5", "6", "7"]
  },
  {
    id: "q2",
    imageFile: "7.png",
    difficulty: "hard",
    points: 5,
    correctAnswer: 3, // C
    question: "What is the oxidation state of the metal in [Co(NH₃)₅Cl]Cl₂?",
    hintTitle: "Hemoglobin in our blood contains a special complex ion",
    hint: "The Fe complex in haemoglobin helps it carry oxygen from our lungs to the rest of our body, making sure our cells get the oxygen they need to function.",
    answers: ["+1", "+2", "+3", "+4"]
  },
  {
    id: "q3",
    imageFile: "8.png",
    difficulty: "hard",
    points: 5,
    correctAnswer: 2, // B
    question: "What is the oxidation state of copper in the complex [Cu(NH₃)₄]²⁺?",
    hintTitle: "Vitamin B12 contains a complex ion",
    hint: "Cobalamin (B12) has a complex structure with a cobalt ion at its core. This complex ion is crucial for red blood cell production and maintaining a healthy nervous system.",
    answers: ["+1", "+2", "+3", "+4"]
  },
  {
    id: "q4",
    imageFile: "9.png",
    difficulty: "hard",
    points: 5,
    correctAnswer: 3, // C
    question: "Calculate the oxidation number of cobalt (Co) in the following complex [Co(dppe)₂Cl₂]⁺",
    hintTitle: "Green pigment in plants contains a complex ion",
    hint: "Chlorophyll has magnesium at its centre and helps plants absorb sunlight to make food through photosynthesis. This complex ion plays a crucial role in capturing light energy.",
    answers: ["+1", "+2", "+3", "+4"]
  },
  {
    id: "q5",
    imageFile: "10.png",
    difficulty: "hard",
    points: 5,
    correctAnswer: 3, // C
    question: "Which of the following is the correct name for this complex? [Cr(NH₃)₄(H₂O)₂]³⁺",
    hintTitle: "Fireworks have complex ions",
    hint: "Fireworks contain special ingredients like dextrin and metal salts. When mixed, they create complex compounds — strontium salts produce red, copper salts produce blue or green.",
    answers: [
      "Tetraammoniadiwaterchromium (III) ion",
      "Tetraammoniadiaquachromate (III) ion",
      "Tetraamminediaquachromium (III) ion",
      "Tetraamminediaquachromate (III) ion"
    ]
  },
  {
    id: "q6",
    imageFile: "11.png",
    difficulty: "hard",
    points: 5,
    correctAnswer: 2, // B
    question: "What is the coordination number in the complex [Ni(CN)₄]²⁻?",
    hintTitle: "The antimalarial drug Ferroquine contains complex ions",
    hint: "Ferroquine's iron-based complex ions are crucial for its effectiveness in treating malaria — they help target and destroy the malaria parasites in the body.",
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
    question: "Chelation occurs when a ligand ___.",
    hintTitle: "Copper phthalocyanine is a complex ion used as a colour pigment",
    hint: "Its intricate molecular structure is the foundation for various shades of blue and green in pigments. Its versatility and stability make it truly fascinating.",
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
    question: "In the complex potassium diamminetetrabromocobaltate (III), which one of the following is the counter ion?",
    hintTitle: "Cisplatin is a complex ion used in chemotherapy",
    hint: "Cisplatin works by binding to the DNA of cancer cells, which prevents the cells from dividing and proliferating — interfering with the replication process and ultimately leading to their death.",
    answers: ["K⁺", "Co³⁺", "NH₃", "Br⁻"]
  },
  {
    id: "q9",
    imageFile: "14.png",
    difficulty: "medium",
    points: 3,
    correctAnswer: 1, // A
    question: "In the complex [Ni(CN)₄]²⁻, what is the coordination number of the nickel ion?",
    hintTitle: "Auranofin is used to treat rheumatoid arthritis",
    hint: "Auranofin belongs to a class of drugs known as DMARDs (disease-modifying antirheumatic drugs). It works by reducing inflammation and slowing joint damage.",
    answers: ["4", "5", "6", "7"]
  },
  {
    id: "q10",
    imageFile: "15.png",
    difficulty: "medium",
    points: 3,
    correctAnswer: 2, // B
    question: "Which of the following complexes is expected to have the highest coordination number?",
    hintTitle: "[Fe(H₂O)₆]³⁺ is commonly used in colorimetry",
    hint: "It has a distinct yellow-orange colour in water. By measuring how much light it absorbs, we can figure out how much of it (or other substances) is in a solution.",
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
    question: "Which of the following ligands is known for its ability to form stable octahedral complexes with transition metal ions?",
    hintTitle: "DTPA is used as a chelating agent in food preservation",
    hint: "DTPA binds to metal ions present in food (iron, copper etc.). Those metal ions can catalyse oxidative reactions that lead to food spoilage, off-flavours and discolouration.",
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
    question: "What is a key feature of diethylenetriamine (dien) in coordination chemistry?",
    hintTitle: "Potassium ferrocyanide is used to produce blue paint",
    hint: "When combined with iron(III) salts, it forms a blue-coloured compound known as Prussian blue — a pigment widely used in paint and ink.",
    answers: [
      "They can only form monodentate complexes with metal ions.",
      "They possess four donor atoms capable of coordinating to a metal ion.",
      "They are known for their ability to form stable chelate complexes with metal ions.",
      "They exhibit π-donor properties, facilitating the stabilization of metal complexes."
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
    question: "A complex with a coordination number of 6 often adopts what geometry?",
    hintTitle: "Gadolinium-based contrast agents are used in MRI scans",
    hint: "These agents improve MRI images because gadolinium ions are strongly paramagnetic — their unpaired electrons interact with the scanner's magnetic field to give clearer images.",
    answers: ["Square Planar", "Tetrahedral", "Octahedral", "Linear"]
  },
  {
    id: "q14",
    imageFile: "19.png",
    difficulty: "easy",
    points: 2,
    correctAnswer: 3, // C
    question: "Which of the following is the formula for oxalate ion?",
    hintTitle: "Desferrioxamine acts as a chemosensor for iron",
    hint: "Desferrioxamine forms strong bonds with extra iron in the body, helping it pass out through urine and stool. It can selectively bind to iron ions, acting as a sensor for their presence in biological or environmental samples.",
    answers: ["CH₃COO⁻", "CO₃²⁻", "C₂O₄²⁻", "S₂O₃²⁻"]
  },
  {
    id: "q15",
    imageFile: "20.png",
    difficulty: "easy",
    points: 2,
    correctAnswer: 3, // C
    question: "Which of the following is an example of a bidentate ligand?",
    hintTitle: "Cyclen is a chemical sensor for metal ions in industrial processes",
    hint: "Cyclen's unique ring structure binds selectively to metal ions. By forming stable complexes, sensors built with cyclen can track metal levels in real time — keeping industrial processes safe and under control.",
    answers: ["NH₃", "H₂O", "C₂O₄²⁻", "Cl⁻"]
  },
  {
    id: "q16",
    imageFile: "21.png",
    difficulty: "easy",
    points: 2,
    correctAnswer: 4, // D
    question: "A complex in which there are two similar metal centres is called ___.",
    hintTitle: "Rhodamine B is used as a fluorescent pH indicator",
    hint: "Rhodamine B changes fluorescence depending on the pH of the solution, allowing scientists to monitor pH changes visually.",
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
    question: "What is the coordination number of a metal in a square planar complex?",
    hintTitle: "Copper-64 is used in PET imaging for medical diagnostics",
    hint: "Copper-64 is a radioactive isotope prized for its favourable decay characteristics and compatibility with biological molecules. Its complexes can be attached to targeting agents for visualising biological processes like tumours.",
    answers: ["2", "4", "6", "8"]
  },
  {
    id: "q18",
    imageFile: "23.png",
    difficulty: "easy",
    points: 2,
    correctAnswer: 2, // B
    question: "What does it mean by 'monodentate'?<br><br>I. Have one point of attachment.<br>II. Occupy only one coordination site.<br>III. Can bond through a metal center.",
    hintTitle: "Zinc Protoporphyrin is used in diagnosing blood disorders",
    hint: "Zinc Protoporphyrin (ZnPP) levels in red blood cells can indicate iron deficiency anaemia or lead poisoning.",
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

  // Skip = close the modal with no scoring change.
  document.addEventListener("question-skipped", () => {
    const modal = document.getElementById("question-modal");
    if (!modal) return;
    console.log("⏭️  Question skipped — no points awarded or deducted");
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  });

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
 * Award (or, with negative `points`, deduct) points for a player.
 * Fate cards like "Minus Card" pass a negative value through this same
 * function — clamp the running total to 0 so the score never goes
 * negative.
 */
function awardQuestionPoints(playerId, points, difficulty) {
  const before = gameState.playerPoints[playerId] || 0;
  gameState.playerPoints[playerId] = Math.max(0, before + points);
  updatePointsDisplay(playerId);
  saveState();

  const delta = gameState.playerPoints[playerId] - before;
  console.log(`💰 Player ${playerId} ${delta >= 0 ? '+' : ''}${delta} pts → total: ${gameState.playerPoints[playerId]}`);
}

/**
 * Flash a small toast above the Skip button to nudge the player when
 * they tried to use the Hint but had 0 points to spend. Auto-removes
 * after a few seconds so it doesn't linger over the next question.
 */
function flashSkipNotice(message) {
  const skipBtn = document.getElementById("skip-question-btn");
  if (!skipBtn) return;
  // Reuse a single notice element so spamming the button doesn't stack toasts.
  let el = document.getElementById("skip-notice-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "skip-notice-toast";
    el.className = "fixed left-1/2 -translate-x-1/2 bottom-6 z-[80] px-4 py-3 rounded-xl bg-amber-500 text-white text-sm font-semibold shadow-lg max-w-sm text-center animate-bounceIn";
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.style.opacity = "1";
  clearTimeout(window.__skipNoticeTimer);
  window.__skipNoticeTimer = setTimeout(() => {
    if (el) el.style.opacity = "0";
  }, 3500);

  // Subtle pulse on the Skip button so the player notices it.
  skipBtn.classList.add("ring-4", "ring-amber-300");
  setTimeout(() => skipBtn.classList.remove("ring-4", "ring-amber-300"), 1800);
}

/**
 * Deduct points from a player (used when they request a hint).
 * Clamps to 0 — players can't go negative.
 */
function deductPoints(playerId, amount) {
  const before = gameState.playerPoints[playerId] || 0;
  gameState.playerPoints[playerId] = Math.max(0, before - amount);
  updatePointsDisplay(playerId);
  saveState();
  console.log(`💸 Player ${playerId} lost ${amount} pt(s) (hint). New total: ${gameState.playerPoints[playerId]}`);
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
    const questionText = modal.dataset.questionText || "";
    const resultBg = isCorrect ? "bg-green-500" : "bg-red-500";
    const resultLabel = isCorrect ? "CORRECT" : "WRONG";

    cardContainer.innerHTML = `
      <div class="question-card w-full rounded-2xl shadow-2xl border-4 bg-white transform transition-all duration-300 ${isCorrect ? 'animate-bounceIn' : 'animate-shakeX'}" style="border-color: ${config.color};">
        <div class="flex items-center justify-between gap-2 px-4 pt-4">
          <div class="px-3 py-1.5 rounded-lg text-xs font-bold text-white ${config.bgSolid} flex items-center gap-2">
            <span>${config.label}</span>
            <span class="w-px h-4 bg-white/30"></span>
            <span>${points} PTS</span>
          </div>
          <div class="px-3 py-1.5 rounded-lg text-xs font-black text-white ${resultBg} shadow-md tracking-wide">
            ${resultLabel}
          </div>
        </div>
        <div class="p-4 sm:p-6">
          <p class="text-base sm:text-lg font-semibold text-gray-900 leading-snug">
            ${questionText}
          </p>
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
        const checkSvg = '<svg class="inline-block w-5 h-5 text-green-600 mr-2 align-middle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
        option.innerHTML = option.innerHTML.replace(/^[A-D]\.\s/, match => checkSvg + match);
      } else if (answerNum === selectedAnswer && !isCorrect) {
        // Highlight wrong selected answer with red design
        option.className = "answer-option w-full p-5 rounded-2xl text-left border-4 border-red-500 bg-red-50 text-red-900 font-semibold shadow-md";
        const xSvg = '<svg class="inline-block w-5 h-5 text-red-600 mr-2 align-middle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
        option.innerHTML = option.innerHTML.replace(/^[A-D]\.\s/, match => xSvg + match);
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
    title: 'You are correct',
    emoji: '',
    animation: 'animate-bounceIn'
  } : {
    solidColor: 'bg-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-400',
    textColor: 'text-red-600',
    icon: '',
    title: 'You are wrong',
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

/**
 * Show a "Did you know?" quick-notes popup for the current question.
 * Reuses a single overlay element, re-creating on each call if the
 * player dismissed the previous one.
 */
function openQuestionHintPopup(title, body) {
  if (!body) return;

  let overlay = document.getElementById("question-hint-overlay");
  if (overlay) overlay.remove();

  overlay = document.createElement("div");
  overlay.id = "question-hint-overlay";
  overlay.className = "fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4";
  overlay.innerHTML = `
    <div class="bg-amber-50 border-4 border-amber-400 rounded-2xl shadow-2xl max-w-md w-full p-5 relative">
      <button
        id="question-hint-close"
        aria-label="Close hint"
        class="absolute top-2 right-3 text-amber-800 hover:text-amber-900 text-2xl leading-none font-black"
      >&times;</button>
      <div class="flex items-center gap-2 mb-2">
        <svg class="w-5 h-5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5a6 6 0 0 0-12 0c0 1.3.5 2.6 1.5 3.5.8.8 1.3 1.5 1.5 2.5"/>
          <path d="M9 18h6"/>
          <path d="M10 22h4"/>
        </svg>
        <h3 class="font-black text-amber-900 uppercase tracking-wide text-sm">Did you know?</h3>
      </div>
      ${title ? `<p class="font-bold text-amber-900 mb-2">${title}</p>` : ''}
      <p class="text-sm text-gray-800 leading-relaxed">${body}</p>
      <div class="mt-4 text-right">
        <button
          id="question-hint-ok"
          class="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm"
        >Got it</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  function close() { overlay.remove(); }
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
  overlay.querySelector("#question-hint-close").addEventListener("click", close);
  overlay.querySelector("#question-hint-ok").addEventListener("click", close);
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
  modal.dataset.questionText = question.question || "";

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

  // Store hint data on modal for the Hint popup (opened on demand)
  modal.dataset.hintTitle = question.hintTitle || "";
  modal.dataset.hint = question.hint || "";

  // Render a text-based question card (typed text, not the whole
  // sprite image). The fact/hint is available via the Hint button.
  const hasHint = !!(question.hint && question.hint.length);
  const questionText = question.question || "See image reference.";

  cardContainer.innerHTML = `
    <div class="question-card-wrapper animate-slideIn">
      <div class="question-card w-full rounded-2xl border-4 shadow-xl ${config.borderGlow} bg-white" style="border-color: ${config.color};">
        <div class="flex items-center justify-between gap-2 px-4 pt-4">
          <div class="px-3 py-1.5 rounded-lg text-xs font-bold text-white ${config.bgSolid} flex items-center gap-2">
            <span>${config.label}</span>
            <span class="w-px h-4 bg-white/30"></span>
            <span>${question.points} PTS</span>
          </div>
          ${hasHint ? `
            <button
              id="question-hint-btn"
              type="button"
              class="px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 border-2 border-amber-300 text-amber-900 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-amber-100"
              aria-label="Show hint (costs 1 point)"
              title="Reveal a Did-You-Know hint — costs 1 point"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5a6 6 0 0 0-12 0c0 1.3.5 2.6 1.5 3.5.8.8 1.3 1.5 1.5 2.5"/>
                <path d="M9 18h6"/>
                <path d="M10 22h4"/>
              </svg>
              <span>Hint</span>
              <span class="ml-1 px-1.5 py-0.5 rounded bg-red-500 text-white text-[10px] font-black tracking-tight">−1 PT</span>
            </button>
          ` : ''}
        </div>

        <div class="p-4 sm:p-6">
          <p class="text-base sm:text-lg font-semibold text-gray-900 leading-snug">
            ${questionText}
          </p>
        </div>
      </div>
    </div>
  `;

  // Wire up the Hint button — opens a quick-notes popup with the
  // "Did you know?" fact from the original card design. First click
  // costs the asking player 1 point; subsequent clicks are free
  // (button disables itself after the first use).
  const hintBtn = document.getElementById("question-hint-btn");
  if (hintBtn) {
    hintBtn.addEventListener("click", () => {
      if (hintBtn.disabled) return;
      const modalEl = document.getElementById("question-modal");
      const askingPlayerId = parseInt(modalEl?.dataset.playerId || 0);
      const currentPts = askingPlayerId ? (gameState.playerPoints[askingPlayerId] || 0) : 0;

      // Not enough points to afford the hint? Don't deduct (min is 0) —
      // tell the player they can use Skip instead.
      if (currentPts < 1) {
        flashSkipNotice("You don't have any points to spend on a hint. Use the Skip button if you'd rather move on.");
        return;
      }

      deductPoints(askingPlayerId, 1);
      hintBtn.disabled = true;
      hintBtn.querySelector("span:last-child").textContent = "USED";
      openQuestionHintPopup(question.hintTitle, question.hint);
    });
  }

  // Render one button per available answer (handles 3 or 4 option cases).
  const LETTERS = ["A", "B", "C", "D"];
  optionsContainer.innerHTML = question.answers.map((text, i) => `
    <button
      class="answer-option group w-full p-5 bg-gray-50 hover:bg-purple-50 rounded-2xl text-left transition-all duration-300 border-3 border-gray-200 hover:border-purple-400 hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
      data-answer="${i + 1}"
    >
      <div class="flex items-center gap-3">
        <div class="flex-shrink-0 w-8 h-8 rounded-lg bg-white shadow-sm group-hover:bg-purple-500 group-hover:text-white flex items-center justify-center font-bold text-gray-700 group-hover:scale-110 transition-all">${LETTERS[i] || (i + 1)}</div>
        <span class="font-medium text-gray-800 group-hover:text-purple-900 transition-colors">${text}</span>
      </div>
    </button>
  `).join("");

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
    1: 'g', // green
    2: 'y', // yellow
    3: 'r', // red
    4: 'b'  // blue
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
