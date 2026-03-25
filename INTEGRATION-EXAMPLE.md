# Win Checker Integration Example

## Exact Changes Needed in Game Files

This document shows the exact code changes needed to integrate win-checker.js into your existing game files.

---

## Step 1: Load Win Checker Script

### File: `src/pages/game-board.astro`

**Location**: In the `<script>` section where other scripts are loaded (around line 62-74)

**Add this code:**

```javascript
// Load win checker script
const winCheckerScript = document.createElement("script");
winCheckerScript.src = "scripts/win-checker.js";
winCheckerScript.type = "application/javascript";
document.head.appendChild(winCheckerScript);
```

**Full context:**

```javascript
<script>
  // Load game script based on selected option
  const gameOption = sessionStorage.getItem("game-option");
  const script = document.createElement("script");
  script.src = `scripts/${gameOption}.js`;
  script.type = "application/javascript";
  document.head.appendChild(script);

  // Load game mechanics script with beautiful cards
  const mechanicsScript = document.createElement("script");
  mechanicsScript.src = "scripts/game-mechanics-cards.js";
  mechanicsScript.type = "application/javascript";
  document.head.appendChild(mechanicsScript);

  // ADD THIS: Load win checker script
  const winCheckerScript = document.createElement("script");
  winCheckerScript.src = "scripts/win-checker.js";
  winCheckerScript.type = "application/javascript";
  document.head.appendChild(winCheckerScript);

  // Rest of existing code...
</script>
```

---

## Step 2: Update one-vs-one.js

### File: `public/scripts/one-vs-one.js`

**Change 1: Update findWinner() function**

**Location**: Around line 1047-1110

**Replace the existing findWinner() function OR add this at the end:**

```javascript
// Original function to keep existing visual feedback
function findWinner() {
  if (identifyPlayer == ".r") {
    gameParticipants = [".r57", ".g57"];
  } else if (identifyPlayer == ".g") {
    gameParticipants = [".g57", ".r57"];
  } else if (identifyPlayer == ".y") {
    gameParticipants = [".y57", ".b57"];
  } else if (identifyPlayer == ".b") {
    gameParticipants = [".b57", ".y57"];
  }

  // Show dice arrow if not all pieces home yet
  if ($(`td${identifyPlayer}57`).find("img").length < 4) {
    setTimeout(function () {
      $("#player-" + x + "-dice-arrow").attr("src", "gifs/arrow1.gif");
    }, 200);
  }

  // ADD THIS: Use win checker for detection and modal
  if (typeof WinChecker !== 'undefined') {
    WinChecker.checkWinCondition();
  }

  // Keep existing visual feedback (crown display)
  if ($(`td${gameParticipants[1]}`).find("img").length != 4) {
    if ($(`td${identifyPlayer}57`).find("img").length == 4) {
      $("#player-" + x + " > table > tbody").css("opacity", "0");
      $("#player-" + x + " > table").css({
        "background-image": 'url("crowns/first-winner.png")',
        "background-size": "75%",
        "background-repeat": "no-repeat",
        "background-position": "center",
      });
    }
  }
}
```

**Or simpler - just add win checker call at the start:**

```javascript
function findWinner() {
  // ADD THIS LINE at the start of existing function
  if (typeof WinChecker !== 'undefined') {
    WinChecker.checkWinCondition();
  }

  // ... rest of existing findWinner code stays the same ...
}
```

**Change 2: Add check after piece movement (Optional - for immediate detection)**

**Location**: Around line 619-624

**Current code:**
```javascript
} else if (window[`lastPos${playerHorseClassCaps}`] == 57) {
  d = 0;
  // Play sound on reaching winning home
  audio = new Audio("audio/horse-home.wav");
  audio.play();
  findWinner(); //Function for finding a winner
```

**Enhanced code (optional):**
```javascript
} else if (window[`lastPos${playerHorseClassCaps}`] == 57) {
  d = 0;
  // Play sound on reaching winning home
  audio = new Audio("audio/horse-home.wav");
  audio.play();
  findWinner(); //Function for finding a winner

  // ADD THIS: Double-check with win checker after animation
  setTimeout(() => {
    if (typeof WinChecker !== 'undefined') {
      WinChecker.checkWinCondition();
    }
  }, 500);
```

---

## Step 3: Update one-vs-two.js

### File: `public/scripts/one-vs-two.js`

**Same changes as one-vs-one.js**

1. Add win checker call in `findWinner()` function (around line 1071)
2. Optionally add check after piece reaches home (around line 633)

