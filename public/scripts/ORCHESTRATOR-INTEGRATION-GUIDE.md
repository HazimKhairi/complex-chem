# Game Orchestrator Integration Guide

## Overview

The Game Orchestrator is the central coordinator for COOR-CHEM Level 1 that connects all game systems together seamlessly.

## Architecture Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Game Orchestrator Flow                        │
└─────────────────────────────────────────────────────────────────┘

1. Piece Movement (one-vs-*.js)
   └─> Dispatches "piece-moved" event with {playerId, landedCell}

2. Orchestrator receives event
   └─> Checks tile type using TileDetector

3. If special tile (ligand/question/fate):
   └─> Shows appropriate modal via GameMechanics
   └─> Waits for modal close event

4. Modal closes
   └─> Dispatches "ligand-continue", "fate-continue", or "question-answered"

5. Orchestrator continues
   └─> Checks win condition via WinChecker
   └─> Advances turn via TurnManager
   └─> Ready for next move
```

## File Structure

```
public/scripts/
├── game-orchestrator.js      ← Main coordinator
├── tile-detector.js           ← Detects tile types
├── turn-manager.js            ← Manages turn progression
├── win-checker.js             ← Checks win conditions
├── game-mechanics-cards.js    ← Handles card modals (existing)
└── one-vs-*.js                ← Game movement scripts (existing)
```

## Integration Steps

### Step 1: Load Scripts in Correct Order

In `src/pages/game-board.astro`, add these scripts AFTER the game mechanics script:

```javascript
// Load supporting game systems
const tileDetectorScript = document.createElement("script");
tileDetectorScript.src = "scripts/tile-detector.js";
document.head.appendChild(tileDetectorScript);

const turnManagerScript = document.createElement("script");
turnManagerScript.src = "scripts/turn-manager.js";
document.head.appendChild(turnManagerScript);

const winCheckerScript = document.createElement("script");
winCheckerScript.src = "scripts/win-checker.js";
document.head.appendChild(winCheckerScript);

// Load orchestrator LAST (after all dependencies)
const orchestratorScript = document.createElement("script");
orchestratorScript.src = "scripts/game-orchestrator.js";
document.head.appendChild(orchestratorScript);
```

### Step 2: Add Event Dispatch to Movement Scripts

In `one-vs-one.js`, `one-vs-two.js`, and `one-vs-three.js`, add this code after a piece completes its movement:

Find the section where `count == randomDice` and `clearInterval(newfunc)` are called (around line 483 and 615).

Add this dispatch AFTER the piece has fully landed:

```javascript
if (count == randomDice) {
  clearInterval(newfunc);

  // ... existing code for horse killing, safe tiles, etc ...

  // 🎮 ORCHESTRATOR INTEGRATION: Notify orchestrator that piece has landed
  const landedCellClass = `${identifyPlayer}${window[`lastPos${playerHorseClassCaps}`]}`;
  document.dispatchEvent(new CustomEvent("piece-moved", {
    detail: {
      playerId: x,
      landedCell: landedCellClass,
      color: identifyColor
    }
  }));
  console.log(`🎮 Piece moved event dispatched: Player ${x} landed on ${landedCellClass}`);

  // ... rest of existing code ...
}
```

**Important Placement Notes:**
- Add the dispatch AFTER the piece has fully moved
- Add it BEFORE `transferDiceCode()` is called
- Add it in BOTH sections (regular path movement and home path movement)
- The orchestrator will handle turn progression, so existing turn logic remains unchanged

### Step 3: Verify Modal Events (Already Working)

The modals already dispatch the correct events:

- `ligand-modal.astro` → dispatches `"ligand-continue"`
- `fate-modal.astro` → dispatches `"fate-continue"`
- `question-modal.astro` → dispatches `"question-answered"`

No changes needed here! ✅

## Testing the Integration

### 1. Check All Systems Loaded

Open browser console and check:

```javascript
console.log(window.TileDetector);    // Should exist
console.log(window.TurnManager);     // Should exist
console.log(window.WinChecker);      // Should exist
console.log(window.GameMechanics);   // Should exist
console.log(window.GameOrchestrator); // Should exist
```

### 2. Test Tile Detection

```javascript
// Test ligand tile
window.TileDetector.getTileByClassName("r11");

