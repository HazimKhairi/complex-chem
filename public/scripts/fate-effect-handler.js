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

  applyLigandSquare(playerId, spaces) {
    console.log(`⬆️ [FATE] Ligand Square - Not yet implemented`);
    this.showNotification("Ligand Square feature coming soon!", 'info');
  },

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
  }
};

// Auto-initialize
if (typeof window !== 'undefined') {
  console.log('✅ Fate Effect Handler loaded');
}
