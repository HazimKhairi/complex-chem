# Level 2: Build Complex Structure — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement Level 2 step wizard where players use collected ligands to build coordination compounds and answer 4 chemistry questions (10 pts max).

**Architecture:** New `/level-2.astro` page with a 6-step wizard UI. Reads Level 1 game state from sessionStorage. Single JS file `level-2-game.js` handles all wizard logic, scoring, and validation. Winners modal on game-board gets a "Continue to Level 2" button.

**Tech Stack:** Astro 5.5.5, Tailwind CSS v4, vanilla JS, sessionStorage for state

---

## Task 1: Copy Geometry Assets

**Files:**
- Copy: `LEVEL_2_GEOMETRY_SHAPE/1.png` → `public/images/geometry/1.png`
- Copy: `LEVEL_2_GEOMETRY_SHAPE/2.png` → `public/images/geometry/2.png`
- Copy: `LEVEL_2_GEOMETRY_SHAPE/3.png` → `public/images/geometry/3.png`

**Step 1: Create directory and copy assets**

```bash
mkdir -p public/images/geometry
cp LEVEL_2_GEOMETRY_SHAPE/*.png public/images/geometry/
```

**Step 2: Verify files exist**

```bash
ls -la public/images/geometry/
```
Expected: 3 PNG files (1.png, 2.png, 3.png)

**Step 3: Commit**

```bash
git add public/images/geometry/
git commit -m "chore: add Level 2 geometry shape images"
```

---

## Task 2: Add "Continue to Level 2" Button to Winners Modal

**Files:**
- Modify: `src/components/game-board/winners-model.astro` (line 73-79, button area)

**Step 1: Add Level 2 button next to existing Menu button**

Replace the button div at the bottom of `winners-model.astro` (line 73-79):

```html
<div class="flex gap-3 justify-center">
  <button
    type="button"
    onclick="location.href='/'"
    class="bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors">Menu</button>
  <button
    type="button"
    id="continue-level-2"
    onclick="location.href='/level-2'"
    class="bg-ludon-blue text-white px-4 py-2 rounded-lg font-medium transition-colors animate-pulse">Continue to Level 2 →</button>
</div>
```

**Step 2: Build and verify**

```bash
npx astro build
```
Expected: Build succeeds, no errors.

**Step 3: Commit**

```bash
git add src/components/game-board/winners-model.astro
git commit -m "feat: add Continue to Level 2 button in winners modal"
```

---

## Task 3: Create Level 2 Page Skeleton (`level-2.astro`)

**Files:**
- Create: `src/pages/level-2.astro`

**Step 1: Create the page with step wizard layout**

Create `src/pages/level-2.astro`:

```astro
---
import Layout from "../layouts/Layout.astro";
---

<Layout>
  <main class="min-h-dvh p-4 sm:p-6 flex flex-col items-center">
    <!-- Header -->
    <div class="text-center mb-4">
      <h1 class="text-2xl sm:text-3xl font-bold text-gray-800">LEVEL 2</h1>
      <p class="text-sm text-gray-600">Build Your Complex Structure</p>
      <p id="player-info" class="text-sm font-semibold mt-1"></p>
    </div>

    <!-- Step Indicator -->
    <div class="flex items-center gap-2 mb-6" id="step-indicator">
      <div class="step-dot active" data-step="1">1</div>
      <div class="step-line"></div>
      <div class="step-dot" data-step="2">2</div>
      <div class="step-line"></div>
      <div class="step-dot" data-step="3">3</div>
      <div class="step-line"></div>
      <div class="step-dot" data-step="4">4</div>
      <div class="step-line"></div>
      <div class="step-dot" data-step="5">5</div>
      <div class="step-line"></div>
      <div class="step-dot" data-step="6">6</div>
    </div>

    <!-- Step Content Container -->
    <div id="step-container" class="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-6 min-h-[400px] relative overflow-hidden">
      <!-- Steps injected by JS -->
    </div>

    <!-- Score Bar -->
    <div class="w-full max-w-2xl mt-4 bg-white rounded-xl shadow p-3 flex justify-between items-center text-sm">
      <span class="text-gray-600">Level 1: <strong id="l1-score">0</strong> pts</span>
      <span class="text-gray-600">Level 2: <strong id="l2-score">0</strong> / 10 pts</span>
      <span class="font-bold text-lg text-ludon-blue">Total: <strong id="total-score">0</strong></span>
    </div>
  </main>
</Layout>

<style>
  .step-dot {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 14px;
    background: #e5e7eb;
    color: #6b7280;
    transition: all 0.3s;
  }
  .step-dot.active {
    background: #4187a0;
    color: white;
  }
  .step-dot.done {
    background: #10b981;
    color: white;
  }
  .step-line {
    height: 2px;
    width: 24px;
    background: #e5e7eb;
    transition: background 0.3s;
  }
  .step-line.done {
    background: #10b981;
  }
</style>

<script>
  // Redirect if no game state
  const savedState = sessionStorage.getItem("game-state");
  if (!savedState) {
    window.location.href = "/pass-and-play";
    throw new Error("No game state");
  }
</script>
<script is:inline src="/scripts/level-2-game.js"></script>
```

