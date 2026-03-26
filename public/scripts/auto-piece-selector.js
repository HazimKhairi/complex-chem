/**
 * Auto Piece Selector
 * Automatically selects the first available piece for the player
 * Solves the issue of some pieces being blocked by overlays
 */

window.AutoPieceSelector = {
  /**
   * Find the first clickable piece and auto-select it
   * @param {number} playerId - Current player (1-4)
   * @param {number} diceValue - Dice value rolled
   * @returns {boolean} - True if piece was auto-selected
   */
  autoSelectFirstPiece(playerId, diceValue) {
    console.log(`🎯 [AUTO-SELECT] Finding piece for Player ${playerId}...`);

    const playerColor = this.getPlayerColor(playerId);
    const identifyPlayer = this.getPlayerIdentifier(playerId);
    const identifyPlayer2 = identifyPlayer.toUpperCase().substring(1); // Remove dot

    // SIMPLIFIED: Only 1 piece per player (h1 only)
    const piecesInHome = $(`#player-${playerId} img`).toArray();
    const piecesOnPath = $(`.path img${identifyPlayer}h1`).toArray();

    let selectablePieces = [];

    // Check piece in home (if rolled 6)
    if (diceValue === 6 && piecesInHome.length > 0) {
      const piece = piecesInHome[0];
      if (this.isPieceClickable(piece)) {
        selectablePieces.push({ piece, location: 'home' });
      }
    }

    // Check piece on path
    if (piecesOnPath.length > 0) {
      const piece = piecesOnPath[0];
      const lastPos = window[`lastPos${identifyPlayer2}H1`]; // Only H1 exists
      const canMove = diceValue <= (57 - lastPos);

      if (canMove && this.isPieceClickable(piece)) {
        selectablePieces.push({ piece, location: 'path' });
      }
    }

    console.log(`   Found ${selectablePieces.length} piece(s) to move`);

    if (selectablePieces.length === 0) {
      console.warn('⚠️ [AUTO-SELECT] No piece can move!');
      return false;
    }

    // Auto-select the first available piece
    const selected = selectablePieces[0];
    console.log(`✅ [AUTO-SELECT] Auto-selecting piece from ${selected.location}`);

    // ULTIMATE FIX: Bypass clicking entirely!
    // Directly call movement function (same logic game uses internally)
    if (selected.location === 'home' && window.AutoMovePiece) {
      console.log('   Using direct movement (no clicking needed)...');
      const success = window.AutoMovePiece.moveFromHome(playerId);

      if (success) {
        console.log('   ✅ Piece moved directly!');
        return true;
      } else {
        console.warn('   ⚠️ Direct movement failed, trying click fallback...');
      }
    }

    // Fallback: try clicking the piece image directly
    // Click the piece itself, not the parent TD, to trigger the delegated event handler
    console.log('   Clicking piece directly...');
    console.log(`   Piece element:`, selected.piece);
    console.log(`   Piece classes: ${selected.piece.className}`);

    // Use jQuery to trigger click for better compatibility
    $(selected.piece).trigger('click');

    return true;
  },

  /**
   * Check if a piece is actually clickable (not blocked by overlay)
   * @param {HTMLElement} piece - The piece element
   * @returns {boolean} - True if clickable
   */
  isPieceClickable(piece) {
    try {
      const rect = piece.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Check what element is at the piece's center
      const topElement = document.elementFromPoint(centerX, centerY);

      // If the top element is the piece itself, it's clickable!
      const isClickable = topElement === piece || topElement?.parentElement === piece;

      return isClickable;
    } catch (e) {
      console.error('Error checking piece clickability:', e);
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
  console.log('✅ Auto Piece Selector loaded');
}
