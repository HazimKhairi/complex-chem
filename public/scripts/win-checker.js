/**
 * COOR-CHEM Level 1 Win Detection and Scoring
 *
 * Checks when players complete Level 1 by getting all 4 pieces into home area
 * Calculates scores based on ligands collected and declares winners
 */

(function () {
  'use strict';

  // Color mapping for player IDs
  const PLAYER_COLORS = {
    1: 'g', // Green
    2: 'y', // Yellow
    3: 'r', // Red
    4: 'b'  // Blue
  };

  const HOME_POSITION = 57; // All pieces must reach position 57 to be home
  const PIECES_PER_PLAYER = 1;  // Single piece mode

  // Track winners to prevent duplicate declarations
  const winners = [];
  let gameEnded = false;

  /**
   * Get the number of pieces a player has in their home area
   * @param {number} playerId - Player ID (1-4)
   * @returns {number} - Count of pieces in home
   */
  function getPiecesInHome(playerId) {
    if (playerId < 1 || playerId > 4) {
      console.error(`Invalid player ID: ${playerId}. Must be 1-4.`);
      return 0;
    }

    const colorCode = PLAYER_COLORS[playerId];
    const homeSelector = `td.${colorCode}${HOME_POSITION}`;
    const homeCell = document.querySelector(homeSelector);

    if (!homeCell) {
      console.warn(`Home cell not found for player ${playerId} (${homeSelector})`);
      return 0;
    }

    // Count img elements in the home cell
    const pieces = homeCell.querySelectorAll('img');
    return pieces.length;
  }

  /**
   * Calculate score for a player based on ligands collected
   * @param {number} playerId - Player ID (1-4)
   * @returns {number} - Total score
   */
  function calculateScore(playerId) {
    if (playerId < 1 || playerId > 4) {
      console.error(`Invalid player ID: ${playerId}`);
      return 0;
    }

    let score = 0;

    // Get ligands from gameState if available
    if (typeof gameState !== 'undefined' && gameState.playerLigands) {
      const ligands = gameState.playerLigands[playerId] || [];
      score = ligands.length;
      console.log(`Player ${playerId} ligands:`, ligands);
    }

    // Add bonus points if available in gameState
    if (typeof gameState !== 'undefined' && gameState.playerPoints) {
      const bonusPoints = gameState.playerPoints[playerId] || 0;
      score += bonusPoints;
      if (bonusPoints > 0) {
        console.log(`Player ${playerId} bonus points: ${bonusPoints}`);
      }
    }

    return score;
  }

  /**
   * Check if a specific player has won
   * @param {number} playerId - Player ID (1-4)
   * @returns {boolean} - True if player has won
   */
  function hasPlayerWon(playerId) {
    const piecesInHome = getPiecesInHome(playerId);
    return piecesInHome === PIECES_PER_PLAYER;
  }

  /**
   * Get player name from session storage or default
   * @param {number} playerId - Player ID (1-4)
   * @returns {string} - Player name
   */
  function getPlayerName(playerId) {
    const gameOption = sessionStorage.getItem('game-option');

    // Try to get custom player names based on game mode
    if (gameOption === 'one-vs-one') {
      const horse1 = sessionStorage.getItem('one-vs-one-horse-1');
      const player1Name = sessionStorage.getItem('one-vs-one-player-1-name');
      const player2Name = sessionStorage.getItem('one-vs-one-player-2-name');

      // New player→color mapping: P1=green, P2=yellow, P3=red, P4=blue.
      // Pass-and-play wizard always writes horse-1='green' for 1v1
      // (P1 vs P2). Legacy computer 1v1 component still writes
      // 'red'/'blue' for its red-green / blue-yellow combos.
      if (horse1 === 'green') {
        if (playerId === 1) return player1Name || 'Player 1';
        if (playerId === 2) return player2Name || 'Player 2';
      } else if (horse1 === 'red') {
        if (playerId === 1) return player1Name || 'Player 1';
        if (playerId === 4) return player2Name || 'Player 2';
      } else if (horse1 === 'blue') {
        if (playerId === 2) return player1Name || 'Player 1';
        if (playerId === 3) return player2Name || 'Player 2';
      }
    } else if (gameOption === 'one-vs-two') {
      const player1Name = sessionStorage.getItem('one-vs-two-player-1-name');
      const player2Name = sessionStorage.getItem('one-vs-two-player-2-name');
      const player3Name = sessionStorage.getItem('one-vs-two-player-3-name');

      if (playerId === 1) return player1Name || 'Player 1';
      if (playerId === 3) return player2Name || 'Player 2';
      if (playerId === 4) return player3Name || 'Player 3';
    } else if (gameOption === 'one-vs-three') {
      const player1Name = sessionStorage.getItem('one-vs-three-player-1-name');
      const player2Name = sessionStorage.getItem('one-vs-three-player-2-name');
      const player3Name = sessionStorage.getItem('one-vs-three-player-3-name');
      const player4Name = sessionStorage.getItem('one-vs-three-player-4-name');

      if (playerId === 1) return player1Name || 'Player 1';
      if (playerId === 2) return player2Name || 'Player 2';
      if (playerId === 3) return player3Name || 'Player 3';
      if (playerId === 4) return player4Name || 'Player 4';
    }

    // Fallback to default names
    return `Player ${playerId}`;
  }

  /**
   * Get player avatar image source
   * @param {number} playerId - Player ID (1-4)
   * @returns {string} - Avatar image path
   */
  function getPlayerAvatar(playerId) {
    // Try to get custom avatar from session storage
    const avatar = sessionStorage.getItem(`player-${playerId}-avatar`);
    if (avatar) return avatar;

    // Default avatars based on player color.
    // New player→color mapping: P1=green, P2=yellow, P3=red, P4=blue.
    const colorAvatars = {
      1: '/avatars/green-player.png',
      2: '/avatars/yellow-player.png',
      3: '/avatars/red-player.png',
      4: '/avatars/blue-player.png'
    };

    return colorAvatars[playerId] || '/avatars/default.png';
  }

  /**
   * Declare a winner and update the winners modal
   * @param {number} playerId - Player ID (1-4)
   * @param {number} score - Player's score
   */
  function declareWinner(playerId, score) {
    if (winners.find(w => w.playerId === playerId)) {
      console.log(`Player ${playerId} already declared as winner`);
      return;
    }

    const playerName = getPlayerName(playerId);
    const playerAvatar = getPlayerAvatar(playerId);

    winners.push({
      playerId,
      playerName,
      score,
      position: winners.length + 1,
      timestamp: Date.now()
    });

    console.log(`🏆 Winner #${winners.length}: Player ${playerId} (${playerName}) - Score: ${score} ligands`);

    // Play victory SFX on every new winner
    if (window.AudioManager) window.AudioManager.play('win');

    // Sort winners by score (highest first)
    winners.sort((a, b) => b.score - a.score);

    // Update winners modal contents (kept in sync, but hidden until everyone finishes)
    updateWinnersModal();

    // Mark this player as FINISHED in TurnManager so turn rotation skips them
    if (window.TurnManager && typeof window.TurnManager.setPlayerState === 'function' && window.TurnManager.STATES) {
      try { window.TurnManager.setPlayerState(playerId, window.TurnManager.STATES.FINISHED); } catch (e) {}
    }

    // Only show the full-screen Level 1 Complete modal when EVERY active
    // player has finished. Otherwise the modal would block the remaining
    // players' interaction with the board.
    var expected = getActivePlayerCount();
    if (winners.length >= expected) {
      setTimeout(() => {
        showWinnersModal();
      }, 500);
    } else {
      // Show a non-blocking toast so others know this player is done
      showFinisherToast(playerName, score, expected - winners.length);
    }

    // #12 — update Continue-to-Level-2 gating every time a new winner lands
    updateContinueGate();

    // If the current player is the one who just finished, immediately hand
    // the turn to the next non-finished active player so they aren't stuck.
    advancePastFinishedPlayer(playerId);
  }

  /**
   * Show a small non-blocking toast announcing a player finished.
   * Stacks bottom-right so multiple finishers don't overlap.
   */
  function showFinisherToast(playerName, score, remaining) {
    try {
      var stackId = 'winchecker-toast-stack';
      var stack = document.getElementById(stackId);
      if (!stack) {
        stack = document.createElement('div');
        stack.id = stackId;
        stack.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:90;display:flex;flex-direction:column;gap:8px;pointer-events:none;';
        document.body.appendChild(stack);
      }

      var toast = document.createElement('div');
      toast.style.cssText = [
        'background:#ffffff',
        'border:2px solid #10b981',
        'border-radius:14px',
        'box-shadow:0 10px 30px rgba(15,23,42,0.18)',
        'padding:12px 16px',
        'min-width:240px',
        'max-width:320px',
        'font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif',
        'color:#0f172a',
        'transform:translateY(8px)',
        'opacity:0',
        'transition:transform .25s ease, opacity .25s ease'
      ].join(';');

      var safeName = String(playerName || 'Player').replace(/[<>&"']/g, function (c) {
        return ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' })[c];
      });
      var safeScore = parseInt(score, 10) || 0;
      var remainingTxt = remaining > 0
        ? ('Waiting for ' + remaining + ' more player' + (remaining > 1 ? 's' : '') + '…')
        : 'All players done!';

      toast.innerHTML = ''
        + '<div style="font-weight:800;font-size:14px;line-height:1.2;margin-bottom:2px;">'
        +   safeName + ' finished Level 1'
        + '</div>'
        + '<div style="font-size:12px;color:#475569;">'
        +   'Score: <span style="font-weight:700;color:#0f172a;">' + safeScore + '</span> &middot; ' + remainingTxt
        + '</div>';

      stack.appendChild(toast);
      // Animate in
      requestAnimationFrame(function () {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
      });
      // Auto-dismiss
      setTimeout(function () {
        toast.style.transform = 'translateY(8px)';
        toast.style.opacity = '0';
        setTimeout(function () { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 250);
      }, 4200);
    } catch (e) {
      console.warn('[WinChecker] toast render failed:', e);
    }
  }

  /**
   * If a player just finished and they happen to be the current player, push
   * the turn forward so the remaining non-finished player can act. Without
   * this, window.x can stay on the finished player and block the dice arrow.
   */
  function advancePastFinishedPlayer(justFinishedId) {
    try {
      if (typeof window.x === 'undefined') return;
      if (window.x !== justFinishedId) return;

      var active = (window.TurnManager && window.TurnManager.getActivePlayers)
        ? window.TurnManager.getActivePlayers()
        : [1, 2, 3, 4];
      if (!Array.isArray(active) || active.length === 0) return;

      // Find next active player who is not already a winner
      var idx = active.indexOf(justFinishedId);
      if (idx < 0) idx = 0;
      for (var step = 1; step <= active.length; step++) {
        var candidate = active[(idx + step) % active.length];
        if (!winners.find(function (w) { return w.playerId === candidate; })) {
          window.x = candidate;
          if (window.TurnManager && typeof window.TurnManager.setCurrentPlayer === 'function') {
            try { window.TurnManager.setCurrentPlayer(candidate); } catch (e) {}
          }
          // CRITICAL: re-sync the game script's GLOBALS (identifyPlayer,
          // identifyColor, accurateMoveHorseVal). Without this, the next
          // dice click would still validate against the FINISHED player's
          // colour and silently fail — exactly the "Player 2 stuck"
          // symptom Hazim flagged.
          syncGameScriptGlobals(justFinishedId, candidate);
          console.log('🔁 [WinChecker] Skipped finished player ' + justFinishedId + ' → P' + candidate);
          return;
        }
      }
    } catch (e) {
      console.warn('[WinChecker] advancePastFinishedPlayer failed:', e);
    }
  }

  /**
   * After window.x is forcibly changed (turn rotation skipped a finished
   * player), the game script's identifier globals are still set to the
   * old player. Re-run identifyPlayerInfo() and update the dice arrow
   * so the new current player can actually roll.
   */
  function syncGameScriptGlobals(prevId, nextId) {
    try {
      if (typeof window.identifyPlayerInfo === 'function') {
        try { window.identifyPlayerInfo(); } catch (e) {}
      }
      if (typeof window.jQuery !== 'undefined') {
        var $ = window.jQuery;
        $('#player-' + prevId + '-dice-arrow').attr('src', '');
        $('#player-' + nextId + '-dice-arrow').attr('src', 'gifs/arrow1.gif');
        $('#player-' + nextId + '-dice').attr('src', 'dice/dice-rest.png');
      }
      // Reset dice / six counters so the new player can roll immediately
      if (typeof window.d !== 'undefined') window.d = 0;
      if (typeof window.y !== 'undefined') window.y = 1;
      if (typeof window.z !== 'undefined') window.z = 1;
    } catch (e) {
      console.warn('[WinChecker] syncGameScriptGlobals failed:', e);
    }
  }

  /**
   * Returns the number of active players in the current session.
   * Derived from game-option (solo=1, one-vs-one=2, one-vs-two=3, one-vs-three=4).
   */
  function getActivePlayerCount() {
    try {
      if (window.TurnManager && typeof window.TurnManager.getActivePlayers === 'function') {
        var ap = window.TurnManager.getActivePlayers();
        if (Array.isArray(ap) && ap.length > 0) return ap.length;
      }
    } catch (e) {}
    var gameOption = sessionStorage.getItem('game-option');
    if (gameOption === 'solo') return 1;
    if (gameOption === 'one-vs-one') return 2;
    if (gameOption === 'one-vs-two') return 3;
    if (gameOption === 'one-vs-three') return 4;
    return 4;
  }

  /**
   * #12 — Keep the "Continue to Level 2" button disabled until every
   * active player has finished Level 1. Show a small hint while gated.
   */
  function updateContinueGate() {
    var btn = document.getElementById('continue-level-2');
    if (!btn) return;

    var expected = getActivePlayerCount();
    var remaining = Math.max(0, expected - winners.length);

    if (remaining > 0) {
      btn.setAttribute('disabled', 'disabled');
      btn.classList.remove('animate-pulse');
      btn.classList.add('opacity-50', 'cursor-not-allowed');
      btn.removeAttribute('onclick');
      btn.textContent = 'Waiting for ' + remaining + ' more player' + (remaining > 1 ? 's' : '') + '…';
    } else {
      btn.removeAttribute('disabled');
      btn.classList.remove('opacity-50', 'cursor-not-allowed');
      btn.classList.add('animate-pulse');
      btn.setAttribute('onclick', "(window.LoadingScreen?.showForNav ? window.LoadingScreen.showForNav('/level-2','Preparing Level 2…') : (location.href='/level-2'))");
      btn.textContent = 'Continue to Level 2 →';
    }
  }

  /**
   * Update the winners modal with current winners
   */
  function updateWinnersModal() {
    const modal = document.getElementById('winners');
    if (!modal) {
      console.error('Winners modal not found');
      return;
    }

    // Update title to show Level 1 completion
    const title = modal.querySelector('h1');
    if (title) {
      title.textContent = 'Level 1 Complete!';
    }

    // Update each winner slot
    winners.forEach((winner, index) => {
      const winnerSlot = modal.querySelector(`#winner-${index + 1}`);
      if (!winnerSlot) return;

      const nameElement = winnerSlot.querySelector(`#winner-${index + 1}-name`);
      const imageElement = winnerSlot.querySelector(`#winner-${index + 1}-image`);

      if (nameElement) {
        nameElement.textContent = `${winner.playerName} - ${winner.score} ligands`;
      }

      if (imageElement) {
        imageElement.src = winner.playerAvatar || getPlayerAvatar(winner.playerId);
        imageElement.alt = winner.playerName;
      }

      // Show the winner slot
      winnerSlot.style.display = 'flex';
      winnerSlot.style.opacity = '1';
    });

    // Hide unused winner slots
    for (let i = winners.length + 1; i <= 4; i++) {
      const slot = modal.querySelector(`#winner-${i}`);
      if (slot) {
        slot.style.display = 'none';
      }
    }

    // Drive the Kahoot-style podium (blook pedestals). Falls back
    // silently if the podium render shim isn't loaded (old DOM).
    if (typeof window.__podiumRender === 'function') {
      window.__podiumRender(winners);
    }
  }

  /**
   * Show the winners modal
   */
  function showWinnersModal() {
    const modal = document.getElementById('winners');
    if (!modal) {
      console.error('Winners modal not found');
      return;
    }

    modal.classList.remove('hidden');
    // Podium modal uses flex (full-screen). Legacy modal used block.
    modal.classList.add('flex');
    modal.style.display = '';

    // #12 — apply the gate state as soon as the modal is shown
    updateContinueGate();

    // Play celebration sound
    if (window.AudioManager) window.AudioManager.play("horse-home");
  }

  /**
   * Check win condition for all active players
   * @returns {boolean} - True if any new winner was found
   */
  function checkWinCondition() {
    if (gameEnded) {
      return false;
    }

    let newWinnerFound = false;

    // Check all 4 players
    for (let playerId = 1; playerId <= 4; playerId++) {
      // Skip if already a winner
      if (winners.find(w => w.playerId === playerId)) {
        continue;
      }

      // Check if player has won
      if (hasPlayerWon(playerId)) {
        const score = calculateScore(playerId);
        declareWinner(playerId, score);
        newWinnerFound = true;
      }
    }

    // End game if we have enough winners (2 for 1v1, 3 for 1v2, 4 for 1v3)
    const gameOption = sessionStorage.getItem('game-option');
    let requiredWinners = 4;
    if (gameOption === 'one-vs-one') requiredWinners = 2;
    else if (gameOption === 'one-vs-two') requiredWinners = 3;

    if (winners.length >= requiredWinners) {
      gameEnded = true;
      console.log('🎮 Game ended! All players have finished.');
    }

    return newWinnerFound;
  }

  /**
   * Get current game status
   * @returns {object} - Game status information
   */
  function getGameStatus() {
    const status = {
      winners: [...winners],
      gameEnded,
      playersStatus: {}
    };

    for (let playerId = 1; playerId <= 4; playerId++) {
      status.playersStatus[playerId] = {
        piecesInHome: getPiecesInHome(playerId),
        score: calculateScore(playerId),
        hasWon: hasPlayerWon(playerId),
        isWinner: winners.some(w => w.playerId === playerId)
      };
    }

    return status;
  }

  /**
   * Reset the win checker (for testing or new games)
   */
  function reset() {
    winners.length = 0;
    gameEnded = false;
    console.log('Win checker reset');
  }

  // Expose public API
  window.WinChecker = {
    checkWinCondition,
    getPiecesInHome,
    calculateScore,
    declareWinner,
    hasPlayerWon,
    getGameStatus,
    reset,

    // Utility functions for debugging
    getWinners: () => [...winners],
    isGameEnded: () => gameEnded
  };

  console.log('✅ WinChecker initialized');
  console.log('Available commands:');
  console.log('  WinChecker.checkWinCondition() - Check for winners');
  console.log('  WinChecker.getPiecesInHome(playerId) - Count pieces in home');
  console.log('  WinChecker.calculateScore(playerId) - Get player score');
  console.log('  WinChecker.getGameStatus() - View current game status');
  console.log('  WinChecker.reset() - Reset win checker');

})();
