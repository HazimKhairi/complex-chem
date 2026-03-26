# Fate Card Mechanics Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement all 5 interactive fate card effects (swap-card, eureka-moment, ligand-square, second-chance, destiny-dance) for the COOR-CHEM game.

**Architecture:** Create a centralized `FateEffectHandler` class that handles all fate card effects. Interactive effects (swap-card) use a dedicated modal. Movement effects (ligand-square, destiny-dance) reuse existing movement logic. Turn effects (second-chance) modify game state variables.

**Tech Stack:** Vanilla JavaScript, Astro components, jQuery (existing), sessionStorage for persistence

**Design Document:** `docs/plans/2026-03-26-fate-cards-design.md`

---

## Task 1: Create FateEffectHandler Core

**Files:**
- Create: `public/scripts/fate-effect-handler.js`

**Step 1: Create FateEffectHandler skeleton with routing**

```javascript
/**
 * Fate Effect Handler
 * Handles all interactive fate card effects
 */

window.FateEffectHandler = {
  /**
   * Apply fate effect based on type
   * @param {number} playerId - Player who got the fate card (1-4)
   * @param {string} fateEffect - Effect type (swap-card, ligand-gain, move-forward, extra-turn, destiny-dance)
   * @param {number} fateValue - Optional value for effects (e.g., 3 for move-forward)
   */
  applyEffect(playerId, fateEffect, fateValue = 0) {
    console.log(`🔺 [FATE] Applying ${fateEffect} for Player ${playerId}`, { fateValue });

    switch (fateEffect) {
      case 'point-booster':
      case 'minus':
        // Already handled in fate-modal.astro
        console.log(`💰 [FATE] Points-based effect (handled by modal)`);
        break;

      case 'swap-card':
        this.applySwapCard(playerId);
        break;

      case 'ligand-gain':
        this.applyEurekaMoment(playerId);
        break;

      case 'move-forward':
        this.applyLigandSquare(playerId, fateValue);
        break;

      case 'extra-turn':
        this.applySecondChance(playerId);
        break;

      case 'destiny-dance':
        this.applyDestinyDance(playerId);
        break;

      default:
        console.warn(`⚠️ [FATE] Unknown fate effect: ${fateEffect}`);
    }
  },

  /**
   * Helper: Get player color identifier
   */
  getPlayerColor(playerId) {
    const colors = { 1: 'R', 2: 'B', 3: 'Y', 4: 'G' };
    return colors[playerId] || 'B';
  },

  /**
   * Helper: Get player color class
   */
  getPlayerColorClass(playerId) {
    const colors = { 1: 'red', 2: 'blue', 3: 'yellow', 4: 'green' };
    return colors[playerId] || 'blue';
  },

  /**
   * Helper: Show notification message
   */
  showNotification(message, type = 'info') {
    console.log(`📢 [FATE] ${message}`);

    // Use existing UI animations if available
    if (window.UIAnimations) {
      if (type === 'success') {
        window.UIAnimations.showSuccess(message, 3000);
      } else if (type === 'error') {
        window.UIAnimations.showError(message, 3000);
      } else {
        window.UIAnimations.showNotification(message, 3000);
      }
    } else {
      // Fallback: console only
      console.log(`[NOTIFICATION] ${message}`);
    }
  },

  // Placeholder methods (to be implemented in subsequent tasks)
  applySwapCard(playerId) {
    console.log(`🔄 [FATE] Swap Card - Not yet implemented`);
    this.showNotification("Swap Card feature coming soon!", 'info');
  },

  applyEurekaMoment(playerId) {
    console.log(`🎉 [FATE] Eureka Moment - Not yet implemented`);
    this.showNotification("Eureka Moment feature coming soon!", 'info');
  },

  applyLigandSquare(playerId, spaces) {
    console.log(`⬆️ [FATE] Ligand Square - Not yet implemented`);
    this.showNotification("Ligand Square feature coming soon!", 'info');
  },

  applySecondChance(playerId) {
    console.log(`🎲 [FATE] Second Chance - Not yet implemented`);
    this.showNotification("Second Chance feature coming soon!", 'info');
  },

  applyDestinyDance(playerId) {
    console.log(`⬇️ [FATE] Destiny Dance - Not yet implemented`);
    this.showNotification("Destiny Dance feature coming soon!", 'info');
  }
};

// Auto-initialize
if (typeof window !== 'undefined') {
  console.log('✅ Fate Effect Handler loaded');
}
```

**Step 2: Load script in game board**

Modify: `src/components/game/game-board.astro`

Find the script loading section (around line 200+) and add:

```html
<!-- Fate Effect Handler -->
<script src="/scripts/fate-effect-handler.js"></script>
```

**Step 3: Integrate with fate modal**

Modify: `src/components/game/fate-modal.astro:41-42`

Replace the TODO comment with:

```javascript
// Apply other fate effects using FateEffectHandler
if (fateEffect && window.FateEffectHandler) {
  window.FateEffectHandler.applyEffect(playerId, fateEffect, fateValue);
} else if (!window.FateEffectHandler) {
  console.warn('⚠️ FateEffectHandler not available, only points-based effects will work');
}
```

**Step 4: Test core handler**

Manual test in browser console:

```javascript
// Should log placeholder messages
window.FateEffectHandler.applyEffect(1, 'swap-card');
window.FateEffectHandler.applyEffect(2, 'ligand-gain');
window.FateEffectHandler.applyEffect(3, 'move-forward', 3);
window.FateEffectHandler.applyEffect(4, 'extra-turn');
window.FateEffectHandler.applyEffect(1, 'destiny-dance');
```

Expected: Each call logs placeholder message with correct effect name

**Step 5: Commit**

```bash
git add public/scripts/fate-effect-handler.js src/components/game/game-board.astro src/components/game/fate-modal.astro
git commit -m "feat: add FateEffectHandler core with routing logic

- Create centralized handler for all fate effects
- Integrate with fate-modal.astro
- Add helper methods for player colors and notifications
- Placeholder implementations for all 5 effects

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Implement Eureka Moment (Simplest Effect)

**Files:**
- Modify: `public/scripts/fate-effect-handler.js:applyEurekaMoment()`
- Modify: `public/scripts/game-mechanics-cards.js` (add helper method)

**Step 1: Add helper to get global uncollected ligands**

Modify: `public/scripts/game-mechanics-cards.js`

Add new method after `initGameMechanics()` function (around line 350):

```javascript
/**
 * Get ligands that haven't been collected by ANY player yet
 * @returns {Array} Array of uncollected ligand objects
 */
