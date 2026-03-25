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
const FATE_CARDS_DATA = [];
for (let i = 1; i <= 10; i++) {
  FATE_CARDS_DATA.push({
    id: `fate${i}`,
    imageFile: `fate-${i}.png`,
    title: `Fate Card ${i}`,
    effect: i % 3 === 0 ? "bonus" : i % 2 === 0 ? "penalty" : "neutral"
  });
}

// Game state
const gameState = {
  playerLigands: { 1: [], 2: [], 3: [], 4: [] },
  playerPoints: { 1: 0, 2: [], 3: 0, 4: 0 },
  collectedLigandIds: []
};

function initGameMechanics() {
  console.log("Game mechanics with cards initialized!");

  const saved = sessionStorage.getItem("game-state");
  if (saved) {
    Object.assign(gameState, JSON.parse(saved));
    updateAllLigandDisplays();
  }

  window.GameMechanics = {
    collectLigand,
    showQuestion,
    showFate,
    testTile: (playerId, tileType) => {
      if (tileType === "ligand") collectLigand(playerId);
      else if (tileType === "question") showQuestion(playerId);
      else if (tileType === "fate") showFate(playerId);
    }
  };

  console.log("Test: window.GameMechanics.testTile(1, 'ligand')");
}

function collectLigand(playerId) {
  const uncollected = LIGANDS_DATA.filter(l => !gameState.collectedLigandIds.includes(l.id));
  if (uncollected.length === 0) return;

  const ligand = uncollected[Math.floor(Math.random() * uncollected.length)];
  gameState.playerLigands[playerId].push(ligand);
  gameState.collectedLigandIds.push(ligand.id);

  updateLigandDisplay(playerId);

  const modal = document.getElementById("ligand-modal");
  const container = document.getElementById("ligand-card-container");

  if (modal && container) {
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

  saveState();
}

function showQuestion(playerId) {
  const question = QUESTION_CARDS[Math.floor(Math.random() * QUESTION_CARDS.length)];
  const modal = document.getElementById("question-modal");
  const cardContainer = document.getElementById("question-card-container");
  const optionsContainer = document.getElementById("question-options");

  if (!modal || !cardContainer || !optionsContainer) return;

  modal.dataset.playerId = playerId;
  modal.dataset.points = question.points;

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
    // Render fate card (using actual fate card image if available)
    container.innerHTML = `
      <div class="w-full aspect-[3/4] rounded-lg border-4 border-red-500 overflow-hidden shadow-lg">
        <img src="/assets/fate-cards/${fate.imageFile}" alt="${fate.title}" class="w-full h-full object-cover" onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 200 300%27%3E%3Crect fill=%27%23fef2f2%27 width=%27200%27 height=%27300%27/%3E%3Ctext x=%2750%25%27 y=%2750%25%27 font-size=%2760%27 text-anchor=%27middle%27%3E🔺%3C/text%3E%3C/svg%3E';" />
      </div>
    `;

    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }
}

function updateLigandDisplay(playerId) {
  const container = document.getElementById(`ligand-display-${playerId}`);
  if (!container) return;

  container.innerHTML = gameState.playerLigands[playerId]
    .map(l => `
      <div class="aspect-[3/4] rounded border-2 overflow-hidden shadow-sm" style="border-color: ${l.color};" title="${l.name}">
        <div class="w-full h-full bg-cover bg-center" style="background-image: url('/assets/ligand-cards/${l.imageFile}'); background-position: 0% center; background-size: 200%;"></div>
      </div>
    `)
    .join("");
}

function updateAllLigandDisplays() {
  [1, 2, 3, 4].forEach(id => updateLigandDisplay(id));
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
