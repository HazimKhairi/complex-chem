/**
 * Tile Detector for COOR-CHEM Ludo Game
 * Maps board cell positions to tile types and provides tile detection utilities
 */

(function () {
  'use strict';

  // Chemical formulas that appear on ligand tiles
  const LIGAND_FORMULAS = [
    'H₂O', 'phen', 'bipy', 'ox', 'py', 'NH₃', 'PPh₃', 'CI',
    'en', 'acac', 'CO₃²⁻', 'CN⁻', 'O²⁻'
  ];

  /**
   * Gets the tile type for a given cell element
   * @param {HTMLElement} cellElement - The table cell (td) element
   * @returns {string} - Tile type: "safe", "ligand", "question", "fate", "start", "home", "normal"
   */
  function getTileType(cellElement) {
    if (!cellElement || cellElement.tagName !== 'TD') {
      return 'normal';
    }

    // Check for home tiles (winning spots in center)
    if (isHomeTile(cellElement)) {
      return 'home';
    }

    // Check for start tiles (with arrow backgrounds)
    if (isStartTile(cellElement)) {
      return 'start';
    }

    // Check for safe tiles (colored backgrounds)
    if (isSafeTile(cellElement)) {
      return 'safe';
    }

    // Check for fate cards (by background image)
    if (isFateTile(cellElement)) {
      return 'fate';
    }

    // Check for question/complex tiles (by background image)
    if (isQuestionTile(cellElement)) {
      return 'question';
    }

    // Check for ligand tiles (by text content)
    if (isLigandTile(cellElement)) {
      return 'ligand';
    }

    return 'normal';
  }

  /**
   * Gets tile information at a specific position
   * @param {number} row - Row index (0-based)
   * @param {number} col - Column index (0-based)
   * @returns {Object|null} - Tile info object or null if not found
   */
  function getTileAtPosition(row, col) {
    // Find all table cells in the game board
    const ludoBoard = document.getElementById('ludo-board');
    if (!ludoBoard) {
      console.error('Ludo board not found');
      return null;
    }

    // Get all rows across all tables
    const allRows = ludoBoard.querySelectorAll('table tr');
    if (!allRows[row]) {
      console.warn(`Row ${row} not found`);
      return null;
    }

    // Get the specific cell
    const cells = allRows[row].querySelectorAll('td');
    const cell = cells[col];

    if (!cell) {
      console.warn(`Cell at row ${row}, col ${col} not found`);
      return null;
    }

    const tileType = getTileType(cell);
    const classes = Array.from(cell.classList);
    const content = getCellContent(cell);

    return {
      row,
      col,
      type: tileType,
      element: cell,
      classes,
      content,
      isSpecial: isSpecialTile(cell)
    };
  }

  /**
   * Checks if a tile is a special tile (not normal)
   * @param {HTMLElement} cellElement - The table cell element
   * @returns {boolean}
   */
  function isSpecialTile(cellElement) {
    const type = getTileType(cellElement);
    return type !== 'normal';
  }

  /**
   * Checks if tile is a home tile (winning spot)
   * @param {HTMLElement} cell
   * @returns {boolean}
   */
  function isHomeTile(cell) {
    const classes = cell.className;
    // Home tiles are in the center with classes like r57, b57, y57, g57
    return /[rbgy]57/.test(classes);
  }

  /**
   * Checks if tile is a start tile (with arrow)
   * @param {HTMLElement} cell
   * @returns {boolean}
   */
  function isStartTile(cell) {
    const classes = cell.className;
    const style = cell.style.backgroundImage || '';

    // Check for arrow backgrounds
    return classes.includes("bg-[url('/arrows/") ||
           style.includes('/arrows/');
  }

  /**
   * Checks if tile is a safe tile (colored base)
   * @param {HTMLElement} cell
   * @returns {boolean}
   */
  function isSafeTile(cell) {
    const classes = cell.className;

    // Safe tiles have solid color backgrounds
    return classes.includes('bg-red-300') ||
           classes.includes('bg-blue-300') ||
           classes.includes('bg-green-300') ||
           classes.includes('bg-yellow-300') ||
           classes.includes('bg-sky-300');
  }

  /**
   * Checks if tile is a fate card tile
   * @param {HTMLElement} cell
   * @returns {boolean}
   */
  function isFateTile(cell) {
    const style = cell.getAttribute('style') || '';
    return style.includes('fate_card.png');
  }

  /**
   * Checks if tile is a question/complex tile
   * @param {HTMLElement} cell
   * @returns {boolean}
   */
  function isQuestionTile(cell) {
    const style = cell.getAttribute('style') || '';

    // Question tiles have complex images (numbered .png files)
    if (style.includes('/complexes/') && !style.includes('fate_card.png')) {
      return true;
    }

    return false;
  }

  /**
   * Checks if tile is a ligand tile
   * @param {HTMLElement} cell
   * @returns {boolean}
   */
  function isLigandTile(cell) {
    const content = getCellContent(cell);

    // Check if content matches any known ligand formula
    return LIGAND_FORMULAS.some(formula => content.includes(formula));
  }

  /**
   * Gets the text content from a cell
   * @param {HTMLElement} cell
   * @returns {string}
   */
  function getCellContent(cell) {
    const span = cell.querySelector('span');
    return span ? span.textContent.trim() : '';
  }

  /**
   * Gets all tiles of a specific type
   * @param {string} tileType - The tile type to search for
   * @returns {Array} - Array of tile info objects
   */
  function getAllTilesOfType(tileType) {
    const ludoBoard = document.getElementById('ludo-board');
    if (!ludoBoard) {
      return [];
    }

    const tiles = [];
    const allCells = ludoBoard.querySelectorAll('table td');

    allCells.forEach((cell, index) => {
      if (getTileType(cell) === tileType) {
        tiles.push({
          index,
          element: cell,
          type: tileType,
          classes: Array.from(cell.classList),
          content: getCellContent(cell)
        });
      }
    });

    return tiles;
  }

  /**
   * Gets tile info by class name (e.g., 'r1', 'b25')
   * @param {string} className - The position class name
   * @returns {Object|null} - Tile info object or null
   */
  function getTileByClassName(className) {
    const ludoBoard = document.getElementById('ludo-board');
    if (!ludoBoard) {
      return null;
    }

    const cell = ludoBoard.querySelector(`td.${className}`);
    if (!cell) {
      return null;
    }

    // Extract background color from Tailwind classes or inline styles
    let backgroundColor = null;
    const classes = cell.className;
    if (classes.includes('bg-red-')) backgroundColor = '#EF4444';
    else if (classes.includes('bg-blue-')) backgroundColor = '#3B82F6';
    else if (classes.includes('bg-green-')) backgroundColor = '#10B981';
    else if (classes.includes('bg-yellow-')) backgroundColor = '#F59E0B';
    else if (classes.includes('bg-sky-')) backgroundColor = '#0EA5E9';
    else if (classes.includes('bg-pink-')) backgroundColor = '#EC4899';

    return {
      element: cell,
      type: getTileType(cell),
      classes: Array.from(cell.classList),
      content: getCellContent(cell),
      isSpecial: isSpecialTile(cell),
      backgroundColor: backgroundColor
    };
  }

  /**
   * Gets the ligand name from a ligand tile
   * @param {HTMLElement} cell
   * @returns {string|null} - Ligand name or null
   */
  function getLigandName(cell) {
    if (getTileType(cell) !== 'ligand') {
      return null;
    }
    return getCellContent(cell);
  }

  /**
   * Prints a summary of all tile types on the board
   */
  function printTileSummary() {
    const types = ['safe', 'ligand', 'question', 'fate', 'start', 'home', 'normal'];
    const summary = {};

    types.forEach(type => {
      summary[type] = getAllTilesOfType(type).length;
    });

    console.log('=== Tile Summary ===');
    console.table(summary);

    return summary;
  }

  /**
   * Test function to verify tile detection
   */
  function testTileDetector() {
    console.log('=== Testing Tile Detector ===\n');

    // Test specific known tiles
    const testCases = [
      { class: 'r1', expectedType: 'safe', description: 'Red start safe tile' },
      { class: 'r11', expectedType: 'ligand', description: 'Ligand tile with phen' },
      { class: 'r4', expectedType: 'question', description: 'Complex/question tile' },
      { class: 'r5', expectedType: 'fate', description: 'Fate card tile' },
      { class: 'r51', expectedType: 'start', description: 'Red arrow start tile' },
      { class: 'r57', expectedType: 'home', description: 'Red home winning tile' },
      { class: 'b1', expectedType: 'safe', description: 'Blue safe tile' },
      { class: 'g1', expectedType: 'safe', description: 'Green safe tile' },
      { class: 'y1', expectedType: 'safe', description: 'Yellow safe tile' }
    ];

    testCases.forEach(({ class: className, expectedType, description }) => {
      const tile = getTileByClassName(className);
      if (tile) {
        const match = tile.type === expectedType ? '✓' : '✗';
        console.log(`${match} ${className}: ${tile.type} (expected: ${expectedType}) - ${description}`);
        if (tile.content) {
          console.log(`  Content: "${tile.content}"`);
        }
      } else {
        console.log(`✗ ${className}: Not found`);
      }
    });

    console.log('\n=== Tile Counts ===');
    printTileSummary();

    console.log('\n=== Sample Ligand Tiles ===');
    const ligandTiles = getAllTilesOfType('ligand').slice(0, 5);
    ligandTiles.forEach(tile => {
      console.log(`${tile.classes.join(' ')}: "${tile.content}"`);
    });

    console.log('\n=== Sample Question Tiles ===');
    const questionTiles = getAllTilesOfType('question').slice(0, 5);
    questionTiles.forEach(tile => {
      console.log(`${tile.classes.join(' ')}`);
    });
  }

  // Export public API
  window.TileDetector = {
    getTileType,
    getTileAtPosition,
    isSpecialTile,
    getAllTilesOfType,
    getTileByClassName,
    getLigandName,
    printTileSummary,
    testTileDetector
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('TileDetector initialized! Use window.TileDetector to access functions.');
      console.log('Run window.TileDetector.testTileDetector() to test the detector.');
    });
  } else {
    console.log('TileDetector initialized! Use window.TileDetector to access functions.');
    console.log('Run window.TileDetector.testTileDetector() to test the detector.');
  }
})();