**Step 2: Build and verify**

```bash
npx astro build
```
Expected: Build succeeds. Page accessible at `/level-2`.

**Step 3: Commit**

```bash
git add src/pages/level-2.astro
git commit -m "feat: add Level 2 page skeleton with step wizard layout"
```

---

## Task 4: Create Level 2 Game Logic (`level-2-game.js`)

**Files:**
- Create: `public/scripts/level-2-game.js`

This is the main JS file. It contains:
1. Chemistry data (ligands, metals, geometries)
2. State management
3. Step rendering (6 steps)
4. Scoring logic
5. Navigation (next/back)

**Step 1: Create the file with all data and core logic**

Create `public/scripts/level-2-game.js`:

```javascript
// ============================================
// LEVEL 2: BUILD COMPLEX STRUCTURE
// ============================================

console.log("🧪 [LEVEL 2] Loading Level 2 Game...");

// ---- CHEMISTRY DATA ----

const LIGAND_CHEMISTRY = {
  h2o:  { name: "H₂O",    charge: 0,  denticity: 1, type: "Monodentate", sphere: "red" },
  nh3:  { name: "NH₃",    charge: 0,  denticity: 1, type: "Monodentate", sphere: "blue" },
  py:   { name: "py",     charge: 0,  denticity: 1, type: "Monodentate", sphere: "blue" },
  pph3: { name: "PPh₃",   charge: 0,  denticity: 1, type: "Monodentate", sphere: "orange" },
  cn:   { name: "CN⁻",    charge: -1, denticity: 1, type: "Monodentate", sphere: "blue" },
  o2:   { name: "O²⁻",    charge: -2, denticity: 1, type: "Monodentate", sphere: "red" },
  cl:   { name: "Cl⁻",    charge: -1, denticity: 1, type: "Monodentate", sphere: "green" },
  ox:   { name: "Ox²⁻",   charge: -2, denticity: 2, type: "Bidentate",  sphere: "red" },
  acac: { name: "acac⁻",  charge: -1, denticity: 2, type: "Bidentate",  sphere: "red" },
  co32: { name: "CO₃²⁻",  charge: -2, denticity: 2, type: "Bidentate",  sphere: "red" },
  phen: { name: "phen",   charge: 0,  denticity: 2, type: "Bidentate",  sphere: "blue" },
  bipy: { name: "bipy",   charge: 0,  denticity: 2, type: "Bidentate",  sphere: "blue" },
  en:   { name: "en",     charge: 0,  denticity: 2, type: "Bidentate",  sphere: "blue" },
};

const CENTRAL_METALS = [
  { name: "Co³⁺", id: "co3", charge: 3 },
  { name: "Cr³⁺", id: "cr3", charge: 3 },
  { name: "Fe³⁺", id: "fe3", charge: 3 },
  { name: "Cu²⁺", id: "cu2", charge: 2 },
  { name: "Ni²⁺", id: "ni2", charge: 2 },
  { name: "Zn²⁺", id: "zn2", charge: 2 },
];

const GEOMETRY_MAP = {
  3: ["Trigonal planar"],
  4: ["Tetrahedral", "Square planar"],
  5: ["Trigonal bipyramidal", "Square pyramidal"],
  6: ["Octahedral"],
};

// Image file for each geometry (from LEVEL_2_GEOMETRY_SHAPE)
// 1.png = Trigonal planar (top), Tetrahedral (mid), Square planar (bottom)
// 2.png = Trigonal bipyramidal (top), Square pyramidal (mid), Octahedral (bottom)
const GEOMETRY_IMAGES = {
  "Trigonal planar":       { file: "1.png", label: "Trigonal planar — CN:3" },
  "Tetrahedral":           { file: "1.png", label: "Tetrahedral — CN:4" },
  "Square planar":         { file: "1.png", label: "Square planar — CN:4" },
  "Trigonal bipyramidal":  { file: "2.png", label: "Trigonal bipyramidal — CN:5" },
  "Square pyramidal":      { file: "2.png", label: "Square pyramidal — CN:5" },
  "Octahedral":            { file: "2.png", label: "Octahedral — CN:6" },
};

const SPHERE_COLORS = {
  red: "#EF4444",
  blue: "#3B82F6",
  orange: "#F97316",
  green: "#10B981",
};

// ---- STATE ----

const gameState = JSON.parse(sessionStorage.getItem("game-state") || "{}");
// Find which player completed Level 1 (use first player with ligands, or player 1)
const activePlayers = Object.keys(gameState.playerLigands || {}).filter(
  (id) => (gameState.playerLigands[id] || []).length > 0
);

let currentPlayerIndex = 0;
let currentStep = 1;

const level2State = {
  playerId: null,
  playerName: "",
  selectedMetal: null,
  selectedLigands: [],
  coordinationNumber: 0,
  totalCharge: 0,
  q1Answer: null,
  q1Correct: false,
  q2Answer: null,
  q2Correct: false,
  q3Answer: null,
  q3Correct: false,
  q4Attempts: 0,
  q4PickScore: 0,
  q4DragScore: 0,
  level2Score: 0,
};

// ---- HELPERS ----

function getPlayerName(playerId) {
  const gameOption = sessionStorage.getItem("game-option") || "one-vs-three";
  const key = `${gameOption}-player-${playerId}-name`;
  return sessionStorage.getItem(key) || `Player ${playerId}`;
}

function getLigandChem(ligand) {
  return LIGAND_CHEMISTRY[ligand.id] || null;
}

function calculateCN(selectedLigands) {
  return selectedLigands.reduce((sum, l) => {
    const chem = getLigandChem(l);
    return sum + (chem ? chem.denticity : 0);
  }, 0);
}

function calculateTotalCharge(metal, selectedLigands) {
  const ligandCharge = selectedLigands.reduce((sum, l) => {
    const chem = getLigandChem(l);
    return sum + (chem ? chem.charge : 0);
  }, 0);
  return metal.charge + ligandCharge;
}

function getCorrectComplexType(totalCharge) {
  if (totalCharge === 0) return "Neutral";
  if (totalCharge < 0) return "Anionic";
  return "Cationic";
}

function getCorrectGeometries(cn) {
  return GEOMETRY_MAP[cn] || [];
}

function updateScoreBar() {
  const l1 = gameState.playerPoints?.[level2State.playerId] || 0;
  const l2 = level2State.level2Score;
  document.getElementById("l1-score").textContent = l1;
  document.getElementById("l2-score").textContent = l2;
  document.getElementById("total-score").textContent = l1 + l2;
}

function updateStepIndicator(step) {
  document.querySelectorAll(".step-dot").forEach((dot, i) => {
    dot.classList.remove("active", "done");
    if (i + 1 < step) dot.classList.add("done");
    if (i + 1 === step) dot.classList.add("active");
  });
  document.querySelectorAll(".step-line").forEach((line, i) => {
    line.classList.toggle("done", i + 1 < step);
  });
}

// ---- STEP RENDERERS ----

function renderStep(step) {
  currentStep = step;
  updateStepIndicator(step);
  const container = document.getElementById("step-container");

  switch (step) {
    case 1: renderStep1(container); break;
    case 2: renderStep2(container); break;
    case 3: renderStep3(container); break;
    case 4: renderStep4(container); break;
    case 5: renderStep5(container); break;
    case 6: renderStep6(container); break;
    default: renderResults(container);
  }
}

// ---- STEP 1: Choose Central Metal ----

function renderStep1(container) {
  container.innerHTML = `
    <h2 class="text-xl font-bold text-center mb-2">Step 1: Choose Central Metal</h2>
    <p class="text-center text-gray-500 text-sm mb-6">Select one central metal ion for your complex</p>
    <div class="grid grid-cols-3 gap-3 max-w-md mx-auto" id="metal-grid">
      ${CENTRAL_METALS.map(m => `
        <button class="metal-card p-4 rounded-xl border-2 border-gray-200 hover:border-ludon-blue hover:shadow-md transition-all text-center ${level2State.selectedMetal?.id === m.id ? 'border-ludon-blue bg-blue-50 shadow-md' : ''}"
          data-metal-id="${m.id}">
          <div class="text-2xl font-bold text-gray-800">${m.name}</div>
          <div class="text-xs text-gray-500 mt-1">Charge: +${m.charge}</div>
        </button>
      `).join("")}
    </div>
    <div class="flex justify-end mt-6">
      <button id="next-btn" class="px-6 py-2 rounded-lg font-semibold text-white transition-all ${level2State.selectedMetal ? 'bg-ludon-blue hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'}" ${!level2State.selectedMetal ? 'disabled' : ''}>
        Next →
      </button>
    </div>
  `;

  container.querySelectorAll(".metal-card").forEach(card => {
    card.addEventListener("click", () => {
      const id = card.dataset.metalId;
      level2State.selectedMetal = CENTRAL_METALS.find(m => m.id === id);
      renderStep1(container);
    });
  });

  document.getElementById("next-btn")?.addEventListener("click", () => {
    if (level2State.selectedMetal) renderStep(2);
  });
}

// ---- STEP 2: Select Ligands ----

function renderStep2(container) {
  const playerLigands = gameState.playerLigands?.[level2State.playerId] || [];
  const cn = calculateCN(level2State.selectedLigands);
  const cnValid = cn >= 3 && cn <= 6;

  container.innerHTML = `
    <h2 class="text-xl font-bold text-center mb-1">Step 2: Select Your Ligands</h2>
    <p class="text-center text-gray-500 text-sm mb-4">Choose ligands so CN = 3, 4, 5, or 6</p>

    <div class="text-center mb-4">
      <span class="inline-block px-4 py-2 rounded-full text-lg font-bold ${cn > 6 ? 'bg-red-100 text-red-700' : cnValid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}">
        CN: ${cn} ${cn > 6 ? '⚠️ Too high!' : cnValid ? '✓' : '(need 3-6)'}
      </span>
    </div>

    ${cn > 6 ? '<p class="text-center text-red-600 font-semibold text-sm mb-3">Invalid selection. The coordination number cannot exceed 6. Please try again.</p>' : ''}

    <div class="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4" id="ligand-grid">
      ${playerLigands.map((l, i) => {
        const chem = getLigandChem(l);
        const isSelected = level2State.selectedLigands.some(s => s._index === i);
        const sphereColor = chem ? SPHERE_COLORS[chem.sphere] : "#999";
        return `
          <button class="ligand-select-card p-3 rounded-xl border-2 transition-all text-center ${isSelected ? 'border-ludon-blue bg-blue-50 shadow-md' : 'border-gray-200 hover:border-gray-400'}"
            data-ligand-index="${i}">
            <div class="w-8 h-8 rounded-full mx-auto mb-1" style="background: ${sphereColor}"></div>
            <div class="text-sm font-bold">${l.name}</div>
            <div class="text-[10px] text-gray-500">${chem ? chem.type : ''}</div>
            <div class="text-[10px] text-gray-400">d: ${chem ? chem.denticity : '?'}</div>
          </button>
        `;
      }).join("")}
    </div>

    <div class="flex justify-between mt-4">
      <button id="back-btn" class="px-6 py-2 rounded-lg font-semibold text-gray-600 border border-gray-300 hover:bg-gray-100 transition-all">← Back</button>
      <button id="next-btn" class="px-6 py-2 rounded-lg font-semibold text-white transition-all ${cnValid ? 'bg-ludon-blue hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'}" ${!cnValid ? 'disabled' : ''}>
        Next →
      </button>
    </div>
  `;

  container.querySelectorAll(".ligand-select-card").forEach(card => {
    card.addEventListener("click", () => {
      const idx = parseInt(card.dataset.ligandIndex);
      const ligand = { ...playerLigands[idx], _index: idx };
      const existingIdx = level2State.selectedLigands.findIndex(s => s._index === idx);
      if (existingIdx >= 0) {
        level2State.selectedLigands.splice(existingIdx, 1);
      } else {
        level2State.selectedLigands.push(ligand);
      }
      renderStep2(container);
    });
  });

  document.getElementById("back-btn")?.addEventListener("click", () => renderStep(1));
  document.getElementById("next-btn")?.addEventListener("click", () => {
    const finalCN = calculateCN(level2State.selectedLigands);
    if (finalCN >= 3 && finalCN <= 6) {
      level2State.coordinationNumber = finalCN;
      level2State.totalCharge = calculateTotalCharge(level2State.selectedMetal, level2State.selectedLigands);
      renderStep(3);
    }
  });
}

// ---- STEP 3: Q1 — Predict Type of Complex (2 pts) ----

function renderStep3(container) {
  const metal = level2State.selectedMetal;
  const ligands = level2State.selectedLigands;
  const correctAnswer = getCorrectComplexType(level2State.totalCharge);
  const options = ["Neutral", "Anionic", "Cationic"];
  const answered = level2State.q1Answer !== null;

  // Build charge table
  const ligandRows = ligands.map(l => {
    const chem = getLigandChem(l);
    return `<tr><td class="border p-2">${l.name}</td><td class="border p-2 text-center">${chem?.charge || 0}</td></tr>`;
  }).join("");

  container.innerHTML = `
    <h2 class="text-xl font-bold text-center mb-1">Q1: Predict the Type of Complex</h2>
    <p class="text-center text-gray-500 text-sm mb-4">Based on total charge (2 points)</p>

    <table class="w-full border-collapse mb-4 text-sm">
      <thead><tr class="bg-gray-100"><th class="border p-2 text-left">Component</th><th class="border p-2 text-center">Charge</th></tr></thead>
      <tbody>
        <tr class="bg-blue-50"><td class="border p-2 font-semibold">Metal: ${metal.name}</td><td class="border p-2 text-center font-bold">+${metal.charge}</td></tr>
        ${ligandRows}
        <tr class="bg-gray-50 font-bold"><td class="border p-2">Total Charge</td><td class="border p-2 text-center">${level2State.totalCharge > 0 ? '+' : ''}${level2State.totalCharge}</td></tr>
      </tbody>
    </table>

    <div class="flex flex-col gap-2 max-w-sm mx-auto" id="q1-options">
      ${options.map(opt => {
        let btnClass = "border-2 border-gray-200 hover:border-ludon-blue";
        if (answered) {
          if (opt === correctAnswer) btnClass = "border-2 border-green-500 bg-green-50";
          else if (opt === level2State.q1Answer && opt !== correctAnswer) btnClass = "border-2 border-red-500 bg-red-50";
          else btnClass = "border-2 border-gray-200 opacity-50";
        }
        return `<button class="q1-option p-3 rounded-xl font-semibold transition-all ${btnClass}" data-answer="${opt}" ${answered ? 'disabled' : ''}>${opt}</button>`;
      }).join("")}
    </div>

    ${answered ? `
      <div class="mt-4 text-center ${level2State.q1Correct ? 'text-green-600' : 'text-red-600'} font-bold">
        ${level2State.q1Correct ? '✅ Correct! +2 points' : `❌ Wrong! The answer is ${correctAnswer}`}
      </div>
    ` : ''}

    <div class="flex justify-between mt-6">
      <button id="back-btn" class="px-6 py-2 rounded-lg font-semibold text-gray-600 border border-gray-300 hover:bg-gray-100">← Back</button>
      <button id="next-btn" class="px-6 py-2 rounded-lg font-semibold text-white ${answered ? 'bg-ludon-blue hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'}" ${!answered ? 'disabled' : ''}>Next →</button>
    </div>
  `;

  if (!answered) {
    container.querySelectorAll(".q1-option").forEach(btn => {
      btn.addEventListener("click", () => {
        level2State.q1Answer = btn.dataset.answer;
        level2State.q1Correct = btn.dataset.answer === correctAnswer;
        if (level2State.q1Correct) level2State.level2Score += 2;
        updateScoreBar();
        renderStep3(container);
      });
    });
  }

  document.getElementById("back-btn")?.addEventListener("click", () => renderStep(2));
  document.getElementById("next-btn")?.addEventListener("click", () => {
    if (answered) renderStep(4);
  });
}

// ---- STEP 4: Q2 — Predict Coordination Number (1 pt) ----

function renderStep4(container) {
  const correctCN = level2State.coordinationNumber;
  const options = [3, 4, 5, 6];
  const answered = level2State.q2Answer !== null;

  // Build denticity table
  const ligandRows = level2State.selectedLigands.map(l => {
    const chem = getLigandChem(l);
    return `<tr>
      <td class="border p-2">${l.name}</td>
      <td class="border p-2 text-center">${chem?.type || '?'}</td>
      <td class="border p-2 text-center">${chem?.denticity || '?'}</td>
    </tr>`;
  }).join("");

  container.innerHTML = `
    <h2 class="text-xl font-bold text-center mb-1">Q2: Predict the Coordination Number</h2>
    <p class="text-center text-gray-500 text-sm mb-4">Based on ligand denticity (1 point)</p>

    <table class="w-full border-collapse mb-4 text-sm">
      <thead><tr class="bg-gray-100"><th class="border p-2 text-left">Ligand</th><th class="border p-2 text-center">Type</th><th class="border p-2 text-center">Denticity</th></tr></thead>
      <tbody>
        ${ligandRows}
      </tbody>
    </table>

    <div class="flex gap-3 justify-center" id="q2-options">
      ${options.map(opt => {
        let btnClass = "border-2 border-gray-200 hover:border-ludon-blue min-w-[60px]";
        if (answered) {
          if (opt === correctCN) btnClass = "border-2 border-green-500 bg-green-50 min-w-[60px]";
          else if (opt === level2State.q2Answer && opt !== correctCN) btnClass = "border-2 border-red-500 bg-red-50 min-w-[60px]";
          else btnClass = "border-2 border-gray-200 opacity-50 min-w-[60px]";
        }
        return `<button class="q2-option p-3 rounded-xl font-bold text-lg transition-all ${btnClass}" data-answer="${opt}" ${answered ? 'disabled' : ''}>${opt}</button>`;
      }).join("")}
    </div>

    ${answered ? `
      <div class="mt-4 text-center ${level2State.q2Correct ? 'text-green-600' : 'text-red-600'} font-bold">
        ${level2State.q2Correct ? '✅ Correct! +1 point' : `❌ Wrong! The answer is ${correctCN}`}
      </div>
    ` : ''}

    <div class="flex justify-between mt-6">
      <button id="back-btn" class="px-6 py-2 rounded-lg font-semibold text-gray-600 border border-gray-300 hover:bg-gray-100">← Back</button>
      <button id="next-btn" class="px-6 py-2 rounded-lg font-semibold text-white ${answered ? 'bg-ludon-blue hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'}" ${!answered ? 'disabled' : ''}>Next →</button>
    </div>
  `;

  if (!answered) {
    container.querySelectorAll(".q2-option").forEach(btn => {
      btn.addEventListener("click", () => {
        level2State.q2Answer = parseInt(btn.dataset.answer);
        level2State.q2Correct = level2State.q2Answer === correctCN;
        if (level2State.q2Correct) level2State.level2Score += 1;
        updateScoreBar();
        renderStep4(container);
      });
    });
  }

  document.getElementById("back-btn")?.addEventListener("click", () => renderStep(3));
  document.getElementById("next-btn")?.addEventListener("click", () => {
    if (answered) renderStep(5);
  });
}

// ---- STEP 5: Q3 — State Possible Geometry (1 pt) ----

function renderStep5(container) {
  const cn = level2State.coordinationNumber;
  const correctGeometries = getCorrectGeometries(cn);
  const allOptions = ["Trigonal planar", "Tetrahedral", "Square planar", "Trigonal bipyramidal", "Square pyramidal", "Octahedral"];
  const answered = level2State.q3Answer !== null;

  container.innerHTML = `
    <h2 class="text-xl font-bold text-center mb-1">Q3: State the Possible Geometry</h2>
    <p class="text-center text-gray-500 text-sm mb-4">Based on CN = ${cn} (1 point)</p>

    <div class="grid grid-cols-2 gap-2 max-w-md mx-auto" id="q3-options">
      ${allOptions.map(opt => {
        const isCorrect = correctGeometries.includes(opt);
        let btnClass = "border-2 border-gray-200 hover:border-ludon-blue";
        if (answered) {
          if (isCorrect) btnClass = "border-2 border-green-500 bg-green-50";
          else if (opt === level2State.q3Answer && !isCorrect) btnClass = "border-2 border-red-500 bg-red-50";
          else btnClass = "border-2 border-gray-200 opacity-50";
        }
        return `<button class="q3-option p-3 rounded-xl text-sm font-semibold transition-all ${btnClass}" data-answer="${opt}" ${answered ? 'disabled' : ''}>${opt}</button>`;
      }).join("")}
    </div>

    ${answered ? `
      <div class="mt-4 text-center ${level2State.q3Correct ? 'text-green-600' : 'text-red-600'} font-bold">
        ${level2State.q3Correct ? '✅ Correct! +1 point' : `❌ Wrong! Correct: ${correctGeometries.join(" or ")}`}
      </div>
    ` : ''}

    <div class="flex justify-between mt-6">
      <button id="back-btn" class="px-6 py-2 rounded-lg font-semibold text-gray-600 border border-gray-300 hover:bg-gray-100">← Back</button>
      <button id="next-btn" class="px-6 py-2 rounded-lg font-semibold text-white ${answered ? 'bg-ludon-blue hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'}" ${!answered ? 'disabled' : ''}>Next →</button>
    </div>
  `;

  if (!answered) {
    container.querySelectorAll(".q3-option").forEach(btn => {
      btn.addEventListener("click", () => {
        level2State.q3Answer = btn.dataset.answer;
        level2State.q3Correct = correctGeometries.includes(level2State.q3Answer);
        if (level2State.q3Correct) level2State.level2Score += 1;
        updateScoreBar();
        renderStep5(container);
      });
    });
  }

  document.getElementById("back-btn")?.addEventListener("click", () => renderStep(4));
  document.getElementById("next-btn")?.addEventListener("click", () => {
    if (answered) renderStep(6);
  });
}

// ---- STEP 6: Q4 — Form Complex Structure (6 pts) ----

function renderStep6(container) {
  const cn = level2State.coordinationNumber;
  const correctGeometries = getCorrectGeometries(cn);
  const allGeometries = ["Trigonal planar", "Tetrahedral", "Square planar", "Trigonal bipyramidal", "Square pyramidal", "Octahedral"];
  const maxAttempts = 3;
  const attemptsLeft = maxAttempts - level2State.q4Attempts;
  const finished = level2State.q4PickScore > 0 || attemptsLeft <= 0;

  container.innerHTML = `
    <h2 class="text-xl font-bold text-center mb-1">Q4: Form the Complex Structure</h2>
    <p class="text-center text-gray-500 text-sm mb-2">Pick the correct geometry (up to 6 points)</p>
    <p class="text-center text-sm mb-4">Attempts remaining: <strong class="${attemptsLeft <= 1 ? 'text-red-600' : 'text-ludon-blue'}">${attemptsLeft}</strong> / 3</p>

    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3" id="q4-options">
      ${allGeometries.map(geo => {
        const img = GEOMETRY_IMAGES[geo];
        const isCorrect = correctGeometries.includes(geo);
        let cardClass = "border-2 border-gray-200 hover:border-ludon-blue hover:shadow-md cursor-pointer";
        if (finished && isCorrect) cardClass = "border-2 border-green-500 bg-green-50";
        else if (finished) cardClass = "border-2 border-gray-200 opacity-40";
        return `
          <button class="q4-geo-card rounded-xl overflow-hidden transition-all ${cardClass}" data-geometry="${geo}" ${finished ? 'disabled' : ''}>
            <img src="/images/geometry/${img.file}" alt="${geo}" class="w-full aspect-square object-contain bg-white p-2" />
            <div class="p-2 text-center text-xs font-semibold bg-gray-50">${geo}</div>
          </button>
        `;
      }).join("")}
    </div>

    ${finished ? `
      <div class="mt-4 text-center font-bold ${level2State.q4PickScore > 0 ? 'text-green-600' : 'text-red-600'}">
        ${level2State.q4PickScore > 0 ? `✅ Correct! +${level2State.q4PickScore} points` : `❌ No more attempts. The answer was: ${correctGeometries.join(" or ")}`}
      </div>
    ` : ''}

    <div class="flex justify-between mt-6">
      <button id="back-btn" class="px-6 py-2 rounded-lg font-semibold text-gray-600 border border-gray-300 hover:bg-gray-100">← Back</button>
      <button id="finish-btn" class="px-6 py-2 rounded-lg font-semibold text-white ${finished ? 'bg-ludon-blue hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'}" ${!finished ? 'disabled' : ''}>
        See Results →
      </button>
    </div>
  `;

  if (!finished) {
    container.querySelectorAll(".q4-geo-card").forEach(card => {
      card.addEventListener("click", () => {
        const geo = card.dataset.geometry;
        const isCorrect = correctGeometries.includes(geo);
        level2State.q4Attempts++;

        if (isCorrect) {
          const pointsMap = { 1: 3, 2: 2, 3: 1 };
          level2State.q4PickScore = pointsMap[level2State.q4Attempts] || 0;
          level2State.level2Score += level2State.q4PickScore;
        } else {
          // Wrong — flash red briefly
          card.classList.add("border-red-500", "bg-red-50");
          card.setAttribute("disabled", "true");
          card.classList.add("opacity-40");
        }

        updateScoreBar();
        if (isCorrect || level2State.q4Attempts >= maxAttempts) {
          renderStep6(container);
        }
      });
    });
  }

  document.getElementById("back-btn")?.addEventListener("click", () => renderStep(5));
  document.getElementById("finish-btn")?.addEventListener("click", () => {
    if (finished) renderResults(container);
  });
}

// ---- RESULTS ----

function renderResults(container) {
  updateStepIndicator(7); // All done
  const l1Score = gameState.playerPoints?.[level2State.playerId] || 0;
  const l2Score = level2State.level2Score;
  const totalScore = l1Score + l2Score;

  container.innerHTML = `
    <div class="text-center">
      <div class="text-5xl mb-4">🎉</div>
      <h2 class="text-2xl font-bold mb-2">Level 2 Complete!</h2>
      <p class="text-gray-600 mb-6">${level2State.playerName}</p>

      <div class="bg-gray-50 rounded-xl p-4 mb-6 text-left max-w-sm mx-auto">
        <h3 class="font-bold text-sm text-gray-500 mb-3 uppercase">Score Breakdown</h3>

        <div class="flex justify-between py-2 border-b">
          <span>Level 1 (Board Questions + Fate)</span>
          <strong>${l1Score} pts</strong>
        </div>
        <div class="flex justify-between py-2 border-b">
          <span>Q1: Type of Complex</span>
          <strong class="${level2State.q1Correct ? 'text-green-600' : 'text-red-500'}">${level2State.q1Correct ? '2' : '0'} / 2</strong>
        </div>
        <div class="flex justify-between py-2 border-b">
          <span>Q2: Coordination Number</span>
          <strong class="${level2State.q2Correct ? 'text-green-600' : 'text-red-500'}">${level2State.q2Correct ? '1' : '0'} / 1</strong>
        </div>
        <div class="flex justify-between py-2 border-b">
          <span>Q3: Geometry</span>
          <strong class="${level2State.q3Correct ? 'text-green-600' : 'text-red-500'}">${level2State.q3Correct ? '1' : '0'} / 1</strong>
        </div>
        <div class="flex justify-between py-2 border-b">
          <span>Q4: Complex Structure</span>
          <strong class="${level2State.q4PickScore > 0 ? 'text-green-600' : 'text-red-500'}">${level2State.q4PickScore} / 6</strong>
        </div>
        <div class="flex justify-between py-3 text-lg font-bold text-ludon-blue">
          <span>Grand Total</span>
          <span>${totalScore} pts</span>
        </div>
      </div>

      <div class="flex gap-3 justify-center">
        <button onclick="location.href='/'" class="px-6 py-2 rounded-lg font-semibold bg-gray-400 text-white hover:bg-gray-500 transition-all">Menu</button>
      </div>
    </div>
  `;
}

// ---- INIT ----

function initLevel2() {
  // Use first active player (player with ligands)
  if (activePlayers.length > 0) {
    level2State.playerId = parseInt(activePlayers[currentPlayerIndex]);
  } else {
    level2State.playerId = 1;
  }
  level2State.playerName = getPlayerName(level2State.playerId);

  // Show player info
  const playerInfo = document.getElementById("player-info");
  if (playerInfo) {
    playerInfo.textContent = `${level2State.playerName}'s Turn`;
    playerInfo.style.color = "#4187a0";
  }

  updateScoreBar();
  renderStep(1);
}