function getGlobalUncollectedLigands() {
  return LIGANDS_DATA.filter(ligand =>
    !gameState.collectedLigandIds.includes(ligand.id)
  );
}
```

Expose in window.GameMechanics object (around line 650):

```javascript
window.GameMechanics = {
  collectLigand,
  showQuestion,
  showFate,
  awardPoints,
  getGlobalUncollectedLigands  // Add this line
};
```

**Step 2: Implement applyEurekaMoment**

Modify: `public/scripts/fate-effect-handler.js:applyEurekaMoment()`

Replace placeholder with:

```javascript
applyEurekaMoment(playerId) {
  console.log(`🎉 [FATE] Eureka Moment - Player ${playerId}`);

  // Check if GameMechanics is available
  if (!window.GameMechanics) {
    console.error('❌ [FATE] GameMechanics not available');
    this.showNotification("Error: Game system not ready", 'error');
    return;
  }

  // Get global uncollected ligands
  const uncollected = window.GameMechanics.getGlobalUncollectedLigands();

  if (uncollected.length === 0) {
    console.warn('⚠️ [FATE] All ligands have been discovered!');
    this.showNotification("All ligands have been discovered!", 'info');
    return;
  }

  // Pick random ligand from uncollected pool
  const randomIndex = Math.floor(Math.random() * uncollected.length);
  const ligand = uncollected[randomIndex];

  console.log(`   Selected ligand: ${ligand.name} (${ligand.id})`);

  // Add to player's collection
  if (!gameState.playerLigands[playerId]) {
    gameState.playerLigands[playerId] = [];
  }
  gameState.playerLigands[playerId].push(ligand.id);

  // Mark as collected globally
  if (!gameState.collectedLigandIds.includes(ligand.id)) {
    gameState.collectedLigandIds.push(ligand.id);
  }

  // Save to sessionStorage
  sessionStorage.setItem('game-state', JSON.stringify(gameState));

  // Update ligand display for this player
  const ligandContainer = document.getElementById(`player-${playerId}-ligands`);
  if (ligandContainer) {
    const ligandElement = document.createElement('div');
    ligandElement.className = 'ligand-card inline-block';
    ligandElement.innerHTML = `
      <img src="/cards/ligands/${ligand.id}.png"
           alt="${ligand.name}"
           class="w-12 h-12 sm:w-16 sm:h-16 rounded shadow-sm"
           title="${ligand.name}">
    `;
    ligandContainer.appendChild(ligandElement);
  }

  // Show success notification
  this.showNotification(`🎉 Discovered new ligand: ${ligand.name}!`, 'success');
  console.log(`✅ [FATE] Eureka Moment complete - Player ${playerId} got ${ligand.name}`);
},
```

**Step 3: Test Eureka Moment**

Manual test in browser console:

```javascript
// Check initial state
console.log('Before:', gameState.playerLigands[1]);
console.log('Collected globally:', gameState.collectedLigandIds);

// Apply eureka moment
window.FateEffectHandler.applyEurekaMoment(1);

// Check updated state
console.log('After:', gameState.playerLigands[1]);
console.log('Collected globally:', gameState.collectedLigandIds);
```

Expected:
- Player 1 gets a random uncollected ligand
- Ligand appears in player's collection display
- collectedLigandIds includes the new ligand
- Success notification shows

**Step 4: Test edge case (all ligands collected)**

```javascript
// Simulate all ligands collected
const backup = [...gameState.collectedLigandIds];
gameState.collectedLigandIds = LIGANDS_DATA.map(l => l.id);

// Try eureka moment
window.FateEffectHandler.applyEurekaMoment(1);
// Expected: "All ligands have been discovered!" notification

// Restore
gameState.collectedLigandIds = backup;
```

**Step 5: Commit**

```bash
git add public/scripts/fate-effect-handler.js public/scripts/game-mechanics-cards.js
git commit -m "feat: implement eureka moment fate effect

- Add getGlobalUncollectedLigands() helper to GameMechanics
- Implement applyEurekaMoment() to grant random uncollected ligand
- Handle edge case when all ligands collected
- Update player ligand display and sessionStorage

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Implement Second Chance (Simple Turn Effect)

**Files:**
- Modify: `public/scripts/fate-effect-handler.js:applySecondChance()`

**Step 1: Implement applySecondChance**

Modify: `public/scripts/fate-effect-handler.js:applySecondChance()`

Replace placeholder with:

```javascript
applySecondChance(playerId) {
  console.log(`🎲 [FATE] Second Chance - Player ${playerId}`);

  // Unlock dice to allow immediate extra roll
  if (typeof window.d !== 'undefined') {
    window.d = 0; // 0 = unlocked
    console.log('   Dice unlocked (d = 0)');
  } else {
    console.warn('⚠️ [FATE] Dice lock variable (d) not found');
  }

  // Update turn indicator to show "Roll Again!"
  if (window.TurnIndicator) {
    window.TurnIndicator.update("roll-again");
  }

  // Alternative: Update turn message directly
  const turnMsg = document.getElementById('turn-indicator-message');
  if (turnMsg) {
    turnMsg.innerHTML = `
      <span class="text-lg font-bold">🎲 You get an extra roll!</span>
    `;
  }

  // Show notification
  this.showNotification("🎲 You get an extra roll!", 'success');
  console.log(`✅ [FATE] Second Chance complete - Player ${playerId} can roll again`);
},
```

**Step 2: Test Second Chance**

Manual test in browser console:

```javascript
// Check initial dice state
console.log('Dice lock before:', window.d);

// Apply second chance
window.FateEffectHandler.applySecondChance(1);

// Check updated state
console.log('Dice lock after:', window.d); // Should be 0
```

Expected:
- `window.d` becomes 0 (unlocked)
- Turn indicator shows "You get an extra roll!"
- Player can click dice to roll again immediately

