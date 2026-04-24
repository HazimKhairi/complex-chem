/**
 * Auto Move Piece
 * Directly moves piece without relying on click events
 * Fixes issue with Astro Image component not triggering jQuery click handlers
 */

window.AutoMovePiece = {
  /**
   * Move piece from home straight to position = diceValue.
   * House rule: any dice roll exits home and the piece lands at the
   * matching path cell (dice=3 → position 3, etc). No "must roll 6"
   * gate, no two-step exit-then-walk.
   * @param {number} playerId - Current player (1-4)
   * @param {number} diceValue - Dice face 1..6. Falls back to window.randomDice
   * @returns {boolean} - True if move succeeded
   */
  moveFromHome(playerId, diceValue) {
    if (typeof diceValue !== "number" || diceValue < 1) {
      diceValue = Number(window.randomDice) || 1;
    }
    console.log(`🚀 [AUTO-MOVE] Player ${playerId} exiting home → position ${diceValue}`);

    // Get player info
    const identifyPlayer = this.getPlayerIdentifier(playerId);
    const identifyColor = this.getPlayerColor(playerId);

    // Single piece mode: always h1
    const horseClass = `${identifyPlayer.substring(1)}h1`; // e.g., "gh1"
    const horseDotClass = `.${horseClass}`; // e.g., ".gh1"

    console.log(`   Horse class: ${horseClass}`);
    console.log(`   Horse selector: ${horseDotClass}`);

    // Check if piece exists in home
    const pieceInHome = $(`#player-${playerId} img${horseDotClass}`);
    if (pieceInHome.length === 0) {
      console.warn(`⚠️ [AUTO-MOVE] No piece found in home: #player-${playerId} img${horseDotClass}`);
      return false;
    }

    console.log(`   Found piece in home:`, pieceInHome[0]);

    // Execute movement (same logic as moveDice click handler)
    try {
      // Remove piece from home
      $(horseDotClass).remove();

      // Remove sixgif class
      $(`#player-${playerId}`).find("div").removeClass("sixgif");

      // House rule: land directly on position = diceValue
      const targetPos = Math.min(6, Math.max(1, diceValue));
      const targetPathCell = `${identifyPlayer}${targetPos}`;
      console.log(`   Moving to position ${targetPos}: ${targetPathCell}`);

      $(targetPathCell).append(
        `<img class="${horseClass} ${identifyColor}" src="horses/${identifyColor}.png">`
      );

      // Fix opacity issue
      $(`${targetPathCell} > img`).css("opacity", "");

      // Re-enable dice arrow after delay
      setTimeout(function () {
        $(`#player-${playerId}-dice-arrow`).attr("src", "gifs/arrow1.gif");
      }, 200);

      // Reset dice lock
      window.d = 0;

      // Merge horses if needed
      window.mergeHorseClass = targetPathCell;
      if (typeof window.mergeHorses === 'function') {
        window.mergeHorses();
      }

      // Update position tracking with actual target position
      const posVarName = `lastPos${identifyPlayer.toUpperCase().substring(1)}H1`;
      window[posVarName] = targetPos;
      console.log(`   Updated ${posVarName} = ${targetPos}`);

      // Dispatch piece-moved event so orchestrator handles tile actions (ligand/fate/question)
      const landedCellClass = `${identifyPlayer}${targetPos}`;
      document.dispatchEvent(new CustomEvent("piece-moved", {
        detail: {
          playerId: playerId,
          landedCell: landedCellClass,
          position: targetPos,
          color: identifyColor
        }
      }));
      console.log(`🎮 [AUTO-MOVE] Dispatched piece-moved: ${landedCellClass}`);

      console.log(`✅ [AUTO-MOVE] Move complete!`);
      return true;

    } catch (error) {
      console.error(`❌ [AUTO-MOVE] Error during movement:`, error);
      return false;
    }
  },

  /**
   * Get player color
   */
  getPlayerColor(playerId) {
    const colors = {1: 'red', 2: 'blue', 3: 'yellow', 4: 'green'};
    return colors[playerId] || 'blue';
  },

  /**
   * Get player identifier
   */
  getPlayerIdentifier(playerId) {
    const identifiers = {1: '.r', 2: '.b', 3: '.y', 4: '.g'};
    return identifiers[playerId] || '.b';
  }
};

// Auto-initialize
if (typeof window !== 'undefined') {
  console.log('✅ Auto Move Piece loaded');
}
