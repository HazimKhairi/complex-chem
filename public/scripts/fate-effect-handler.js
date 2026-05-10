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
    const colors = { 1: 'G', 2: 'Y', 3: 'R', 4: 'B' };
    return colors[playerId] || 'Y';
  },

  /**
   * Helper: Get player color class
   */
  getPlayerColorClass(playerId) {
    const colors = { 1: 'green', 2: 'yellow', 3: 'red', 4: 'blue' };
    return colors[playerId] || 'yellow';
  },

  /**
   * Helper: Show notification message — in-page toast.
   * Hazim 2026-05-11: previously fell through to silent console.log
   * because window.UIAnimations was intentionally skipped on the
   * game-board (game-board.astro:214). Every fate effect's state
   * mutation ran, but the player saw nothing happen — making it feel
   * like "most fate card mechanic belum implement". Self-contained
   * toast (no UIAnimations dependency, no extra CSS file required).
   */
  showNotification(message, type) {
    type = type || 'info';
    console.log('[FATE]', message);
    var palette = {
      success: { bg: 'linear-gradient(135deg,#22c55e 0%,#15803d 100%)', shadow: '#15803d', icon: '✓' },
      error:   { bg: 'linear-gradient(135deg,#ef4444 0%,#991b1b 100%)', shadow: '#991b1b', icon: '⚠' },
      info:    { bg: 'linear-gradient(135deg,#3b82f6 0%,#1e40af 100%)', shadow: '#1e40af', icon: 'ℹ' },
    };
    var p = palette[type] || palette.info;

    // Stack toasts top-center so multiple effects (e.g. swap → swap-complete)
    // don't clobber each other.
    var stackId = 'fate-toast-stack';
    var stack = document.getElementById(stackId);
    if (!stack) {
      stack = document.createElement('div');
      stack.id = stackId;
      stack.style.cssText = [
        'position:fixed', 'top:18%', 'left:50%', 'transform:translateX(-50%)',
        'z-index:9998', 'display:flex', 'flex-direction:column', 'gap:10px',
        'pointer-events:none', 'align-items:center',
      ].join(';');
      document.body.appendChild(stack);
    }

    var el = document.createElement('div');
    el.style.cssText = [
      'background:' + p.bg,
      'color:#ffffff',
      'padding:18px 28px',
      'border-radius:18px',
      'box-shadow:0 14px 32px rgba(0,0,0,0.30), 0 4px 0 ' + p.shadow,
      'font-family:Fredoka,system-ui,-apple-system,sans-serif',
      'font-weight:700',
      'font-size:1.05rem',
      'letter-spacing:0.01em',
      'min-width:240px',
      'max-width:480px',
      'text-align:center',
      'border:3px solid rgba(255,255,255,0.55)',
      'opacity:0',
      'transform:scale(0.6)',
      'transition:opacity .3s ease, transform .35s cubic-bezier(.34,1.56,.64,1)',
      'pointer-events:none',
    ].join(';');
    el.innerHTML =
      '<span style="display:inline-block;margin-right:8px;font-size:1.2em;">' + p.icon + '</span>' +
      String(message).replace(/[<>&]/g, function (c) {
        return ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c];
      });
    stack.appendChild(el);
    requestAnimationFrame(function () {
      el.style.opacity = '1';
      el.style.transform = 'scale(1)';
    });
    setTimeout(function () {
      el.style.opacity = '0';
      el.style.transform = 'scale(0.92) translateY(-12px)';
    }, 2400);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 2900);
  },

  applySwapCard(playerId) {
    console.log(`🔄 [FATE] Swap Card - Player ${playerId}`);

    // Build the list of OTHER ACTIVE players (not just != playerId).
    // In 1v1 mode P3+P4 don't exist, so listing them adds dead buttons
    // that lead to broken empty-on-empty swaps.
    const activeIds = (window.TurnManager && window.TurnManager.getActivePlayers)
      ? window.TurnManager.getActivePlayers()
      : [1, 2, 3, 4];
    const otherPlayers = [];
    activeIds.forEach((id) => {
      if (id !== playerId) {
        const ligandCount = (gameState.playerLigands[id] || []).length;
        otherPlayers.push({ id, ligandCount });
      }
    });

    const openModal = () => {
      if (window.SwapLigandModal) {
        window.SwapLigandModal.show(playerId);
        window.SwapLigandModal.showPlayerSelection(otherPlayers);
        return true;
      }
      return false;
    };

    if (openModal()) return;

    // SwapLigandModal hasn't registered yet — possible script-order race
    // on first load. Retry briefly before falling back, otherwise the
    // swap-cancelled fallback would auto-advance the turn and the player
    // would see "Swap Card" → instantly next player ("dia terus next
    // player" complaint).
    console.warn('⚠️ [FATE] SwapLigandModal not yet registered, retrying...');
    let tries = 0;
    const retry = setInterval(() => {
      tries++;
      if (openModal()) {
        clearInterval(retry);
        console.log(`✅ [FATE] SwapLigandModal opened on retry #${tries}`);
        return;
      }
      if (tries >= 10) { // 10 × 100ms = 1s max
        clearInterval(retry);
        console.error('❌ [FATE] SwapLigandModal still missing after 1s');
        // Truly broken — surface a notification but let the game advance
        // so the player isn't frozen permanently.
        this.showNotification('Could not open swap dialog — skipping.', 'error');
        document.dispatchEvent(new CustomEvent('swap-cancelled', {
          detail: { playerId, reason: 'modal-missing' },
        }));
      }
    }, 100);
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

  /**
   * Restore the fate-player as current. By the time the player clicks
   * Accept Fate (~2 s later), the game script's `setTimeout(transferDice,
   * 300)` from the landing move has already fired and rotated `window.x`
   * to the next player. For effects that need to keep / give-back the
   * turn (extra-turn, swap-card, etc), we have to revert that.
   */
  _restoreFatePlayer(playerId) {
    if (typeof window.x === 'undefined') return;
    if (window.x === playerId) return;
    const prev = window.x;
    window.x = playerId;
    if (typeof window.identifyPlayerInfo === 'function') {
      try { window.identifyPlayerInfo(); } catch (e) {}
    }
    try {
      if (typeof window.jQuery !== 'undefined') {
        const $ = window.jQuery;
        $(`#player-${prev}-dice-arrow`).attr('src', '');
        $(`#player-${playerId}-dice-arrow`).attr('src', 'gifs/arrow1.gif');
        $(`#player-${playerId}-dice`).attr('src', 'dice/dice-rest.png');
      }
    } catch (e) {}
    if (typeof window.d !== 'undefined') window.d = 0;
    if (typeof window.y !== 'undefined') window.y = 1;
    if (typeof window.z !== 'undefined') window.z = 1;
    console.log(`🔁 [FATE] Restored P${playerId} as current (was P${prev})`);
  },

  applySecondChance(playerId) {
    console.log(`🎲 [FATE] Second Chance - Player ${playerId}`);

    // CRITICAL: roll back the turn rotation that fired during the
    // ~2 s the fate modal was open. Without this, "second chance"
    // gives the NEXT player the bonus roll, not the player who got
    // the fate card. Hazim 2026-05-11: "fate grant extra turn tk
    // function".
    this._restoreFatePlayer(playerId);

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
        <img src="/assets/ligand-cards/front/${ligand?.imageFile || ligandId + '.png'}"
             alt="${ligand?.name || ligandId}"
             class="w-16 h-16 sm:w-20 sm:h-20 rounded shadow-sm ligand-selectable object-contain bg-white"
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
          <img src="/assets/ligand-cards/front/${ligand?.imageFile || ligandId + '.png'}"
               alt="${ligand?.name || ligandId}"
               class="w-16 h-16 sm:w-20 sm:h-20 rounded shadow-sm ligand-selectable object-contain bg-white"
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
        <div class="ligand-mini-card aspect-[7/10] rounded border-2 overflow-hidden shadow-sm transition-transform"
             style="border-color: ${ligandData.color};"
             title="${ligandData.name}"
             data-ligand-id="${ligandData.id}"
             data-player-id="${playerId}"
             data-index="${index}">
          <div class="w-full h-full bg-no-repeat bg-contain bg-center" style="background-image: url('/assets/ligand-cards/front/${ligandData.imageFile}');"></div>
        </div>
      `;
    }).join('');
  }
};

// Auto-initialize
if (typeof window !== 'undefined') {
  console.log('✅ Fate Effect Handler loaded');
}