**Step 3: Integration test (full flow)**

Play the game and land on a fate tile:
1. Get "Second Chance" fate card
2. Click "Accept Fate"
3. Dice should unlock immediately
4. Player can roll again without turn passing

**Step 4: Commit**

```bash
git add public/scripts/fate-effect-handler.js
git commit -m "feat: implement second chance fate effect

- Unlock dice (d = 0) for immediate extra roll
- Update turn indicator message
- Allow player to roll again without turn passing

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Implement Ligand Square (Move Forward Effect)

**Files:**
- Modify: `public/scripts/fate-effect-handler.js:applyLigandSquare()`

**Step 1: Implement applyLigandSquare**

Modify: `public/scripts/fate-effect-handler.js:applyLigandSquare()`

Replace placeholder with:

```javascript
applyLigandSquare(playerId, spaces = 3) {
  console.log(`⬆️ [FATE] Ligand Square - Player ${playerId}, move ${spaces} spaces`);

  const playerColor = this.getPlayerColor(playerId);
  const posVar = `lastPos${playerColor}H1`;

  // Get current position
  const currentPos = window[posVar];

  if (typeof currentPos === 'undefined') {
    console.error(`❌ [FATE] Position variable ${posVar} not found`);
    this.showNotification("Error: Cannot find piece position", 'error');
    return;
  }

  console.log(`   Current position: ${currentPos}`);

  // Edge case: Already at finish line
  if (currentPos >= 57) {
    console.warn('⚠️ [FATE] Already at finish line!');
    this.showNotification("Already at the finish line!", 'info');
    return;
  }

  // Calculate new position (max 57)
  const newPos = Math.min(currentPos + spaces, 57);
  const actualMoved = newPos - currentPos;

  console.log(`   New position: ${newPos} (moved ${actualMoved} spaces)`);

  // Update position variable
  window[posVar] = newPos;

  // Move piece visually
  const colorClass = this.getPlayerColorClass(playerId).charAt(0); // 'r', 'b', 'y', 'g'
  const pieceSelector = `.path img.${colorClass}h1`;
  const piece = $(pieceSelector).first();

  if (piece.length === 0) {
    console.warn(`⚠️ [FATE] Piece not found on path: ${pieceSelector}`);
    this.showNotification(`Moved forward ${actualMoved} spaces!`, 'success');
    return;
  }

  // Find target cell
  const targetCell = $(`.${colorClass}${newPos}`).first();

  if (targetCell.length === 0) {
    console.error(`❌ [FATE] Target cell not found: .${colorClass}${newPos}`);
    this.showNotification("Error: Cannot find target position", 'error');
    return;
  }

  // Remove piece from current cell
  piece.remove();

  // Add piece to target cell
  targetCell.append(piece);

  // Show animation if available
  if (window.UIAnimations) {
    window.UIAnimations.movePiece(piece[0]);
  }

  // Check if landed on special tile
  const tileType = window.TileDetector ? window.TileDetector.getTileType(targetCell[0]) : 'normal';
  console.log(`   Landed on ${tileType} tile`);

  // Show notification
  this.showNotification(`⬆️ Moved forward ${actualMoved} spaces!`, 'success');
  console.log(`✅ [FATE] Ligand Square complete - Player ${playerId} moved to position ${newPos}`);

  // If landed on special tile, trigger orchestrator
  if (tileType !== 'normal' && tileType !== 'safe' && window.GameOrchestrator) {
    console.log(`   Triggering orchestrator for ${tileType} tile`);
    setTimeout(() => {
      window.GameOrchestrator.simulateLanding(playerId, `.${colorClass}${newPos}`);
    }, 500); // Small delay for animation
  }
},
```

**Step 2: Test Ligand Square (normal movement)**

Manual test in browser console:

```javascript
// Setup: Put piece at position 10
window.lastPosBH1 = 10;

// Apply ligand square
window.FateEffectHandler.applyLigandSquare(2, 3);

// Check result
console.log('New position:', window.lastPosBH1); // Should be 13
```

Expected:
- Piece moves from position 10 to 13 visually
- Position variable updates to 13
- Notification shows "Moved forward 3 spaces!"

**Step 3: Test edge case (near finish line)**

```javascript
// Setup: Put piece at position 56
window.lastPosBH1 = 56;

// Apply ligand square (should only move 1 to reach 57)
window.FateEffectHandler.applyLigandSquare(2, 3);

// Check result
console.log('New position:', window.lastPosBH1); // Should be 57, not 59
```

Expected:
- Piece moves to exactly position 57
- Notification shows "Moved forward 1 spaces!" (not 3)

**Step 4: Test edge case (already at finish)**

```javascript
// Setup: Already at finish
window.lastPosBH1 = 57;

// Try to move forward
window.FateEffectHandler.applyLigandSquare(2, 3);

// Check result
console.log('Position unchanged:', window.lastPosBH1); // Should still be 57
```

Expected:
- Notification shows "Already at the finish line!"
- Piece doesn't move

**Step 5: Commit**

```bash
git add public/scripts/fate-effect-handler.js
git commit -m "feat: implement ligand square fate effect

- Move piece forward 3 spaces with max position 57
- Update position variable and visual DOM placement
- Handle edge cases: at finish line, near finish line
- Trigger orchestrator if land on special tile

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Implement Destiny Dance (Move Backward Effect)

**Files:**
- Modify: `public/scripts/fate-effect-handler.js:applyDestinyDance()`

**Step 1: Implement applyDestinyDance**

Modify: `public/scripts/fate-effect-handler.js:applyDestinyDance()`

Replace placeholder with:

