/**
 * TURN INDICATOR INTEGRATION
 * Automatically shows turn indicator when:
 * - Game starts
 * - Turn changes
 * - Dice is rolled
 * - Piece is moving
 */

console.log("🎯 [TURN INDICATOR] Loading integration...");

// Wait for TurnIndicator to be available
function initTurnIndicatorIntegration() {
  if (!window.TurnIndicator || !window.TurnManager) {
    console.log("⏳ [TURN INDICATOR] Waiting for dependencies...");
    setTimeout(initTurnIndicatorIntegration, 100);
    return;
  }

  console.log("✅ [TURN INDICATOR] Dependencies ready, setting up integration");

  // Show initial turn indicator
  const currentPlayer = window.TurnManager.getCurrentPlayer();
  window.TurnIndicator.show(currentPlayer, "roll");

  // Listen for turn changes from TurnManager
  let lastKnownPlayer = currentPlayer;
  setInterval(() => {
    const current = window.TurnManager.getCurrentPlayer();
    if (current !== lastKnownPlayer) {
      console.log(`🔄 [TURN INDICATOR] Turn changed: Player ${lastKnownPlayer} → Player ${current}`);
      lastKnownPlayer = current;
      window.TurnIndicator.show(current, "roll");
    }
  }, 200);

  // Listen for dice roll events
  document.addEventListener("dice-rolled", (event) => {
    const { playerId, value } = event.detail || {};
    console.log(`🎲 [TURN INDICATOR] Dice rolled - Player ${playerId}: ${value}`);

    if (playerId && value) {
      // Show "select piece" message after dice roll
      setTimeout(() => {
        window.TurnIndicator.update("select", value);
      }, 1000); // 1 second delay after dice animation
    }
  });

  // Listen for piece movement start
  document.addEventListener("piece-moving", (event) => {
    const { playerId } = event.detail || {};
    console.log(`🏃 [TURN INDICATOR] Piece moving - Player ${playerId}`);

    if (playerId) {
      window.TurnIndicator.update("moving");
    }
  });

  // Listen for piece movement complete (from orchestrator)
  document.addEventListener("piece-moved", (event) => {
    const { playerId } = event.detail || {};
    console.log(`✅ [TURN INDICATOR] Piece moved - Player ${playerId}`);

    // After piece lands and modal closes, show next player's turn
    // The turn will auto-update via the continuous sync above
  });

  // Hide turn indicator when game ends
  document.addEventListener("game-ended", () => {
    console.log("🏁 [TURN INDICATOR] Game ended - hiding indicator");
    window.TurnIndicator.hide();
  });

  console.log("✅ [TURN INDICATOR] Integration complete!");
}

// Auto-initialize
if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTurnIndicatorIntegration);
  } else {
    setTimeout(initTurnIndicatorIntegration, 100);
  }
}
