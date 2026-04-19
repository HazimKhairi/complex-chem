/**
 * Shared test helpers — load vanilla JS scripts into jsdom context
 */
import { readFileSync } from 'fs';
import { join } from 'path';

const SCRIPTS_DIR = join(import.meta.dirname, '..', 'public', 'scripts');

/**
 * Load a script file and execute it in the current jsdom window context
 */
export function loadScript(filename) {
  const code = readFileSync(join(SCRIPTS_DIR, filename), 'utf-8');
  const fn = new Function(code);
  fn.call(window);
}

/**
 * Build a minimal ludo board DOM with path cells for all 4 colors.
 * Each color gets cells 1-57 (simplified — no gaps).
 */
export function buildBoardDOM() {
  const board = document.createElement('div');
  board.id = 'ludo-board';

  const table = document.createElement('table');

  ['r', 'b', 'y', 'g'].forEach(prefix => {
    for (let i = 1; i <= 57; i++) {
      const td = document.createElement('td');
      td.classList.add(`${prefix}${i}`);
      // Mark specific tiles with classes/styles for tile detection
      if (i === 57) {
        // home tile — class pattern r57, b57, etc.
      } else if (i === 51) {
        // start tile — arrow background
        td.className += ` bg-[url('/arrows/${prefix}-arrow.png')]`;
      } else if (i === 1) {
        // safe tile — colored background
        const safeColors = { r: 'bg-red-300', b: 'bg-blue-300', y: 'bg-yellow-300', g: 'bg-green-300' };
        td.classList.add(safeColors[prefix]);
        td.classList.add(`${prefix}${i}`);
      } else if (i === 5) {
        // fate tile
        td.setAttribute('style', "background-image: url('/assets/fate_card.png')");
      } else if (i === 4) {
        // question tile
        td.setAttribute('style', "background-image: url('/assets/complexes/1.png')");
      }

      // Add ligand tiles at specific positions
      if (i === 11) {
        const span = document.createElement('span');
        span.textContent = 'phen';
        td.appendChild(span);
      }
      if (i === 15) {
        const span = document.createElement('span');
        span.textContent = 'NH\u2083';
        td.appendChild(span);
      }

      const tr = document.createElement('tr');
      tr.appendChild(td);
      table.appendChild(tr);
    }
  });

  board.appendChild(table);
  document.body.appendChild(board);
  return board;
}

/**
 * Build player areas with home cells, dice, etc.
 */
export function buildPlayerAreas() {
  for (let i = 1; i <= 4; i++) {
    const area = document.createElement('div');
    area.id = `player-${i}-area`;

    const card = document.createElement('div');
    card.id = `player-${i}`;

    const homeCell = document.createElement('div');
    homeCell.classList.add('bg-gray-200');

    const horseImg = document.createElement('img');
    const prefixes = { 1: 'r', 2: 'b', 3: 'y', 4: 'g' };
    horseImg.classList.add(`${prefixes[i]}h1`);
    const colors = { 1: 'red', 2: 'blue', 3: 'yellow', 4: 'green' };
    horseImg.classList.add(colors[i]);
    horseImg.src = `horses/${colors[i]}.png`;
    homeCell.appendChild(horseImg);
    card.appendChild(homeCell);

    const diceArrow = document.createElement('img');
    diceArrow.id = `player-${i}-dice-arrow`;
    card.appendChild(diceArrow);

    const pointsEl = document.createElement('span');
    pointsEl.id = `player-${i}-points`;
    pointsEl.textContent = '0';
    card.appendChild(pointsEl);

    area.appendChild(card);
    document.body.appendChild(area);

    // Create ligand display container
    const ligandDisplay = document.createElement('div');
    ligandDisplay.id = `ligand-display-${i}`;
    document.body.appendChild(ligandDisplay);
  }
}

/**
 * Build modal elements needed by game mechanics
 */
export function buildModals() {
  // Ligand modal
  const ligandModal = document.createElement('div');
  ligandModal.id = 'ligand-modal';
  ligandModal.classList.add('hidden');
  ligandModal.innerHTML = '<h2></h2><p></p><div id="ligand-card-container"></div>';
  document.body.appendChild(ligandModal);

  // Question modal
  const questionModal = document.createElement('div');
  questionModal.id = 'question-modal';
  questionModal.classList.add('hidden');
  questionModal.innerHTML = `
    <div class="bg-gradient-to-r"></div>
    <div id="question-card-container"></div>
    <div id="question-options"></div>
    <div id="question-feedback" class="hidden"></div>
  `;
  document.body.appendChild(questionModal);

  // Fate modal
  const fateModal = document.createElement('div');
  fateModal.id = 'fate-modal';
  fateModal.classList.add('hidden');
  fateModal.innerHTML = '<div id="fate-card-container"></div>';
  document.body.appendChild(fateModal);

  // Winners modal
  const winnersModal = document.createElement('div');
  winnersModal.id = 'winners';
  winnersModal.classList.add('hidden');
  winnersModal.innerHTML = `
    <h1></h1>
    <div id="winner-1"><span id="winner-1-name"></span><img id="winner-1-image" /></div>
    <div id="winner-2"><span id="winner-2-name"></span><img id="winner-2-image" /></div>
    <div id="winner-3"><span id="winner-3-name"></span><img id="winner-3-image" /></div>
    <div id="winner-4"><span id="winner-4-name"></span><img id="winner-4-image" /></div>
  `;
  document.body.appendChild(winnersModal);
}

/**
 * Mock sessionStorage with initial game state
 */
export function mockSessionStorage(overrides = {}) {
  const defaults = {
    'game-option': 'one-vs-three',
    'one-vs-three-player-1-name': 'Alice',
    'one-vs-three-player-2-name': 'Bob',
    'one-vs-three-player-3-name': 'Charlie',
    'one-vs-three-player-4-name': 'Dana',
  };
  const data = { ...defaults, ...overrides };
  Object.keys(data).forEach(k => sessionStorage.setItem(k, data[k]));
}

/**
 * Set global window.setSelectedAnswer stub (used by showQuestion)
 */
export function stubGlobals() {
  window.setSelectedAnswer = vi.fn();
  window.DEBUG_TURN_MANAGER = false;
}