```javascript
applyDestinyDance(playerId) {
  console.log(`⬇️ [FATE] Destiny Dance - Player ${playerId}`);

  const playerColor = this.getPlayerColor(playerId);
  const posVar = `lastPos${playerColor}H1`;

  // Get current position
  const currentPos = window[posVar];

  if (typeof currentPos === 'undefined') {
    console.error(`❌ [FATE] Position variable ${posVar} not found`);
    this.showNotification("Error: Cannot find piece position", 'error');
    return;
  }

  console.log(`   Current position: ${currentPos}`);

  // Edge case: Piece in home
  if (currentPos === 0) {
    console.warn('⚠️ [FATE] Cannot move backward from home!');
    this.showNotification("Can't move backward from home!", 'info');
    return;
  }

  // Roll dice (1-6)
  const diceRoll = Math.floor(Math.random() * 6) + 1;
  console.log(`   Rolled: ${diceRoll}`);

  // Show dice animation if available
  const diceImg = document.querySelector('.dice_image');
  if (diceImg && window.UIAnimations) {
    window.UIAnimations.rollDice(diceImg, diceRoll);
  } else if (diceImg) {
    // Fallback: just update image
    diceImg.src = `/dice/dice-${diceRoll}.png`;
  }

  // Calculate new position (min 0 = home)
  const newPos = Math.max(currentPos - diceRoll, 0);
  const actualMoved = currentPos - newPos;

  console.log(`   New position: ${newPos} (moved backward ${actualMoved} spaces)`);

  // Update position variable
  window[posVar] = newPos;

  const colorClass = this.getPlayerColorClass(playerId).charAt(0); // 'r', 'b', 'y', 'g'
  const pieceSelector = `.path img.${colorClass}h1`;
  const piece = $(pieceSelector).first();

  // If moving back to home (position 0)
  if (newPos === 0) {
    console.log('   Moving piece back to home area');

    // Remove from path
    if (piece.length > 0) {
      piece.remove();
    }

    // Add back to home area
    const homeArea = $(`#player-${playerId} > table`);
    if (homeArea.length > 0) {
      homeArea.append(piece.length > 0 ? piece : `<img src="/piece-${colorClass}.png" class="${colorClass}h1" alt="Player ${playerId} piece">`);
    }

    this.showNotification(`⬇️ Sent back to home! (rolled ${diceRoll})`, 'error');
    console.log(`✅ [FATE] Destiny Dance complete - Player ${playerId} sent back to home`);
    return;
  }

  // Normal backward movement on path
  if (piece.length === 0) {
    console.warn(`⚠️ [FATE] Piece not found on path: ${pieceSelector}`);
    this.showNotification(`Moved backward ${actualMoved} spaces!`, 'error');
    return;
  }

  // Find target cell
  const targetCell = $(`.${colorClass}${newPos}`).first();

  if (targetCell.length === 0) {
    console.error(`❌ [FATE] Target cell not found: .${colorClass}${newPos}`);
    this.showNotification("Error: Cannot find target position", 'error');
    return;
  }

  // Remove piece from current cell
  piece.remove();

  // Add piece to target cell
  targetCell.append(piece);

  // Show animation if available
  if (window.UIAnimations) {
    window.UIAnimations.movePiece(piece[0]);
  }

  // Show notification
  this.showNotification(`⬇️ Moved backward ${actualMoved} spaces! (rolled ${diceRoll})`, 'error');
  console.log(`✅ [FATE] Destiny Dance complete - Player ${playerId} moved to position ${newPos}`);
},
```

**Step 2: Test Destiny Dance (normal backward movement)**

Manual test in browser console:

```javascript
// Setup: Put piece at position 10
window.lastPosBH1 = 10;

// Apply destiny dance (will roll 1-6)
window.FateEffectHandler.applyDestinyDance(2);

// Check result
console.log('New position:', window.lastPosBH1); // Should be 4-9 (10 minus dice roll)
```

Expected:
- Dice rolls (shows animation)
- Piece moves backward on board
- Position variable decreases
- Notification shows "Moved backward X spaces! (rolled Y)"

**Step 3: Test edge case (sent back to home)**

```javascript
// Setup: Put piece at position 2
window.lastPosBH1 = 2;

// Apply destiny dance (might roll higher than 2)
window.FateEffectHandler.applyDestinyDance(2);

// Check result
console.log('Position:', window.lastPosBH1); // Should be 0 if rolled 2+
```

Expected:
- If dice roll >= 2: piece moves back to home area
- Position becomes 0
- Notification shows "Sent back to home!"

**Step 4: Test edge case (already in home)**

```javascript
// Setup: Piece in home
window.lastPosBH1 = 0;

// Try destiny dance
window.FateEffectHandler.applyDestinyDance(2);

// Check result
console.log('Position unchanged:', window.lastPosBH1); // Should still be 0
```

Expected:
- Notification shows "Can't move backward from home!"
- Piece doesn't move

**Step 5: Commit**

```bash
git add public/scripts/fate-effect-handler.js
git commit -m "feat: implement destiny dance fate effect

- Auto-roll dice (1-6) and move backward
- Send piece back to home if rolls below position 1
- Handle edge case: cannot move backward from home
- Show dice animation and backward movement

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Create Swap Ligand Modal Component

**Files:**
- Create: `src/components/game/swap-ligand-modal.astro`

**Step 1: Create swap ligand modal structure**

Create: `src/components/game/swap-ligand-modal.astro`