**Code:**
```javascript
function findWinner() {
  // ADD THIS at the start
  if (typeof WinChecker !== 'undefined') {
    WinChecker.checkWinCondition();
  }

  // ... existing code ...
}
```

---

## Step 4: Update one-vs-three.js

### File: `public/scripts/one-vs-three.js`

**Same changes as one-vs-one.js**

1. Add win checker call in `findWinner()` function (around line 1055)
2. Optionally add check after piece reaches home (around line 612)

**Code:**
```javascript
function findWinner() {
  // ADD THIS at the start
  if (typeof WinChecker !== 'undefined') {
    WinChecker.checkWinCondition();
  }

  // ... existing code ...
}
```

---

## Minimal Integration (Fastest)

If you want the absolute minimum changes:

### Only change needed in each game file (one-vs-one.js, one-vs-two.js, one-vs-three.js):

**Add ONE line at the start of findWinner() function:**

```javascript
function findWinner() {
  // ADD ONLY THIS LINE
  if (typeof WinChecker !== 'undefined') WinChecker.checkWinCondition();

  // All existing code stays exactly the same
  if (identifyPlayer == ".r") {
    gameParticipants = [".r57", ".g57"];
  }
  // ... rest of function unchanged ...
}
```

### And load the script in game-board.astro:

```javascript
// In the <script> section
const winCheckerScript = document.createElement("script");
winCheckerScript.src = "scripts/win-checker.js";
document.head.appendChild(winCheckerScript);
```

**That's it! Two small changes and you're done.**

---

## Testing the Integration

### Test 1: Console Check
1. Start a game
2. Open browser console (F12)
3. Type: `WinChecker`
4. Should see object with functions

### Test 2: Manual Win
1. Start a game
2. In console, type:
   ```javascript
   // Simulate player 1 winning
   WinChecker.declareWinner(1, 10);
   ```
3. Winners modal should appear

### Test 3: Actual Gameplay
1. Play the game normally
2. Move all 4 pieces to home
3. Winners modal should appear automatically
4. Should show "Level 1 Complete!"
5. Should display ligand count

### Test 4: Check Score Calculation
```javascript
// In console during game
WinChecker.getGameStatus()
// Should show all players with their pieces and scores
```

---

## Expected Behavior

### When Player Wins:

1. **Visual**:
   - Existing crown image appears on player home
   - Winners modal appears with "Level 1 Complete!"

2. **Modal displays**:
   - Player name
   - Score (number of ligands collected)
   - Gold/Silver/Bronze badges
   - Ranked by score

3. **Console logs**:
   ```
   🏆 Winner #1: Player 1 (John) - Score: 8 ligands
   ```

4. **Audio**:
   - Home arrival sound plays
   - Winner celebration sound plays

---

## Verification Checklist

- [ ] Win checker script loads (check console for "✅ WinChecker initialized")
- [ ] `WinChecker` object is available in console
- [ ] Winners modal appears when 4 pieces reach home
- [ ] Modal shows "Level 1 Complete!" title
- [ ] Player scores display correctly
- [ ] Multiple winners are tracked and sorted by score
- [ ] Game ends when appropriate number of players finish

---

## File Summary

Files that need changes:
1. ✅ `src/pages/game-board.astro` - Load win checker script
2. ✅ `public/scripts/one-vs-one.js` - Add win check in findWinner()
3. ✅ `public/scripts/one-vs-two.js` - Add win check in findWinner()
4. ✅ `public/scripts/one-vs-three.js` - Add win check in findWinner()

Files created:
1. ✅ `public/scripts/win-checker.js` - Main module
2. ✅ `public/win-checker-test.html` - Test suite
3. ✅ `WIN-CHECKER-INTEGRATION.md` - Full documentation
4. ✅ `QUICK-START-WIN-CHECKER.md` - Quick reference
5. ✅ `INTEGRATION-EXAMPLE.md` - This file

---

## Next Steps

1. Make the changes shown above
2. Test in browser
3. Verify win detection works
4. Check scores are calculated correctly
5. Test with different game modes (1v1, 1v2, 1v3)

---

## Need Help?

Check console for these messages:
- `✅ WinChecker initialized` - Module loaded correctly
- `✅ Game mechanics with cards initialized!` - Game state available
- `🏆 Winner #X: PlayerName - Score: Y ligands` - Winner detected

If you see errors, check:
1. Script loaded in correct order (after jQuery, before game scripts use it)
2. Game state exists (`window.gameState`)
3. Winners modal exists (`#winners`)
4. Home cells exist (`.r57`, `.b57`, etc.)
