/**
 * Auto Move Piece
 * Directly moves piece without relying on click events
 * Fixes issue with Astro Image component not triggering jQuery click handlers
 */

window.AutoMovePiece = {
  /**
   * Move piece from home to first path cell
   * @param {number} playerId - Current player (1-4)
   * @returns {boolean} - True if move succeeded
   */
  moveFromHome(playerId) {
    console.log(`🚀 [AUTO-MOVE] Moving Player ${playerId} from home...`);

    // Check conditions
    // REMOVED: No longer require rolling 6 to move from home
    // Players can now start with any dice value

    if (window.z >= 2) {
      console.warn(`⚠️ [AUTO-MOVE] Already used dice (z=${window.z})`);
      return false;
    }

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
      // Increment z to track 6 usage
      window.z++;

      // Remove piece from home
      $(horseDotClass).remove();

      // Remove sixgif class
      $(`#player-${playerId}`).find("div").removeClass("sixgif");

      // UPDATED: Move to position based on dice value (not always 1)
      const diceValue = window.randomDice || 1;
      const targetPathCell = `${identifyPlayer}${diceValue}`;
      console.log(`   Moving to position ${diceValue}: ${targetPathCell}`);

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

      // Update position tracking with actual dice value
      const posVarName = `lastPos${identifyPlayer.toUpperCase().substring(1)}H1`;
      window[posVarName] = diceValue;
      console.log(`   Updated ${posVarName} = ${diceValue}`);

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