```astro
---
---

<div id="swap-ligand-modal" class="fixed inset-0 bg-black/50 hidden items-center justify-center z-50 p-3 sm:p-4">
  <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-6 text-center max-h-[90vh] overflow-y-auto">

    <!-- Step 1: Player Selection -->
    <div id="swap-step-1" class="swap-step">
      <div class="mb-3 sm:mb-4">
        <h2 class="text-xl sm:text-2xl font-bold text-gray-800 mb-2">🔄 Swap Ligand</h2>
        <p class="text-sm sm:text-base text-gray-600">Choose a player to swap ligands with:</p>
      </div>

      <div id="player-selection" class="space-y-2 mb-4">
        <!-- Player buttons will be inserted here -->
      </div>

      <button id="cancel-swap-btn" class="w-full bg-gray-400 hover:bg-gray-500 text-white font-bold py-2.5 sm:py-3 rounded-lg transition-colors text-sm sm:text-base">
        Cancel
      </button>
    </div>

    <!-- Step 2: Ligand Selection -->
    <div id="swap-step-2" class="swap-step hidden">
      <div class="mb-3 sm:mb-4">
        <h2 class="text-xl sm:text-2xl font-bold text-gray-800 mb-2">🔄 Select Ligands</h2>
        <p class="text-sm sm:text-base text-gray-600" id="swap-instruction">Select ligands to swap:</p>
      </div>

      <!-- Current Player's Ligands -->
      <div class="mb-4">
        <h3 class="font-bold mb-2 text-sm">Your Ligands:</h3>
        <div id="current-player-ligands" class="flex flex-wrap gap-2 justify-center min-h-[80px] border-2 border-dashed border-gray-300 rounded-lg p-2">
          <!-- Current player's ligands will be inserted here -->
        </div>
      </div>

      <!-- Target Player's Ligands -->
      <div class="mb-4">
        <h3 class="font-bold mb-2 text-sm" id="target-player-label">Their Ligands:</h3>
        <div id="target-player-ligands" class="flex flex-wrap gap-2 justify-center min-h-[80px] border-2 border-dashed border-gray-300 rounded-lg p-2">
          <!-- Target player's ligands will be inserted here -->
        </div>
      </div>

      <div class="flex gap-2">
        <button id="back-to-selection-btn" class="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-2.5 rounded-lg transition-colors text-sm sm:text-base">
          ← Back
        </button>
        <button id="confirm-swap-btn" class="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 rounded-lg transition-colors text-sm sm:text-base" disabled>
          Confirm Swap
        </button>
      </div>
    </div>

  </div>
</div>

<script>
  const swapModal = document.getElementById("swap-ligand-modal");
  const step1 = document.getElementById("swap-step-1");
  const step2 = document.getElementById("swap-step-2");
  const cancelBtn = document.getElementById("cancel-swap-btn");
  const backBtn = document.getElementById("back-to-selection-btn");
  const confirmBtn = document.getElementById("confirm-swap-btn");

  let currentSwapData = {
    currentPlayerId: null,
    targetPlayerId: null,
    currentPlayerSelectedLigand: null,
    targetPlayerSelectedLigand: null
  };

  // Cancel swap
  cancelBtn?.addEventListener("click", () => {
    closeSwapModal();
    // Resume game (dispatch event to continue from fate modal)
    document.dispatchEvent(new Event("swap-cancelled"));
  });

  // Back to player selection
  backBtn?.addEventListener("click", () => {
    step2?.classList.add("hidden");
    step1?.classList.remove("hidden");
    currentSwapData.targetPlayerId = null;
    currentSwapData.currentPlayerSelectedLigand = null;
    currentSwapData.targetPlayerSelectedLigand = null;
  });

  // Confirm swap
  confirmBtn?.addEventListener("click", () => {
    if (window.FateEffectHandler) {
      window.FateEffectHandler.executeSwap(currentSwapData);
    }
    closeSwapModal();
  });

  function closeSwapModal() {
    if (swapModal) {
      swapModal.classList.add("hidden");
      swapModal.classList.remove("flex");
    }
    // Reset to step 1
    step2?.classList.add("hidden");
    step1?.classList.remove("hidden");
    currentSwapData = {
      currentPlayerId: null,
      targetPlayerId: null,
      currentPlayerSelectedLigand: null,
      targetPlayerSelectedLigand: null
    };
  }

  // Expose modal controls
  window.SwapLigandModal = {
    show: (currentPlayerId) => {
      currentSwapData.currentPlayerId = currentPlayerId;
      swapModal?.classList.remove("hidden");
      swapModal?.classList.add("flex");
    },
    showPlayerSelection: (players) => {
      const container = document.getElementById("player-selection");
      if (!container) return;

      container.innerHTML = players.map(p => `
        <button class="player-select-btn w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition-colors"
                data-player-id="${p.id}">
          Player ${p.id} (${p.ligandCount} ligands)
        </button>
      `).join('');

      // Add click handlers
      container.querySelectorAll('.player-select-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const targetId = parseInt(btn.dataset.playerId);
          window.SwapLigandModal.showLigandSelection(targetId);
        });
      });
    },
    showLigandSelection: (targetPlayerId) => {
      currentSwapData.targetPlayerId = targetPlayerId;
      step1?.classList.add("hidden");
      step2?.classList.remove("hidden");

      // Populate ligands (will be done by FateEffectHandler)
      if (window.FateEffectHandler) {
        window.FateEffectHandler.populateSwapLigands(currentSwapData.currentPlayerId, targetPlayerId);
      }
    },
    updateSelection: (selectedData) => {
      currentSwapData = { ...currentSwapData, ...selectedData };

      // Enable confirm button only if both selected (or one-way donation scenario)
      const canConfirm = currentSwapData.currentPlayerSelectedLigand &&
                         (currentSwapData.targetPlayerSelectedLigand || selectedData.isOneWayDonation);
      if (confirmBtn) {
        confirmBtn.disabled = !canConfirm;
      }
    },
    close: closeSwapModal
  };

  console.log('✅ Swap Ligand Modal loaded');
</script>

<style>
  .swap-step {
    transition: opacity 0.3s ease;
  }

  #current-player-ligands img,
  #target-player-ligands img {
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  #current-player-ligands img:hover,
  #target-player-ligands img:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  #current-player-ligands img.selected,
  #target-player-ligands img.selected {
    border: 3px solid #10b981;
    box-shadow: 0 0 12px rgba(16, 185, 129, 0.5);
  }
</style>
```

**Step 2: Add modal to game board**

Modify: `src/components/game/game-board.astro`

Add import at the top (around line 10):

```astro
import SwapLigandModal from "./swap-ligand-modal.astro";
```

Add component before closing `</div>` (around line 180):

```astro
<SwapLigandModal />
```

**Step 3: Test modal appearance**

Manual test in browser console:

```javascript
// Show modal
window.SwapLigandModal.show(1);

// Should display modal with player selection step
```

Expected: Modal appears with "Choose a player to swap ligands with" heading

**Step 4: Commit**