// Start when DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initLevel2);
} else {
  initLevel2();
}
```

**Step 2: Build and verify**

```bash
npx astro build
```
Expected: Build succeeds. Navigate to `/level-2` after winning Level 1.

**Step 3: Commit**

```bash
git add public/scripts/level-2-game.js
git commit -m "feat: implement Level 2 step wizard game logic (6 steps, scoring)"
```

---

## Task 5: Manual Testing Checklist

After all code is written, verify each step manually:

**Step 1: Quick test via sessionStorage injection**

Open browser console on `/level-2` and inject test state:
```javascript
sessionStorage.setItem("game-state", JSON.stringify({
  playerLigands: { 1: [
    { id: "nh3", name: "NH₃" },
    { id: "cl", name: "CI" },
    { id: "cl", name: "CI" },
    { id: "h2o", name: "H₂O" },
    { id: "en", name: "en" },
    { id: "bipy", name: "bipy" }
  ]},
  playerPoints: { 1: 8 },
  collectedLigandIds: ["nh3","cl","h2o","en","bipy"]
}));
sessionStorage.setItem("game-option", "one-vs-three");
sessionStorage.setItem("one-vs-three-player-1-name", "Test Player");
location.reload();
```

**Step 2: Walk through all 6 steps**

- [ ] Step 1: Can select metal, Next button works
- [ ] Step 2: Ligands show, CN counter works, validation blocks CN>6
- [ ] Step 3: Charge table correct, Q1 scoring works (2 pts)
- [ ] Step 4: Denticity table correct, Q2 scoring works (1 pt)
- [ ] Step 5: Geometry options correct for CN, Q3 scoring works (1 pt)
- [ ] Step 6: 3-attempt system works, scoring degrades (3→2→1)
- [ ] Results: Score breakdown correct, grand total = L1 + L2
- [ ] Score bar updates live throughout
- [ ] Back buttons work at every step
- [ ] Step indicator highlights correctly

**Step 3: Commit if fixes needed**

```bash
git add -A
git commit -m "fix: Level 2 testing fixes"
```

---

## Summary

| Task | What | Files |
|------|------|-------|
| 1 | Copy geometry images | `public/images/geometry/` |
| 2 | Add Level 2 button to winners modal | `winners-model.astro` |
| 3 | Create Level 2 page skeleton | `src/pages/level-2.astro` |
| 4 | Create Level 2 game logic | `public/scripts/level-2-game.js` |
| 5 | Manual testing | Browser console |

Total new files: 2 (`level-2.astro`, `level-2-game.js`)
Modified files: 1 (`winners-model.astro`)
Copied assets: 3 PNG files
