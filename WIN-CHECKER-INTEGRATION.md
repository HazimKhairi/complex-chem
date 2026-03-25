# Win Checker Integration Guide

## Overview

The `win-checker.js` module provides Level 1 win detection and scoring for COOR-CHEM. It automatically detects when players complete the game by getting all 4 pieces into the home area and calculates scores based on collected ligands.

## Files Created

1. **`/public/scripts/win-checker.js`** - Main win detection module
2. **`/public/win-checker-test.html`** - Test suite for manual testing

## How It Works

### Win Condition Detection

The win checker monitors piece positions and declares winners when:
- A player has all 4 pieces in their home area (position 57)
- Home positions are identified by CSS classes: `.r57`, `.b57`, `.y57`, `.g57`

### Score Calculation

Player scores are calculated from:
1. **Ligands collected** - from `gameState.playerLigands[playerId].length`
2. **Bonus points** - from `gameState.playerPoints[playerId]` (fate cards, etc.)

## Integration Steps

### Step 1: Load the Script

Add to your game page (already done in `game-board.astro` structure):

```html
<script src="/scripts/win-checker.js"></script>
```

### Step 2: Call After Piece Movement

In your game logic (e.g., `one-vs-one.js`, `one-vs-two.js`, `one-vs-three.js`), add win checking after piece moves:

```javascript
// After a piece reaches home (position 57)
if (newPosition === 57) {
  // Play home sound
  audio = new Audio("audio/horse-home.wav");
  audio.play();

  // Check for winner
  setTimeout(() => {
    WinChecker.checkWinCondition();
  }, 300);
}
```

### Step 3: Recommended Integration Points

Add `WinChecker.checkWinCondition()` at these locations:

1. **After piece movement completes**
   ```javascript
   // In the horse movement function, after position update
   function moveHorse(horseClass, steps) {
     // ... existing movement code ...

     // Check if piece reached home
     if (window[`lastPos${horseClass}`] === 57) {
       setTimeout(() => {
         WinChecker.checkWinCondition();
       }, 300);
     }
   }
   ```

2. **In the existing `findWinner()` function**
   ```javascript
   // Replace or supplement existing winner detection
   function findWinner() {
     // Your existing code...

     // Add win checker
     WinChecker.checkWinCondition();
   }
   ```

3. **After dice transfer (turn change)**
   ```javascript
   function transferDiceCode() {
     // ... existing transfer code ...

     // Check for winners after turn
     WinChecker.checkWinCondition();
   }
   ```

## API Reference

### Core Functions

#### `checkWinCondition()`
Checks all players for win conditions and declares winners.

```javascript
// Returns: boolean - true if new winner found
const foundWinner = WinChecker.checkWinCondition();
```

#### `getPiecesInHome(playerId)`
Count how many pieces a player has in home area.

```javascript
// Returns: number (0-4)
const pieces = WinChecker.getPiecesInHome(1); // Player 1
console.log(`Player 1 has ${pieces} pieces home`);
```

#### `calculateScore(playerId)`
Calculate total score for a player.

```javascript
// Returns: number (ligands + bonus points)
const score = WinChecker.calculateScore(1);
console.log(`Player 1 score: ${score}`);
```

#### `declareWinner(playerId, score)`
Manually declare a player as winner.

```javascript
// Useful for testing or manual winner declaration
WinChecker.declareWinner(1, 15);
```

#### `hasPlayerWon(playerId)`
Check if a player has won (4 pieces in home).

```javascript
// Returns: boolean
if (WinChecker.hasPlayerWon(1)) {
  console.log("Player 1 has won!");
}
```

#### `getGameStatus()`
Get complete game status for all players.

```javascript
const status = WinChecker.getGameStatus();
// Returns:
// {
//   winners: [...],
//   gameEnded: boolean,
//   playersStatus: {
//     1: { piecesInHome: 4, score: 15, hasWon: true, isWinner: true },
//     2: { piecesInHome: 2, score: 8, hasWon: false, isWinner: false },
//     ...
//   }
// }
```

#### `reset()`
Reset win checker state (for new games).

```javascript
WinChecker.reset();
```

## Testing

### Manual Testing with Test Suite

1. Open `/win-checker-test.html` in your browser
2. Click "Initialize Mock Game State" to set up test data
3. Click "Simulate Player X Win" to test win detection
4. Use "Test" buttons to verify individual functions
5. Check console output for detailed logs

### Console Testing

Open browser console on game page:

```javascript
// Check current status
WinChecker.getGameStatus();

// Check specific player
WinChecker.getPiecesInHome(1);
WinChecker.calculateScore(1);

// Force win check
WinChecker.checkWinCondition();

// View current winners
WinChecker.getWinners();

// Reset for new game
WinChecker.reset();
```

