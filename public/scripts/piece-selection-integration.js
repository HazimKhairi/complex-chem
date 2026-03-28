/**
 * Piece Selection Integration
 * Automatically selects pieces when dice is rolled
 * SIMPLIFIED VERSION - No PieceSelectionHelper dependency
 */

(function() {
  'use strict';

  console.log('🎯 Initializing Piece Selection Integration (Simplified)...');

  // Wait for AutoPieceSelector to be available
  function waitForDependencies() {
    if (typeof window.AutoPieceSelector === 'undefined') {
      console.log('⏳ Waiting for AutoPieceSelector...');
      setTimeout(waitForDependencies, 100);
      return;
    }

    console.log('✅ AutoPieceSelector loaded, activating integration');

    // Listen for dice-rolled event
    document.addEventListener('dice-rolled', function(event) {
      const { playerId, value } = event.detail;

      console.log(`🎲 [AUTO-SELECT] Dice rolled - Player ${playerId}, Value: ${value}`);
      console.log(`   Auto-selecting piece in 1.5 seconds...`);
      console.log(`   (Or press SPACEBAR to move immediately)`);

      // Auto-select piece after 1.5 seconds
      setTimeout(() => {
        if (window.AutoPieceSelector) {
          const success = window.AutoPieceSelector.autoSelectFirstPiece(playerId, value);
          if (!success) {
            console.warn('⚠️ [AUTO-SELECT] No piece can move');
          }
        }
      }, 1500);
    });

    console.log('✅ Piece Selection Integration active');
  }

  // Start initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForDependencies);
  } else {
    waitForDependencies();
  }
})();
