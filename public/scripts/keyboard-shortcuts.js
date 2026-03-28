/**
 * Keyboard Shortcuts for COOR-CHEM Game
 * Spacebar: Roll dice OR move piece instantly (skip 1.5s wait)
 */

(function() {
  'use strict';

  console.log('⌨️ Keyboard shortcuts loaded');

  // Global keyboard handler
  document.addEventListener('keydown', function(event) {
    // Only handle spacebar
    if (event.code !== 'Space') {
      return;
    }

    // Prevent page scroll
    event.preventDefault();

    // Get current player from global variable x
    const currentPlayer = window.x;
    if (!currentPlayer) {
      console.log('⚠️ [KEYBOARD] No active player');
      return;
    }

    console.log(`⌨️ [KEYBOARD] Spacebar pressed - Player ${currentPlayer}`);

    // Check if dice is available to roll (d === 0)
    if (window.d === 0) {
      // Roll the dice
      console.log('   🎲 Rolling dice...');
      const diceElement = document.querySelector(`#player-${currentPlayer}-dice`);
      if (diceElement) {
        diceElement.click();
      }
    } else {
      // Dice already rolled, move piece instantly
      console.log('   🏇 Moving piece instantly...');

      if (window.AutoPieceSelector && window.randomDice) {
        const success = window.AutoPieceSelector.autoSelectFirstPiece(currentPlayer, window.randomDice);
        if (success) {
          console.log('   ✅ Piece moved!');
        } else {
          console.warn('   ⚠️ No piece can move');
        }
      }
    }
  });

  console.log('✅ Keyboard shortcuts active');
  console.log('   SPACEBAR = Roll dice OR move piece');
})();
