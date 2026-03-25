# Tile Detector for COOR-CHEM Ludo Game

## Overview

The `tile-detector.js` module provides comprehensive tile detection and mapping for the COOR-CHEM ludo game board. It identifies tile types, positions, and content to enable game mechanics.

## Installation

The tile detector is automatically loaded on the game board page. It's included in `/src/pages/game-board.astro`.

## Tile Types

The detector recognizes the following tile types:

1. **safe** - Safe zones (colored backgrounds) where players cannot be captured
2. **ligand** - Tiles with chemical ligand formulas
3. **question** - Complex/question tiles with numbered images
4. **fate** - Fate card tiles (special events)
5. **start** - Starting tiles with arrow indicators
6. **home** - Winning home tiles in the center
7. **normal** - Standard path tiles

## API Reference

### Core Functions

#### `getTileType(cellElement)`
Returns the tile type for a given cell element.

```javascript
const cell = document.querySelector('td.r1');
const type = window.TileDetector.getTileType(cell);
console.log(type); // "safe"
```

**Parameters:**
- `cellElement` (HTMLElement) - The table cell element

**Returns:** String - Tile type

---

#### `getTileAtPosition(row, col)`
Gets tile information at a specific board position.

```javascript
const tileInfo = window.TileDetector.getTileAtPosition(0, 0);
console.log(tileInfo);
// {
//   row: 0,
//   col: 0,
//   type: "ligand",
//   element: <td>,
//   classes: ["r11", "b50", "y24", "g37"],
//   content: "phen",
//   isSpecial: true
// }
```

**Parameters:**
- `row` (number) - Row index (0-based)
- `col` (number) - Column index (0-based)

**Returns:** Object | null - Tile info object or null if not found

---

#### `isSpecialTile(cellElement)`
Checks if a tile is a special tile (not normal).

```javascript
const cell = document.querySelector('td.r11');
const isSpecial = window.TileDetector.isSpecialTile(cell);
console.log(isSpecial); // true
```

**Parameters:**
- `cellElement` (HTMLElement) - The table cell element

**Returns:** Boolean

---

### Utility Functions

#### `getAllTilesOfType(tileType)`
Gets all tiles of a specific type.

```javascript
const ligandTiles = window.TileDetector.getAllTilesOfType('ligand');
console.log(`Found ${ligandTiles.length} ligand tiles`);

ligandTiles.forEach(tile => {
  console.log(`${tile.classes.join(' ')}: "${tile.content}"`);
});
```

**Parameters:**
- `tileType` (string) - The tile type to search for

**Returns:** Array - Array of tile info objects

---

#### `getTileByClassName(className)`
Gets tile info by position class name (e.g., 'r1', 'b25').

```javascript
const tile = window.TileDetector.getTileByClassName('r11');
console.log(tile.type);    // "ligand"
console.log(tile.content); // "phen"
```

**Parameters:**
- `className` (string) - The position class name

**Returns:** Object | null - Tile info object or null

---

#### `getLigandName(cellElement)`
Gets the ligand name from a ligand tile.

```javascript
const cell = document.querySelector('td.r11');
const ligandName = window.TileDetector.getLigandName(cell);
console.log(ligandName); // "phen"
```

**Parameters:**
- `cellElement` (HTMLElement) - The table cell element

**Returns:** String | null - Ligand name or null if not a ligand tile

---

### Testing Functions

#### `printTileSummary()`
Prints a summary of all tile types on the board.

```javascript
const summary = window.TileDetector.printTileSummary();
// Logs a table with counts of each tile type
// Returns: { safe: 12, ligand: 30, question: 10, fate: 6, start: 4, home: 4, normal: 20 }
```

**Returns:** Object - Summary of tile counts by type

---

#### `testTileDetector()`
Runs comprehensive tests on the tile detector.

```javascript
window.TileDetector.testTileDetector();
// Logs test results for known tiles and summaries
```

---

## Usage Examples

### Example 1: Detect Landing Tile Type

```javascript
// When a player lands on a tile
function handlePlayerLanding(playerPiece) {
  const currentCell = playerPiece.parentElement;
  const tileType = window.TileDetector.getTileType(currentCell);

  switch (tileType) {
    case 'ligand':
      const ligandName = window.TileDetector.getLigandName(currentCell);
      console.log(`Player landed on ligand: ${ligandName}`);
      collectLigand(ligandName);
      break;

    case 'question':
      console.log('Player landed on question tile');
      showQuestionModal();
      break;

    case 'fate':
      console.log('Player landed on fate card');
      showFateModal();
      break;

    case 'safe':
      console.log('Player is safe here');
      break;

    default:
      console.log('Normal tile');
  }
}
```

### Example 2: Find All Ligand Positions

