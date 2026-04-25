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

    // Execute movement — walk diceValue STEPS along the path, using
    // BoardPath.getNextPos so that gap cells at perimeter corners are
    // skipped (e.g. red path has no r6, jumps from r5 → r7).
    try {
      const stepsToTake = Math.min(6, Math.max(1, diceValue));
      const prefix = identifyPlayer.substring(1); // ".r" → "r"

      // Compute the path positions we'll visit. Step 0 = home (lastPos
      // 0 → first valid cell). Step 1..stepsToTake = subsequent cells.
      const visited = [];
      let pos = 0;
      for (let i = 0; i < stepsToTake; i++) {
        if (window.BoardPath && window.BoardPath.getNextPos) {
          pos = window.BoardPath.getNextPos(prefix, pos);
        } else {
          pos = pos + 1;
        }
        visited.push(pos);
      }
      const targetPos = visited[visited.length - 1];

      // SAFETY — final landing cell must exist before we yank the piece
      // from home. If it doesn't, abort; piece stays put.
      const finalCell = `${identifyPlayer}${targetPos}`;
      if ($(finalCell).length === 0) {
        console.error(`❌ [AUTO-MOVE] Final cell ${finalCell} not in DOM — aborting move.`);
        return false;
      }

      // Remove piece from home
      $(horseDotClass).remove();
      $(`#player-${playerId}`).find("div").removeClass("sixgif");

      console.log(`   Animating exit-from-home → ${stepsToTake} steps via cells [${visited.join(',')}]`);

      const imgHtml = `<img class="${horseClass} ${identifyColor}" src="horses/${identifyColor}.png">`;
      const posVarName = `lastPos${identifyPlayer.toUpperCase().substring(1)}H1`;

      const placeAt = (pos) => {
        $(`${identifyPlayer}${pos}`).append(imgHtml);
        $(`${identifyPlayer}${pos} > img`).css("opacity", "");
        if (window.AudioManager) window.AudioManager.play("horse-move");
        window.mergeHorseClass = `${identifyPlayer}${pos}`;
        if (typeof window.mergeHorses === 'function') window.mergeHorses();
      };
      const removeAt = (pos) => {
        $(`${identifyPlayer}${pos} img.${horseClass}`).remove();
      };

      // Drop on first visited cell
      let stepIdx = 0;
      placeAt(visited[stepIdx]);
      window[posVarName] = visited[stepIdx];

      const finish = () => {
        setTimeout(function () {
          $(`#player-${playerId}-dice-arrow`).attr("src", "gifs/arrow1.gif");
        }, 200);
        window.d = 0;
        const landedCellClass = `${identifyPlayer}${targetPos}`;
        document.dispatchEvent(new CustomEvent("piece-moved", {
          detail: { playerId, landedCell: landedCellClass, position: targetPos, color: identifyColor }
        }));
        console.log(`🎮 [AUTO-MOVE] Dispatched piece-moved: ${landedCellClass}`);
      };

      if (visited.length === 1) {
        finish();
      } else {
        window._moveInProgress = true;
        const exitTimer = setInterval(() => {
          removeAt(visited[stepIdx]);
          stepIdx++;
          placeAt(visited[stepIdx]);
          window[posVarName] = visited[stepIdx];
          if (stepIdx >= visited.length - 1) {
            clearInterval(exitTimer);
            window._moveInProgress = false;
            finish();
          }
        }, 480);
      }

      console.log(`✅ [AUTO-MOVE] Move started!`);
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
    const colors = {1: 'green', 2: 'yellow', 3: 'red', 4: 'blue'};
    return colors[playerId] || 'yellow';
  },

  /**
   * Get player identifier
   */
  getPlayerIdentifier(playerId) {
    const identifiers = {1: '.g', 2: '.y', 3: '.r', 4: '.b'};
    return identifiers[playerId] || '.y';
  }
};

// Auto-initialize
if (typeof window !== 'undefined') {
  console.log('✅ Auto Move Piece loaded');
}
