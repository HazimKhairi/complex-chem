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

      case 'karma-kickback':
        this.applyKarmaKickback(playerId);
        break;

      case 'twist-fate':
        this.applyTwistFate(playerId);
        break;

      case 'generous-gesture':
        this.applyGenerousGesture(playerId);
        break;

      default:
        console.warn(`[FATE] Unknown fate effect: ${fateEffect}`);
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
    console.log(`🔄 [FATE] Swap Card - Player ${playerId}`);

    // Check if current player has ligands
    const currentPlayerLigands = gameState.playerLigands[playerId] || [];

    if (currentPlayerLigands.length === 0) {
      console.warn('⚠️ [FATE] Player has no ligands to swap');
      console.log('▶ [FATE] You have no ligands to swap!');

      // Show notification (for toast if available)
      this.showNotification("You have no ligands to swap!", 'info');

      // Show visible modal to ensure user sees the message
      if (window.InfoModal) {
        window.InfoModal.showWarning(
          'Cannot Swap Ligands',
          'You don\'t have any ligands to swap!\n\nCollect ligands by landing on ligand tiles first.',
          () => {
            // On close, emit event to continue game
            console.log('📢 [FATE] User dismissed no-ligands warning, continuing game');
            document.dispatchEvent(new CustomEvent('swap-cancelled', {
              detail: { playerId, reason: 'no-ligands' }
            }));
          }
        );
      } else {
        // Fallback: browser alert
        console.warn('⚠️ [FATE] InfoModal not available, using alert fallback');
        alert('Cannot Swap Ligands\n\nYou don\'t have any ligands to swap!\n\nCollect ligands by landing on ligand tiles first.');

        // Continue game after alert dismissal
        document.dispatchEvent(new CustomEvent('swap-cancelled', {
          detail: { playerId, reason: 'no-ligands' }
        }));
      }

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
      console.log('▶ [FATE] No other players have ligands to swap with!');

      // Show notification (for toast if available)
      this.showNotification("No players have ligands to swap with!", 'info');

      // Show visible modal to ensure user sees the message
      if (window.InfoModal) {
        window.InfoModal.showWarning(
          'Cannot Swap Ligands',
          'No other players have ligands to swap with!\n\nYou need to wait for other players to collect ligands first.',
          () => {
            // On close, emit event to continue game
            console.log('📢 [FATE] User dismissed no-other-ligands warning, continuing game');
            document.dispatchEvent(new CustomEvent('swap-cancelled', {
              detail: { playerId, reason: 'no-other-ligands' }
            }));
          }
        );
      } else {
        // Fallback: browser alert
        console.warn('⚠️ [FATE] InfoModal not available, using alert fallback');
        alert('Cannot Swap Ligands\n\nNo other players have ligands to swap with!\n\nYou need to wait for other players to collect ligands first.');

        // Continue game after alert dismissal
        document.dispatchEvent(new CustomEvent('swap-cancelled', {
          detail: { playerId, reason: 'no-other-ligands' }
        }));
      }

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

    // Add to player's collection (store full ligand object to match game-mechanics-cards.js)
    if (!gameState.playerLigands[playerId]) {
      gameState.playerLigands[playerId] = [];
    }
    gameState.playerLigands[playerId].push(ligand);

    // Mark as collected globally
    if (!gameState.collectedLigandIds.includes(ligand.id)) {
      gameState.collectedLigandIds.push(ligand.id);
    }

    // Save to sessionStorage
    sessionStorage.setItem('game-state', JSON.stringify(gameState));

    // Update ligand display for this player
    this.updateLigandDisplay(playerId);

    // Show success notification
    this.showNotification(`Discovered new ligand: ${ligand.name}!`, 'success');
    console.log(`✅ [FATE] Eureka Moment complete - Player ${playerId} got ${ligand.name}`);
  },

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

    // Detach piece from current cell (preserves element for re-attachment)
    const detachedPiece = piece.detach();

    // Append piece to target cell
    targetCell.append(detachedPiece);
    console.log(`   Piece moved to target cell`);

    // Show animation if available
    if (window.UIAnimations) {
      window.UIAnimations.movePiece(piece[0]);
    }

    // Check if landed on special tile
    const tileType = window.TileDetector ? window.TileDetector.getTileType(targetCell[0]) : 'normal';
    console.log(`   Landed on ${tileType} tile`);

    // Show notification
    this.showNotification(`Moved forward ${actualMoved} spaces!`, 'success');
    console.log(`✅ [FATE] Ligand Square complete - Player ${playerId} moved to position ${newPos}`);

    // If landed on special tile, trigger orchestrator
    if (tileType !== 'normal' && tileType !== 'safe' && window.GameOrchestrator) {
      console.log(`   Triggering orchestrator for ${tileType} tile`);
      setTimeout(() => {
        window.GameOrchestrator.simulateLanding(playerId, `.${colorClass}${newPos}`);
      }, 500); // Small delay for animation
    }
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
        <span class="text-lg font-bold">You get an extra roll!</span>
      `;
    }

    // Show notification
    this.showNotification("You get an extra roll!", 'success');
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

      // Use detach() instead of remove() to preserve element
      let detachedPiece = piece.length > 0 ? piece.detach() : null;

      // Add back to home area - correct selector for single piece mode
      // Home structure: #player-N > div > div > img
      const homeArea = $(`#player-${playerId}`);
      const homeInner = homeArea.find('.bg-gray-200'); // Find innermost circle div

      if (homeInner.length > 0) {
        // Append detached piece or create new one
        if (detachedPiece && detachedPiece.length > 0) {
          homeInner.append(detachedPiece);
          console.log('   Reattached piece to home');
        } else {
          // Create new piece if original was lost
          const playerColor = this.getPlayerColorClass(playerId);
          homeInner.append(`<img class="${colorClass}h1 w-4" src="/horses/${playerColor}.png" alt="Player ${playerId} piece" />`);
          console.log('   Created new piece in home');
        }
      } else {
        console.error(`❌ [FATE] Home area not found for Player ${playerId}`);
      }

      this.showNotification(`Sent back to home! (rolled ${diceRoll})`, 'error');
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

    // Detach piece from current cell (preserves element for re-attachment)
    const detachedPiece = piece.detach();

    // Append piece to target cell
    targetCell.append(detachedPiece);
    console.log(`   Piece moved to target cell`);

    // Show animation if available
    if (window.UIAnimations) {
      window.UIAnimations.movePiece(piece[0]);
    }

    // Show notification
    this.showNotification(`Moved backward ${actualMoved} spaces! (rolled ${diceRoll})`, 'error');
    console.log(`✅ [FATE] Destiny Dance complete - Player ${playerId} moved to position ${newPos}`);
  },

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
    currentContainer.innerHTML = currentLigands.map(ligandItem => {
      // Handle both ligand objects and IDs
      const ligandId = typeof ligandItem === 'string' ? ligandItem : ligandItem.id;
      const ligand = typeof ligandItem === 'string'
        ? LIGANDS_DATA.find(l => l.id === ligandId)
        : ligandItem;

      return `
        <img src="/assets/ligand-cards/${ligand?.imageFile || ligandId + '.png'}"
             alt="${ligand?.name || ligandId}"
             class="w-16 h-16 sm:w-20 sm:h-20 rounded shadow-sm ligand-selectable"
             data-ligand-id="${ligandId}"
             data-player-id="${currentPlayerId}"
             title="${ligand?.name || ligandId}">
      `;
    }).join('');

    // Populate target player's ligands (if not one-way)
    if (!isOneWayDonation) {
      targetContainer.innerHTML = targetLigands.map(ligandItem => {
        // Handle both ligand objects and IDs
        const ligandId = typeof ligandItem === 'string' ? ligandItem : ligandItem.id;
        const ligand = typeof ligandItem === 'string'
          ? LIGANDS_DATA.find(l => l.id === ligandId)
          : ligandItem;

        return `
          <img src="/assets/ligand-cards/${ligand?.imageFile || ligandId + '.png'}"
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

      // Find the ligand object to swap (handle both ID strings and objects)
      const currentIndex = currentLigands.findIndex(l =>
        (typeof l === 'string' ? l : l.id) === currentPlayerSelectedLigand
      );

      if (currentIndex > -1) {
        const ligandToGive = currentLigands[currentIndex];
        currentLigands.splice(currentIndex, 1);
        targetLigands.push(ligandToGive);
      }

    } else {
      // Normal swap: exchange ligands
      console.log(`   Swapping: Player ${currentPlayerId}'s ${currentPlayerSelectedLigand} ↔ Player ${targetPlayerId}'s ${targetPlayerSelectedLigand}`);

      // Find ligands to swap (handle both ID strings and objects)
      const currentIndex = currentLigands.findIndex(l =>
        (typeof l === 'string' ? l : l.id) === currentPlayerSelectedLigand
      );
      const targetIndex = targetLigands.findIndex(l =>
        (typeof l === 'string' ? l : l.id) === targetPlayerSelectedLigand
      );

      if (currentIndex > -1 && targetIndex > -1) {
        const currentLigand = currentLigands[currentIndex];
        const targetLigand = targetLigands[targetIndex];

        // Remove from respective players
        currentLigands.splice(currentIndex, 1);
        targetLigands.splice(targetIndex, 1);

        // Add to opposite players
        currentLigands.push(targetLigand);
        targetLigands.push(currentLigand);
      }
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
      this.showNotification(`Gave ligand to Player ${targetPlayerId}!`, 'success');
    } else {
      this.showNotification(`Swapped ligands with Player ${targetPlayerId}!`, 'success');
    }

    console.log(`✅ [FATE] Swap complete`);

    // Dispatch event to continue game
    document.dispatchEvent(new Event("swap-complete"));
  },

  /**
   * Karma Kickback — return one ligand card back (removed from inventory)
   */
  applyKarmaKickback(playerId) {
    console.log(`[FATE] Karma Kickback for Player ${playerId}`);
    const ligands = gameState.playerLigands[playerId] || [];

    if (ligands.length === 0) {
      this.showNotification('No ligands to return!', 'info');
      return;
    }

    // Remove a random ligand
    const removedIndex = Math.floor(Math.random() * ligands.length);
    const removed = ligands.splice(removedIndex, 1)[0];

    // Also remove from collectedLigandIds so it can be collected again
    const collectedIdx = gameState.collectedLigandIds.indexOf(removed.id);
    if (collectedIdx > -1) gameState.collectedLigandIds.splice(collectedIdx, 1);

    sessionStorage.setItem('game-state', JSON.stringify(gameState));
    this.updateLigandDisplay(playerId);
    if (window.GameMechanics) window.GameMechanics.updateAllLigandDisplays?.();

    this.showNotification(`Returned ${removed.name} back!`, 'error');
  },

  /**
   * Twist of Fate — exchange one ligand with the previous player
   */
  applyTwistFate(playerId) {
    console.log(`[FATE] Twist of Fate for Player ${playerId}`);
    const ligands = gameState.playerLigands[playerId] || [];

    if (ligands.length === 0) {
      this.showNotification('No ligands to exchange!', 'info');
      return;
    }

    // Find previous player (active players only)
    const activePlayers = window.TurnManager ? window.TurnManager.getActivePlayers() : [1, 2, 3, 4];
    const currentIdx = activePlayers.indexOf(playerId);
    const prevIdx = (currentIdx - 1 + activePlayers.length) % activePlayers.length;
    const prevPlayerId = activePlayers[prevIdx];
    const prevLigands = gameState.playerLigands[prevPlayerId] || [];

    if (prevLigands.length === 0) {
      // One-way: give one ligand to previous player
      const givenIndex = Math.floor(Math.random() * ligands.length);
      const given = ligands.splice(givenIndex, 1)[0];
      prevLigands.push(given);
      this.showNotification(`Gave ${given.name} to Player ${prevPlayerId}!`, 'info');
    } else {
      // Swap random ligands between current and previous
      const myIdx = Math.floor(Math.random() * ligands.length);
      const theirIdx = Math.floor(Math.random() * prevLigands.length);
      const myLigand = ligands[myIdx];
      const theirLigand = prevLigands[theirIdx];
      ligands[myIdx] = theirLigand;
      prevLigands[theirIdx] = myLigand;
      this.showNotification(`Exchanged ${myLigand.name} with Player ${prevPlayerId}'s ${theirLigand.name}!`, 'info');
    }

    sessionStorage.setItem('game-state', JSON.stringify(gameState));
    this.updateLigandDisplay(playerId);
    this.updateLigandDisplay(prevPlayerId);
    if (window.GameMechanics) window.GameMechanics.updateAllLigandDisplays?.();
  },

  /**
   * Generous Gesture — donate one ligand to another random player
   */
  applyGenerousGesture(playerId) {
    console.log(`[FATE] Generous Gesture for Player ${playerId}`);
    const ligands = gameState.playerLigands[playerId] || [];

    if (ligands.length === 0) {
      this.showNotification('No ligands to donate!', 'info');
      return;
    }

    // Pick a random other active player
    const activePlayers = window.TurnManager ? window.TurnManager.getActivePlayers() : [1, 2, 3, 4];
    const others = activePlayers.filter(id => id !== playerId);
    if (others.length === 0) return;
    const targetPlayerId = others[Math.floor(Math.random() * others.length)];
    const targetLigands = gameState.playerLigands[targetPlayerId] || [];

    // Give a random ligand
    const givenIndex = Math.floor(Math.random() * ligands.length);
    const given = ligands.splice(givenIndex, 1)[0];
    targetLigands.push(given);

    sessionStorage.setItem('game-state', JSON.stringify(gameState));
    this.updateLigandDisplay(playerId);
    this.updateLigandDisplay(targetPlayerId);
    if (window.GameMechanics) window.GameMechanics.updateAllLigandDisplays?.();

    this.showNotification(`Donated ${given.name} to Player ${targetPlayerId}!`, 'info');
  },

  /**
   * Update ligand display for a player
   * @param {number} playerId - Player ID
   */
  updateLigandDisplay(playerId) {
    const container = document.getElementById(`ligand-display-${playerId}`);
    if (!container) {
      console.warn(`⚠️ [FATE] Ligand container not found for Player ${playerId}`);
      return;
    }

    const ligands = gameState.playerLigands[playerId] || [];

    container.innerHTML = ligands.map((ligand, index) => {
      // Handle both ligand objects and IDs for compatibility
      const ligandData = typeof ligand === 'string'
        ? LIGANDS_DATA.find(l => l.id === ligand)
        : ligand;

      if (!ligandData) {
        console.warn(`⚠️ [FATE] Ligand not found:`, ligand);
        return '';
      }

      return `
        <div class="ligand-mini-card aspect-[3/4] rounded border-2 overflow-hidden shadow-sm transition-transform"
             style="border-color: ${ligandData.color};"
             title="${ligandData.name}"
             data-ligand-id="${ligandData.id}"
             data-player-id="${playerId}"
             data-index="${index}">
          <div class="w-full h-full bg-cover bg-center" style="background-image: url('/assets/ligand-cards/${ligandData.imageFile}'); background-position: 0% center; background-size: 200%;"></div>
        </div>
      `;
    }).join('');
  }
};

// Auto-initialize
if (typeof window !== 'undefined') {
  console.log('✅ Fate Effect Handler loaded');
}