## Game State Requirements

The win checker expects this global `gameState` object:

```javascript
window.gameState = {
  playerLigands: {
    1: [{ id: 'h2o', name: 'H₂O' }, ...],
    2: [{ id: 'phen', name: 'phen' }, ...],
    3: [...],
    4: [...]
  },
  playerPoints: {
    1: 5,  // Bonus points from fate cards, etc.
    2: 0,
    3: 2,
    4: 0
  }
};
```

This is already initialized in `game-mechanics-cards.js`.

## Winners Modal

The win checker uses the existing winners modal (`#winners`):

### What Gets Updated

1. **Modal title** - Changed to "Level 1 Complete! 🎉"
2. **Winner slots** - Updated with player names and scores
3. **Display format** - Shows as "PlayerName - X ligands"

### Modal Structure Expected

```html
<div id="winners" class="hidden">
  <h1>Congratulations!</h1>
  <div id="winner-1">
    <span id="winner-1-name">Player 1</span>
    <img id="winner-1-image" src="..." />
  </div>
  <!-- winner-2, winner-3, winner-4 ... -->
</div>
```

Already exists in `winners-model.astro`.

## Example Integration

Here's a complete example for `one-vs-one.js`:

```javascript
// At the top of the file, after other scripts load
document.addEventListener('DOMContentLoaded', () => {
  // Ensure win checker is loaded
  if (typeof WinChecker !== 'undefined') {
    console.log('✅ Win Checker ready');
  }
});

// In your horse movement function
function moveHorseToPosition(horseClass, newPosition) {
  // ... existing movement code ...

  // Update position variable
  window[`lastPos${horseClass}`] = newPosition;

  // Check if reached home
  if (newPosition === 57) {
    // Play sound
    audio = new Audio("audio/horse-home.wav");
    audio.play();

    // Check for winner after animation completes
    setTimeout(() => {
      const newWinner = WinChecker.checkWinCondition();
      if (newWinner) {
        // Winner modal will show automatically
        console.log('🏆 New winner detected!');
      }
    }, 500);
  }
}

// Replace or enhance existing findWinner function
function findWinner() {
  // Use win checker instead of manual checking
  WinChecker.checkWinCondition();
}

// On game start/reset
function startNewGame() {
  WinChecker.reset();
  // ... rest of game initialization ...
}
```

## Features

### Multi-Winner Support

- Tracks multiple winners in order of completion
- Sorts by score (highest first)
- Supports 2-4 players based on game mode

### Player Name Detection

Automatically retrieves player names from session storage based on game mode:
- `one-vs-one` - 2 players
- `one-vs-two` - 3 players
- `one-vs-three` - 4 players

### Automatic Game End

Game automatically ends when required number of winners finish:
- 1v1: 2 winners
- 1v2: 3 winners
- 1v3: 4 winners

### Duplicate Prevention

Won't declare the same player as winner twice.

## Debugging

Enable detailed logging:

```javascript
// Check piece positions
for (let i = 1; i <= 4; i++) {
  console.log(`Player ${i}:`, WinChecker.getPiecesInHome(i), 'pieces');
}

// Check scores
for (let i = 1; i <= 4; i++) {
  console.log(`Player ${i} score:`, WinChecker.calculateScore(i));
}

// View complete status
console.table(WinChecker.getGameStatus().playersStatus);
```

## Common Issues

### Issue: Winner not detected
**Solution**: Verify pieces are in the correct home cell (`.r57`, `.b57`, etc.) and are `<img>` elements.

### Issue: Score shows as 0
**Solution**: Check that `gameState.playerLigands` is properly populated when ligands are collected.

### Issue: Modal doesn't show
**Solution**: Verify `#winners` modal exists in DOM and isn't permanently hidden.

### Issue: Wrong player names
**Solution**: Check session storage keys match your game mode (e.g., `one-vs-one-player-1-name`).

## Performance

- Lightweight: ~11KB uncompressed
- No external dependencies
- Efficient DOM queries using single selectors
- Runs only when called (no polling)

## Browser Compatibility

- Modern browsers (ES6+)
- Uses: querySelector, arrow functions, template literals
- No polyfills required for Chrome/Firefox/Safari/Edge

## Next Steps

1. Load the script in your game page
2. Add `WinChecker.checkWinCondition()` calls after piece movements
3. Test using the test suite at `/win-checker-test.html`
4. Verify in actual gameplay by moving pieces to home
5. Check console for debugging logs

## Support

For issues or questions:
1. Check browser console for error messages
2. Use test suite to isolate problems
3. Verify game state structure matches expectations
4. Review API documentation above