```javascript
// Get all ligand tiles and their positions
const ligandTiles = window.TileDetector.getAllTilesOfType('ligand');

ligandTiles.forEach(tile => {
  const positions = tile.classes.filter(c => c.match(/^[rbgy]\d+/));
  console.log(`Ligand "${tile.content}" at positions: ${positions.join(', ')}`);
});
```

### Example 3: Check if Position is Safe

```javascript
function isPlayerSafe(cell) {
  const tileType = window.TileDetector.getTileType(cell);
  return tileType === 'safe' || tileType === 'home';
}

// Usage
const playerCell = document.querySelector('td.r1');
if (isPlayerSafe(playerCell)) {
  console.log('Player cannot be captured here');
}
```

### Example 4: Map Entire Board

```javascript
// Create a map of all special tiles
function mapSpecialTiles() {
  const map = {};
  const types = ['ligand', 'question', 'fate', 'start', 'home', 'safe'];

  types.forEach(type => {
    map[type] = window.TileDetector.getAllTilesOfType(type);
  });

  return map;
}

const boardMap = mapSpecialTiles();
console.log(`Board has ${boardMap.ligand.length} ligand tiles`);
console.log(`Board has ${boardMap.question.length} question tiles`);
```

### Example 5: Track Player Path

```javascript
// Get information about a player's path
function getPathInfo(playerColor) {
  const colorLetter = playerColor.charAt(0); // 'r', 'b', 'g', 'y'
  const pathTiles = [];

  // Collect all tiles for this player's path (1-56)
  for (let i = 1; i <= 56; i++) {
    const tile = window.TileDetector.getTileByClassName(`${colorLetter}${i}`);
    if (tile) {
      pathTiles.push({
        position: i,
        type: tile.type,
        content: tile.content
      });
    }
  }

  return pathTiles;
}

const redPath = getPathInfo('red');
console.log('Red player path:', redPath);
```

## Board Structure

The COOR-CHEM board is a 15×15 grid with:
- 4 player homes (corners)
- 1 winning center
- 4 colored paths (red, blue, green, yellow)
- Multiple special tiles along each path

Each tile has position classes like:
- `r1` to `r57` (red path + home)
- `b1` to `b57` (blue path + home)
- `g1` to `g57` (green path + home)
- `y1` to `y57` (yellow path + home)

## Detection Logic

### Ligand Tiles
Detected by text content matching known chemical formulas:
- H₂O, phen, bipy, ox, py, NH₃, PPh₃, Cl⁻, en, acac, CO₃²⁻, CN⁻, O²⁻

### Safe Tiles
Detected by background color classes:
- `bg-red-300`, `bg-blue-300`, `bg-green-300`, `bg-yellow-300`, `bg-sky-300`

### Question Tiles
Detected by background image containing `/complexes/[number].png`

### Fate Tiles
Detected by background image containing `fate_card.png`

### Start Tiles
Detected by background image containing `/arrows/`

### Home Tiles
Detected by class name pattern `[rbgy]57`

## Testing

### Browser Console Testing

Open the game board page and test in the browser console:

```javascript
// Quick test
window.TileDetector.testTileDetector();

// Check specific tile
window.TileDetector.getTileByClassName('r11');

// Get summary
window.TileDetector.printTileSummary();

// Find all ligands
window.TileDetector.getAllTilesOfType('ligand');
```

### Test Page

Open `/test-tile-detector.html` in your browser (from the game board context) to run visual tests.

## Integration with Game Mechanics

The tile detector is designed to work seamlessly with the game mechanics system:

```javascript
// In game-mechanics.js
function handlePlayerMove(playerId, position) {
  const tile = window.TileDetector.getTileByClassName(`r${position}`);

  if (tile) {
    switch (tile.type) {
      case 'ligand':
        collectLigand(playerId, tile.content);
        break;
      case 'question':
        showQuestion(playerId);
        break;
      case 'fate':
        showFate(playerId);
        break;
    }
  }
}
```

## Performance Considerations

- All tile queries use native DOM methods for optimal performance
- Tile type detection uses efficient pattern matching
- Results are not cached; query on-demand for real-time accuracy
- Minimal memory footprint (no large data structures)

## Browser Support

- Modern browsers with ES6+ support
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Troubleshooting

### TileDetector is undefined
Make sure the script is loaded on the game board page. Check the browser console for errors.

### Tiles not detected correctly
Verify the board HTML structure matches the expected format. Run `printTileSummary()` to see what's detected.

### Wrong tile type returned
Check if tile classes or background images have changed. Update detection logic in the `isFateTile()`, `isQuestionTile()`, etc. functions.

## Future Enhancements

Potential improvements:
- Add caching for frequently accessed tiles
- Support for custom tile types
- Tile animation state tracking
- Path validation and routing
- Collision detection helpers
- AI pathfinding integration

## License

Part of the COOR-CHEM game system.