```bash
git add src/components/game/swap-ligand-modal.astro src/components/game/game-board.astro
git commit -m "feat: create swap ligand modal component

- Two-step modal: player selection → ligand selection
- Support for one-way donation scenario
- Visual feedback for selected ligands
- Cancel and back navigation

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Implement Swap Card Logic

**Files:**
- Modify: `public/scripts/fate-effect-handler.js:applySwapCard()`

**Step 1: Implement applySwapCard - player selection**

Modify: `public/scripts/fate-effect-handler.js:applySwapCard()`

Replace placeholder with:

```javascript
applySwapCard(playerId) {
  console.log(`🔄 [FATE] Swap Card - Player ${playerId}`);

  // Check if current player has ligands
  const currentPlayerLigands = gameState.playerLigands[playerId] || [];

  if (currentPlayerLigands.length === 0) {
    console.warn('⚠️ [FATE] Player has no ligands to swap');
    this.showNotification("You have no ligands to swap!", 'info');
    return;
  }

  // Get other players with their ligand counts
  const otherPlayers = [];
  for (let i = 1; i <= 4; i++) {
    if (i !== playerId) {
      const ligandCount = (gameState.playerLigands[i] || []).length;
      otherPlayers.push({ id: i, ligandCount });
    }
  }

  // Check if any other player has ligands
  const hasPlayersWithLigands = otherPlayers.some(p => p.ligandCount > 0);

  if (!hasPlayersWithLigands) {
    console.warn('⚠️ [FATE] No other players have ligands to swap with');
    this.showNotification("No players have ligands to swap with!", 'info');
    return;
  }

  // Show swap modal
  if (window.SwapLigandModal) {
    window.SwapLigandModal.show(playerId);
    window.SwapLigandModal.showPlayerSelection(otherPlayers);
  } else {
    console.error('❌ [FATE] SwapLigandModal not available');
    this.showNotification("Error: Swap modal not available", 'error');
  }
},
```

**Step 2: Implement populateSwapLigands - ligand display**

Add new method to `FateEffectHandler`:

```javascript
/**
 * Populate ligands for swap selection
 * @param {number} currentPlayerId - Current player
 * @param {number} targetPlayerId - Target player
 */
populateSwapLigands(currentPlayerId, targetPlayerId) {
  console.log(`🔄 [FATE] Populating swap ligands: Player ${currentPlayerId} ↔ Player ${targetPlayerId}`);

  const currentLigands = gameState.playerLigands[currentPlayerId] || [];
  const targetLigands = gameState.playerLigands[targetPlayerId] || [];

  console.log(`   Current player ligands:`, currentLigands);
  console.log(`   Target player ligands:`, targetLigands);

  const currentContainer = document.getElementById('current-player-ligands');
  const targetContainer = document.getElementById('target-player-ligands');
  const instructionEl = document.getElementById('swap-instruction');
  const targetLabel = document.getElementById('target-player-label');

  if (!currentContainer || !targetContainer) {
    console.error('❌ [FATE] Ligand containers not found');
    return;
  }

  // Check for one-way donation scenario
  const isOneWayDonation = targetLigands.length === 0;

  if (isOneWayDonation) {
    // One-way donation: current player gives to target player
    instructionEl.textContent = `Player ${targetPlayerId} has no ligands. Choose one to give:`;
    targetLabel.textContent = `Player ${targetPlayerId} will receive:`;
    targetContainer.innerHTML = `<p class="text-gray-400 text-sm">No ligands yet</p>`;
  } else {
    // Normal swap: both select
    instructionEl.textContent = `Click one ligand from each side to swap:`;
    targetLabel.textContent = `Player ${targetPlayerId}'s Ligands:`;
  }

  // Populate current player's ligands
  currentContainer.innerHTML = currentLigands.map(ligandId => {
    const ligand = LIGANDS_DATA.find(l => l.id === ligandId);
    return `
      <img src="/cards/ligands/${ligandId}.png"
           alt="${ligand?.name || ligandId}"
           class="w-16 h-16 sm:w-20 sm:h-20 rounded shadow-sm ligand-selectable"
           data-ligand-id="${ligandId}"
           data-player-id="${currentPlayerId}"
           title="${ligand?.name || ligandId}">
    `;
  }).join('');

  // Populate target player's ligands (if not one-way)
  if (!isOneWayDonation) {
    targetContainer.innerHTML = targetLigands.map(ligandId => {
      const ligand = LIGANDS_DATA.find(l => l.id === ligandId);
      return `
        <img src="/cards/ligands/${ligandId}.png"
             alt="${ligand?.name || ligandId}"
             class="w-16 h-16 sm:w-20 sm:h-20 rounded shadow-sm ligand-selectable"
             data-ligand-id="${ligandId}"
             data-player-id="${targetPlayerId}"
             title="${ligand?.name || ligandId}">
      `;
    }).join('');
  }

  // Add click handlers
  const selectableLigands = document.querySelectorAll('.ligand-selectable');
  selectableLigands.forEach(img => {
    img.addEventListener('click', () => {
      const ligandId = img.dataset.ligandId;
      const ownerId = parseInt(img.dataset.playerId);

      // Remove previous selection from same player
      const container = ownerId === currentPlayerId ? currentContainer : targetContainer;
      container.querySelectorAll('img').forEach(i => i.classList.remove('selected'));

      // Add selection
      img.classList.add('selected');

      // Update swap data
      if (ownerId === currentPlayerId) {
        window.SwapLigandModal.updateSelection({
          currentPlayerSelectedLigand: ligandId,
          isOneWayDonation
        });
      } else {
        window.SwapLigandModal.updateSelection({
          targetPlayerSelectedLigand: ligandId
        });
      }
    });
  });

  console.log(`✅ [FATE] Swap ligands populated`);
},
```

**Step 3: Implement executeSwap - perform the swap**

Add new method to `FateEffectHandler`:

```javascript
/**
 * Execute the ligand swap
 * @param {Object} swapData - { currentPlayerId, targetPlayerId, currentPlayerSelectedLigand, targetPlayerSelectedLigand, isOneWayDonation }
 */
