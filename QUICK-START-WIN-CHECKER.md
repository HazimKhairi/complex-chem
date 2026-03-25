# Win Checker - Quick Start Guide

## Installation (2 minutes)

### 1. Load the Script

Add to your game page or script loader:

```javascript
const winCheckerScript = document.createElement('script');
winCheckerScript.src = 'scripts/win-checker.js';
document.head.appendChild(winCheckerScript);
```

### 2. Add Win Check After Piece Moves

In your game logic files (`one-vs-one.js`, etc.):

```javascript
// After a piece reaches home position (57)
if (newPosition === 57) {
  setTimeout(() => {
    WinChecker.checkWinCondition();
  }, 300);
}
```

### 3. Test It!

1. Open game in browser
2. Move all 4 pieces to home
3. Winners modal should appear automatically with "Level 1 Complete!"

## Essential API

```javascript
// Main function - call after piece movements
WinChecker.checkWinCondition();

// Check specific player
WinChecker.getPiecesInHome(1);      // Returns 0-4
WinChecker.calculateScore(1);        // Returns score
WinChecker.hasPlayerWon(1);          // Returns true/false

// Get full status
WinChecker.getGameStatus();

// Reset for new game
WinChecker.reset();
```

## Integration Points

Add `WinChecker.checkWinCondition()` at these 3 places:

1. **After piece reaches home**
   ```javascript
   if (lastPos === 57) {
     WinChecker.checkWinCondition();
   }
   ```

2. **In existing findWinner() function**
   ```javascript
   function findWinner() {
     WinChecker.checkWinCondition();
   }
   ```

3. **After turn change (optional)**
   ```javascript
   function transferDiceCode() {
     // ... existing code ...
     WinChecker.checkWinCondition();
   }
   ```

## Testing

### Browser Console
```javascript
// Simulate test
WinChecker.declareWinner(1, 10);

// Check status
WinChecker.getGameStatus();
```

### Test Page
Open `/win-checker-test.html` for interactive testing.

## What It Does

1. Detects when any player gets 4 pieces in home (position 57)
2. Calculates score from ligands + bonus points
3. Updates existing winners modal automatically
4. Shows "Level 1 Complete!" message
5. Supports multiple winners (ranked by score)

## Requirements

Must have these in your code:

```javascript
// Game state (already in game-mechanics-cards.js)
window.gameState = {
  playerLigands: { 1: [...], 2: [...], 3: [...], 4: [...] },
  playerPoints: { 1: 0, 2: 0, 3: 0, 4: 0 }
};
```

Winners modal (already in winners-model.astro):
```html
<div id="winners">
  <div id="winner-1">
    <span id="winner-1-name"></span>
    <img id="winner-1-image" />
  </div>
  <!-- ... -->
</div>
```

## Files Created

- `/public/scripts/win-checker.js` - Main module (11KB)
- `/public/win-checker-test.html` - Test suite (11KB)
- `/WIN-CHECKER-INTEGRATION.md` - Full documentation (9KB)
- `/QUICK-START-WIN-CHECKER.md` - This guide

## Example for one-vs-one.js

```javascript
// Add near the top
document.addEventListener('DOMContentLoaded', () => {
  console.log('Win Checker:', typeof WinChecker !== 'undefined' ? 'Ready ✅' : 'Not loaded ❌');
});

// Add in horse movement function
function moveHorse(horseElement, steps) {
  // ... existing movement code ...

  const newPos = window[`lastPos${horseClass}`];

  if (newPos === 57) {
    // Piece reached home
    audio = new Audio("audio/horse-home.wav");
    audio.play();

    // Check for winner
    setTimeout(() => {
      const foundWinner = WinChecker.checkWinCondition();
      if (foundWinner) {
        console.log('🏆 Winner detected!');
      }
    }, 500);
  }
}

// Replace/enhance existing winner function
function findWinner() {
  WinChecker.checkWinCondition();
}
```

## Console Commands

```javascript
// Quick status check
WinChecker.getGameStatus().playersStatus

// Force check all players
WinChecker.checkWinCondition()

// Test specific player
WinChecker.getPiecesInHome(1)  // How many pieces in home?
WinChecker.calculateScore(1)    // What's their score?
WinChecker.hasPlayerWon(1)      // Have they won?

// View winners list
WinChecker.getWinners()

// Reset everything
WinChecker.reset()
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Winner not detected | Check pieces are `<img>` in `.r57`, `.b57`, `.y57`, or `.g57` cells |
| Score is 0 | Verify `gameState.playerLigands[playerId]` has ligand objects |
| Modal doesn't show | Check `#winners` element exists and isn't hidden permanently |
| Wrong names shown | Check session storage keys match game mode |

## Done!

That's it! The win checker is now integrated and will automatically detect winners and show the completion modal.

For detailed documentation, see `WIN-CHECKER-INTEGRATION.md`.
