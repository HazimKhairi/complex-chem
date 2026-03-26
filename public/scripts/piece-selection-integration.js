/**
 * Piece Selection Integration
 * Automatically updates piece selectability when dice is rolled
 */

(function() {
  'use strict';

  // Wait for PieceSelectionHelper to be available
  function initPieceSelectionIntegration() {
    if (typeof window.PieceSelectionHelper === 'undefined') {
      setTimeout(initPieceSelectionIntegration, 100);
      return;
    }

    console.log('🎯 Initializing Piece Selection Integration...');

    // Listen for dice-rolled event
    document.addEventListener('dice-rolled', function(event) {
      const { playerId, value } = event.detail;

      console.log(`🎲 [INTEGRATION] Dice rolled - Player ${playerId}, Value: ${value}`);

      // Small delay to let the dice animation complete
      setTimeout(() => {
        const selectableCount = window.PieceSelectionHelper.updatePieceSelectability(playerId, value);

        // Log results
        if (selectableCount === 0) {
          console.warn(`⚠️ [INTEGRATION] No pieces can be selected for Player ${playerId}`);

          // Update turn indicator to show "can't move" message
          if (window.TurnIndicator) {
            window.TurnIndicator.update("wait");
          }
        } else {
          console.log(`✅ [INTEGRATION] ${selectableCount} piece(s) are now selectable`);

          // Update turn indicator to show auto-selecting message
          if (window.TurnIndicator) {
            window.TurnIndicator.update("select", value);
          }

          // AUTO-SELECT DISABLED - Players must click pieces manually
          console.log('👆 [MANUAL SELECT] Player must click the glowing piece to move');
        }
      }, 100);
    });

    // Listen for piece clicks to mark as selected
    $(document).on('click', 'img.piece-selectable', function() {
      window.PieceSelectionHelper.markPieceAsSelected(this);
      console.log('✅ [INTEGRATION] Piece selected:', $(this).attr('class'));
    });

    // Listen for turn changes to clear selections
    document.addEventListener('turn-changed', function(event) {
      console.log('🔄 [INTEGRATION] Turn changed, clearing selections');
      window.PieceSelectionHelper.clearAllSelectionClasses();
    });

    console.log('✅ Piece Selection Integration active');
  }

  // Start initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPieceSelectionIntegration);
  } else {
    initPieceSelectionIntegration();
  }
})();