executeSwap(swapData) {
  console.log(`🔄 [FATE] Executing swap:`, swapData);

  const { currentPlayerId, targetPlayerId, currentPlayerSelectedLigand, targetPlayerSelectedLigand, isOneWayDonation } = swapData;

  // Validation
  if (!currentPlayerSelectedLigand) {
    console.error('❌ [FATE] No ligand selected from current player');
    return;
  }

  if (!isOneWayDonation && !targetPlayerSelectedLigand) {
    console.error('❌ [FATE] No ligand selected from target player');
    return;
  }

  // Get ligand arrays
  const currentLigands = gameState.playerLigands[currentPlayerId] || [];
  const targetLigands = gameState.playerLigands[targetPlayerId] || [];

  if (isOneWayDonation) {
    // One-way donation: current gives to target
    console.log(`   One-way donation: Player ${currentPlayerId} gives ${currentPlayerSelectedLigand} to Player ${targetPlayerId}`);

    // Remove from current player
    const currentIndex = currentLigands.indexOf(currentPlayerSelectedLigand);
    if (currentIndex > -1) {
      currentLigands.splice(currentIndex, 1);
    }

    // Add to target player
    targetLigands.push(currentPlayerSelectedLigand);

  } else {
    // Normal swap: exchange ligands
    console.log(`   Swapping: Player ${currentPlayerId}'s ${currentPlayerSelectedLigand} ↔ Player ${targetPlayerId}'s ${targetPlayerSelectedLigand}`);

    // Remove from respective players
    const currentIndex = currentLigands.indexOf(currentPlayerSelectedLigand);
    const targetIndex = targetLigands.indexOf(targetPlayerSelectedLigand);

    if (currentIndex > -1) {
      currentLigands.splice(currentIndex, 1);
    }
    if (targetIndex > -1) {
      targetLigands.splice(targetIndex, 1);
    }

    // Add to opposite players
    currentLigands.push(targetPlayerSelectedLigand);
    targetLigands.push(currentPlayerSelectedLigand);
  }

  // Update gameState
  gameState.playerLigands[currentPlayerId] = currentLigands;
  gameState.playerLigands[targetPlayerId] = targetLigands;

  // Save to sessionStorage
  sessionStorage.setItem('game-state', JSON.stringify(gameState));

  // Update visual displays
  this.updateLigandDisplay(currentPlayerId);
  this.updateLigandDisplay(targetPlayerId);

  // Show notification
  if (isOneWayDonation) {
    this.showNotification(`✅ Gave ligand to Player ${targetPlayerId}!`, 'success');
  } else {
    this.showNotification(`✅ Swapped ligands with Player ${targetPlayerId}!`, 'success');
  }

  console.log(`✅ [FATE] Swap complete`);

  // Dispatch event to continue game
  document.dispatchEvent(new Event("swap-complete"));
},

/**
 * Update ligand display for a player
 * @param {number} playerId - Player ID
 */
updateLigandDisplay(playerId) {
  const container = document.getElementById(`player-${playerId}-ligands`);
  if (!container) {
    console.warn(`⚠️ [FATE] Ligand container not found for Player ${playerId}`);
    return;
  }

  const ligands = gameState.playerLigands[playerId] || [];

  container.innerHTML = ligands.map(ligandId => {
    const ligand = LIGANDS_DATA.find(l => l.id === ligandId);
    return `
      <div class="ligand-card inline-block">
        <img src="/cards/ligands/${ligandId}.png"
             alt="${ligand?.name || ligandId}"
             class="w-12 h-12 sm:w-16 sm:h-16 rounded shadow-sm"
             title="${ligand?.name || ligandId}">
      </div>
    `;
  }).join('');
},
```

**Step 4: Handle swap-complete event in fate modal**

Modify: `src/components/game/fate-modal.astro`

Add event listener after the existing event listeners (around line 48):

```javascript
// Listen for swap completion
document.addEventListener("swap-complete", () => {
  console.log("🔄 [FATE] Swap complete - continuing game");
  document.dispatchEvent(new Event("fate-continue"));
});

// Listen for swap cancellation
document.addEventListener("swap-cancelled", () => {
  console.log("❌ [FATE] Swap cancelled - continuing game");
  document.dispatchEvent(new Event("fate-continue"));
});
```

**Step 5: Test swap card (normal swap)**

Manual test:

1. Give Player 1 some ligands: `gameState.playerLigands[1] = ['ligand-1', 'ligand-2']`
2. Give Player 2 some ligands: `gameState.playerLigands[2] = ['ligand-3', 'ligand-4']`
3. Trigger swap: `window.FateEffectHandler.applySwapCard(1)`
4. Select Player 2
5. Click one ligand from each side
6. Click "Confirm Swap"

Expected:
- Ligands swap between players
- Both displays update
- Notification shows "Swapped ligands with Player 2!"

**Step 6: Test one-way donation**

Manual test:

1. Give Player 1 ligands: `gameState.playerLigands[1] = ['ligand-1', 'ligand-2']`
2. Clear Player 2 ligands: `gameState.playerLigands[2] = []`
3. Trigger swap: `window.FateEffectHandler.applySwapCard(1)`
4. Select Player 2
5. Click one ligand from Player 1's side
6. Click "Confirm Swap"

Expected:
- Message says "Player 2 has no ligands. Choose one to give:"
- Selected ligand moves to Player 2
- Notification shows "Gave ligand to Player 2!"

**Step 7: Commit**

```bash
git add public/scripts/fate-effect-handler.js src/components/game/fate-modal.astro
git commit -m "feat: implement swap card fate effect

- Check player ligand counts before showing modal
- Populate ligands for selection (current vs target)
- Handle one-way donation when target has no ligands
- Execute swap and update both players' displays
- Handle swap-complete and swap-cancelled events

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Integration Testing & Bug Fixes

**Files:**
- Test all fate effects end-to-end
- Fix any bugs discovered

**Step 1: Test complete flow for each effect**

Test each fate effect through the full game flow:

1. **Eureka Moment:**
   - Play game until landing on fate tile
   - Get "Eureka Moment" fate card
   - Click "Accept Fate"
   - Verify: new ligand appears in collection
   - Verify: global collectedLigandIds updated

2. **Second Chance:**
   - Get "Second Chance" fate card
   - Click "Accept Fate"
   - Verify: dice unlocks immediately
   - Verify: can roll again
   - Verify: turn doesn't pass to next player

3. **Ligand Square:**
   - Note current position (e.g., position 10)
   - Get "Ligand Square" fate card
   - Click "Accept Fate"
   - Verify: piece moves forward 3 spaces visually
   - Verify: position variable updated (e.g., 13)
   - Verify: if lands on special tile, modal appears