// Test question tile
window.TileDetector.getTileByClassName("r4");

// Test fate tile
window.TileDetector.getTileByClassName("r5");
```

### 3. Simulate Landing

```javascript
// Simulate landing on ligand tile
window.GameOrchestrator.simulateLanding(1, "r11");

// Simulate landing on question tile
window.GameOrchestrator.simulateLanding(1, "r4");

// Simulate landing on fate tile
window.GameOrchestrator.simulateLanding(1, "r5");
```

### 4. Monitor Flow in Console

The orchestrator provides detailed console logging:

```
🎮 [ORCHESTRATOR] Loading Game Orchestrator...
✅ [ORCHESTRATOR] All systems ready!
🎯 [ORCHESTRATOR] === PIECE LANDED ===
   Player: 1
   Cell: r11
🔍 [ORCHESTRATOR] Step 1: Detecting tile type...
   Tile type: ligand
🧪 [ORCHESTRATOR] Triggering ligand collection
⏳ [ORCHESTRATOR] Waiting for modal to close...
🧪 [ORCHESTRATOR] Ligand modal closed - continuing game
⏭️ [ORCHESTRATOR] === PROGRESSING TURN ===
🏆 [ORCHESTRATOR] Step 3: Checking win condition...
🔄 [ORCHESTRATOR] Step 4: Advancing to next player...
   Next player: 4
✅ [ORCHESTRATOR] Turn complete - ready for next move
```

## Debugging

### Enable Detailed Logging

All systems have extensive console logging:

- `🎮 [ORCHESTRATOR]` - Orchestrator events
- `🔍 [TILE-DETECTOR]` - Tile detection
- `🔄 [TURN-MANAGER]` - Turn progression
- `🏆 [WIN-CHECKER]` - Win condition checks

### Common Issues

**Issue:** Orchestrator says "Waiting for game systems..."

**Solution:** Check script load order. Orchestrator must load AFTER all dependencies.

---

**Issue:** "piece-moved" event not triggered

**Solution:** Add the event dispatch in the movement scripts as shown in Step 2.

---

**Issue:** Modal doesn't trigger

**Solution:**
1. Check that TileDetector correctly identifies the tile type
2. Verify GameMechanics functions exist
3. Check for JavaScript errors in console

---

**Issue:** Turn doesn't progress

**Solution:**
1. Verify modal close events are dispatching correctly
2. Check TurnManager.getActivePlayers() matches game mode
3. Ensure global variable `x` is accessible

## Advanced Features

### Custom Tile Configuration

Edit `tile-detector.js` to customize which positions have special tiles:

```javascript
const TILE_CONFIG = {
  ligand: [3, 10, 17, 24, 31, 38, 45, 52],
  question: [6, 13, 20, 29, 36, 43, 50],
  fate: [8, 15, 23, 30, 37, 44, 51],
  safe: [1, 9, 14, 22, 27, 35, 40, 48]
};
```

### Turn Skip Penalties

Use TurnManager to skip a player's next turn (for fate card penalties):

```javascript
window.TurnManager.skipTurn(playerId);
```

### Manual Win Declaration

Trigger win condition check manually:

```javascript
window.WinChecker.checkWinCondition();
```

## API Reference

### GameOrchestrator

- `getState()` - Get current orchestrator state
- `simulateLanding(playerId, cellClass)` - Test landing on a tile
- `reset()` - Reset orchestrator state

### TileDetector

- `getTileType(cellElement)` - Get tile type from element
- `getTileByClassName(className)` - Get tile info by class
- `isSpecialTile(cellElement)` - Check if tile is special

### TurnManager

- `getCurrentPlayer()` - Get current player ID
- `setCurrentPlayer(playerId)` - Set current player
- `nextTurn()` - Advance to next player
- `skipTurn(playerId)` - Skip player's next turn
- `getActivePlayers()` - Get list of active players

### WinChecker

- `checkWinCondition()` - Check for winners
- `getPiecesInHome(playerId)` - Count pieces in home
- `calculateScore(playerId)` - Get player score
- `hasPlayerWon(playerId)` - Check if player has won
- `getGameStatus()` - Get full game status

## Support

For issues or questions, check the console logs first. The orchestrator provides extensive debugging information that will help identify the problem.

Happy gaming! 🎮
