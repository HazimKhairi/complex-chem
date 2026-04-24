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
    1: 'r', // Red
    2: 'b', // Blue
    3: 'y', // Yellow
    4: 'g'  // Green
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

      if (horse1 === 'red') {
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

    // Default avatars based on player color
    const colorAvatars = {
      1: '/avatars/red-player.png',
      2: '/avatars/blue-player.png',
      3: '/avatars/yellow-player.png',
      4: '/avatars/green-player.png'
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

    // Update winners modal
    updateWinnersModal();

    // Show modal after first winner
    if (winners.length === 1) {
      setTimeout(() => {
        showWinnersModal();
      }, 500);
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
    modal.style.display = 'block';

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