4. **Destiny Dance:**
   - Note current position (e.g., position 15)
   - Get "Destiny Dance" fate card
   - Click "Accept Fate"
   - Verify: dice rolls automatically
   - Verify: piece moves backward by dice value
   - Verify: notification shows correct distance

5. **Swap Card:**
   - Ensure Player 1 has 2+ ligands
   - Ensure another player has ligands
   - Get "Swap Card" fate card
   - Click "Accept Fate"
   - Verify: swap modal appears
   - Select player, select ligands, confirm
   - Verify: ligands swap correctly
   - Verify: both displays update

**Step 2: Test edge cases**

Test edge cases for each effect:

1. **Eureka Moment:**
   - All 13 ligands collected → shows "all discovered" message

2. **Ligand Square:**
   - At position 56 → moves to 57 only
   - At position 57 → shows "already at finish" message

3. **Destiny Dance:**
   - At position 2, rolls 5 → goes back to home
   - At position 0 (home) → shows "can't move backward" message

4. **Swap Card:**
   - Current player has 0 ligands → shows "no ligands to swap" message
   - All other players have 0 ligands → shows "no one to swap with" message
   - Target has 0 ligands → one-way donation flow works

**Step 3: Document any bugs found**

Create a checklist of bugs to fix:

```markdown
## Bugs Found During Testing

- [ ] Bug 1: [Description]
  - Fix: [Solution]
- [ ] Bug 2: [Description]
  - Fix: [Solution]
```

**Step 4: Fix critical bugs**

Fix any critical bugs that prevent fate effects from working.

**Step 5: Commit bug fixes**

```bash
git add [modified files]
git commit -m "fix: resolve fate card integration issues

[List of fixes]

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Update Memory Documentation

**Files:**
- Modify: `/Users/hakas/.claude/projects/-Applications-XAMPP-xamppfiles-htdocs-client-project-complex-chem/memory/MEMORY.md`

**Step 1: Add fate cards section to memory**

Add new section to MEMORY.md after the existing content:

```markdown
## Fate Card Mechanics (2026-03-26) ✅

All 5 interactive fate effects implemented:

### Implemented Effects
1. **swap-card** ✅ - Swap ligand with another player (supports one-way donation)
2. **eureka-moment** ✅ - Grant random ligand from global uncollected pool
3. **ligand-square** ✅ - Move forward 3 spaces (max position 57)
4. **second-chance** ✅ - Immediate extra roll (dice unlocks, turn stays)
5. **destiny-dance** ✅ - Roll dice and move backward (can send to home)

### Architecture
- **FateEffectHandler** class in `public/scripts/fate-effect-handler.js`
- **swap-ligand-modal.astro** for interactive player/ligand selection
- Integrated with `fate-modal.astro` via `applyEffect()` method

### Key Files
- `public/scripts/fate-effect-handler.js` - Main handler (5 effect methods)
- `src/components/game/swap-ligand-modal.astro` - Swap UI
- `src/components/game/fate-modal.astro` - Integration point
- `public/scripts/game-mechanics-cards.js` - Added `getGlobalUncollectedLigands()`

### Design Pattern
Similar to existing game systems (`GameMechanics`, `TileDetector`, `TurnManager`):
- Global window object with methods
- Event-driven architecture
- sessionStorage persistence
- Reuses existing movement/animation logic
```

**Step 2: Commit memory update**

```bash
git add /Users/hakas/.claude/projects/-Applications-XAMPP-xamppfiles-htdocs-client-project-complex-chem/memory/MEMORY.md
git commit -m "docs: update memory with fate card mechanics

Document all 5 implemented fate effects and architecture

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 10: Final Verification & Cleanup

**Files:**
- All modified files

**Step 1: Run final smoke test**

Test each fate effect one more time to ensure everything works:

1. Eureka Moment ✓
2. Second Chance ✓
3. Ligand Square ✓
4. Destiny Dance ✓
5. Swap Card ✓

**Step 2: Check console for errors**

Play through a full game and check browser console for:
- No JavaScript errors
- No missing file warnings
- All fate effects log correctly

**Step 3: Verify sessionStorage persistence**

1. Collect some ligands
2. Apply eureka moment or swap card
3. Refresh page
4. Verify ligands persisted correctly

**Step 4: Code cleanup**

Remove any:
- Console.log statements that are too verbose (keep important ones)
- Commented-out code
- Unused variables

**Step 5: Final commit**

```bash
git add .
git commit -m "chore: final cleanup for fate card mechanics

- Remove verbose console logs
- Clean up commented code
- Verify all effects working correctly

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Success Criteria Checklist

Implementation is complete when:

- [x] **Task 1:** FateEffectHandler core created and integrated
- [x] **Task 2:** Eureka Moment grants random uncollected ligand
- [x] **Task 3:** Second Chance unlocks dice for extra roll
- [x] **Task 4:** Ligand Square moves piece forward 3 spaces (max 57)
- [x] **Task 5:** Destiny Dance rolls and moves backward (can send home)
- [x] **Task 6:** Swap Ligand Modal created with two-step UI
- [x] **Task 7:** Swap Card logic handles normal swap + one-way donation
- [x] **Task 8:** All integration tests pass, bugs fixed
- [x] **Task 9:** Memory documentation updated
- [x] **Task 10:** Final verification complete

---

## Notes for Implementation

**Testing Strategy:**
- Test each effect independently first (using console commands)
- Then test through full game flow
- Always test edge cases (no ligands, at finish line, etc.)

**Common Pitfalls:**
- Position variables: Use `lastPos${COLOR}H1` pattern correctly
- Piece selectors: Use `.${color}h1` class format
- sessionStorage: Always save after state changes
- Modal events: Ensure `fate-continue` dispatched to resume game

**Performance:**
- All effects execute quickly (<100ms)
- No blocking operations
- Animations enhance UX without slowing gameplay

**References:**
- Design doc: `docs/plans/2026-03-26-fate-cards-design.md`
- Architecture: `/Users/hakas/.claude/projects/.../memory/hakasai.md`
- Existing patterns: `auto-move-piece.js`, `game-mechanics-cards.js`
