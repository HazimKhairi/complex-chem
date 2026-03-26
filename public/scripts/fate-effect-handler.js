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
