/**
 * GAME ORCHESTRATOR - Central Coordinator for COOR-CHEM Level 1
 *
 * This is the brain of the game that connects all systems together:
 * - Listens to piece movement from one-vs-*.js scripts
 * - Detects what tile the piece landed on
 * - Triggers appropriate card modals (ligand/question/fate)
 * - Waits for player interaction with modals
 * - Progresses the turn to next player
 * - Checks for win conditions after each turn
 *
 * Architecture Flow:
 * 1. Piece moves (one-vs-*.js) → piece-moved event
 * 2. Orchestrator detects tile type (TileDetector)
 * 3. Shows appropriate modal (GameMechanics)
 * 4. Waits for modal close (ligand-continue, fate-continue, question-answered)
 * 5. Advances turn (TurnManager)
 * 6. Checks for winner (WinChecker)
 */

console.log("🎮 [ORCHESTRATOR] Loading Game Orchestrator...");

// Game state tracking
const orchestratorState = {
  isProcessing: false,
  currentPlayer: null,
  lastLandedCell: null,
  awaitingModalClose: false
};

/**
 * Initialize the Game Orchestrator
 * Called after all game systems are loaded
 */
function initGameOrchestrator() {
  console.log("🎮 [ORCHESTRATOR] Initializing Game Orchestrator");

  // Wait for all game systems to be ready
  if (!window.TileDetector || !window.GameMechanics || !window.TurnManager || !window.WinChecker) {
    console.warn("⚠️ [ORCHESTRATOR] Waiting for game systems...");
    setTimeout(initGameOrchestrator, 100);
    return;
  }

  console.log("✅ [ORCHESTRATOR] All systems ready!");

  // Set up event listeners
  setupMovementListener();
  setupModalCloseListeners();

  // Initialize turn tracking
  orchestratorState.currentPlayer = getCurrentPlayerFromGameScript();
  console.log(`🎮 [ORCHESTRATOR] Starting game - Current player: ${orchestratorState.currentPlayer}`);

  // Expose orchestrator for debugging
  window.GameOrchestrator = {
    getState: () => orchestratorState,
    simulateLanding: (playerId, cellClass) => handlePieceLanded(playerId, cellClass),
    reset: resetOrchestrator
  };

  console.log("🎮 [ORCHESTRATOR] Ready! Test with: window.GameOrchestrator.simulateLanding(1, '.r5')");
}

/**
 * Listen for piece movement completion
 * The one-vs-*.js scripts should dispatch this event
 */
function setupMovementListener() {
  document.addEventListener("piece-moved", (event) => {
    console.log("🐴 [ORCHESTRATOR] Piece moved event received:", event.detail);

    const { playerId, landedCell, color } = event.detail;

    if (orchestratorState.isProcessing) {
      console.warn("⚠️ [ORCHESTRATOR] Already processing a move, ignoring");
      return;
    }

    handlePieceLanded(playerId, landedCell);
  });

  console.log("✅ [ORCHESTRATOR] Movement listener attached");
}

/**
 * Listen for modal close events
 */
function setupModalCloseListeners() {
  // Ligand modal closed
  document.addEventListener("ligand-continue", () => {
    console.log("🧪 [ORCHESTRATOR] Ligand modal closed - continuing game");
    handleModalClosed();
  });

  // Fate modal closed
  document.addEventListener("fate-continue", () => {
    console.log("🔺 [ORCHESTRATOR] Fate modal closed - continuing game");
    handleModalClosed();
  });

  // Question answered
  document.addEventListener("question-answered", (event) => {
    console.log("❓ [ORCHESTRATOR] Question answered:", event.detail);
    // Wait for the answer feedback to show (2 seconds in game-mechanics-cards.js)
    setTimeout(() => {
      console.log("✅ [ORCHESTRATOR] Question feedback complete - continuing game");
      handleModalClosed();
    }, 2100); // Slightly longer than the 2000ms feedback timeout
  });

  console.log("✅ [ORCHESTRATOR] Modal close listeners attached");
}

/**
 * Handle piece landing on a cell
 * This is the main coordination logic
 */
function handlePieceLanded(playerId, landedCell) {
  console.log(`\n🎯 [ORCHESTRATOR] === PIECE LANDED ===`);
  console.log(`   Player: ${playerId}`);
  console.log(`   Cell: ${landedCell}`);

  orchestratorState.isProcessing = true;
  orchestratorState.currentPlayer = playerId;
  orchestratorState.lastLandedCell = landedCell;

  // Step 1: Get cell element and detect tile type
  console.log("🔍 [ORCHESTRATOR] Step 1: Detecting tile type...");

  // Get tile info using TileDetector
  // landedCell can be either a class string (e.g., ".r5", "r5") or an element
  let tileInfo = null;
  let tileType = "normal";

  if (typeof landedCell === "string") {
    // Remove leading dot if present
    const className = landedCell.startsWith(".") ? landedCell.substring(1) : landedCell;
    tileInfo = window.TileDetector.getTileByClassName(className);

    if (tileInfo) {
      tileType = tileInfo.type;
    } else {
      console.warn(`⚠️ [ORCHESTRATOR] Could not find tile with class: ${className}`);
    }
  } else if (landedCell && landedCell.tagName === "TD") {
    // It's already a cell element
    tileType = window.TileDetector.getTileType(landedCell);
  }

  console.log(`   Tile type: ${tileType}`);

  // Step 2: Check if tile requires a card modal
  if (tileType === "normal" || tileType === "safe" || tileType === "start" || tileType === "home") {
    console.log(`✅ [ORCHESTRATOR] Normal tile - no card needed`);
    // No modal needed, progress turn immediately
    progressTurn();
    return;
  }

  // Step 3: Show appropriate card modal
  console.log(`🎴 [ORCHESTRATOR] Step 2: Showing ${tileType} modal...`);
  orchestratorState.awaitingModalClose = true;

  switch (tileType) {
    case "ligand":
      console.log("🧪 [ORCHESTRATOR] Triggering ligand collection");
      // Pass the cell element to extract specific ligand name
      // tileInfo.element is set when landedCell is a string (most common case)
      // landedCell is used directly when it's already a TD element
      const cellElement = tileInfo?.element || (landedCell?.tagName === 'TD' ? landedCell : null);
      console.log(`   Cell element for ligand:`, cellElement);
      window.GameMechanics.collectLigand(playerId, cellElement);
      break;

    case "question":
      console.log("❓ [ORCHESTRATOR] Triggering question card");
      window.GameMechanics.showQuestion(playerId);
      break;

    case "fate":
      console.log("🔺 [ORCHESTRATOR] Triggering fate card");
      window.GameMechanics.showFate(playerId);
      break;

    default:
      console.warn(`⚠️ [ORCHESTRATOR] Unknown tile type: ${tileType}`);
      progressTurn();
  }

  console.log("⏳ [ORCHESTRATOR] Waiting for modal to close...");
}

/**
 * Handle modal closed - progress the game
 */
function handleModalClosed() {
  if (!orchestratorState.awaitingModalClose) {
    console.log("⚠️ [ORCHESTRATOR] Not awaiting modal close, ignoring");
    return;
  }

  orchestratorState.awaitingModalClose = false;
  console.log("✅ [ORCHESTRATOR] Modal closed - progressing game");

  progressTurn();
}

/**
 * Progress to next turn and check win condition
 * NOTE: Turn advancement is handled by movement scripts + TurnManager continuous sync
 * This function only checks win condition after special tile modals close
 */
function progressTurn() {
  console.log("\n⏭️ [ORCHESTRATOR] === FINISHING TURN ===");

  // Step 3: Check for win condition
  console.log("🏆 [ORCHESTRATOR] Step 3: Checking win condition...");
  const winner = window.WinChecker.checkWinCondition();

  if (winner) {
    console.log(`🎉 [ORCHESTRATOR] WINNER DETECTED: Player ${winner}!`);
    orchestratorState.isProcessing = false;
    return;
  }

  // NOTE: We do NOT call TurnManager.nextTurn() here because:
  // - Movement scripts already set window.x to next player after piece lands
  // - TurnManager continuous sync (every 100ms) automatically detects this
  // - Calling nextTurn() here would cause DOUBLE advancement (skip a player)

  console.log("✅ [ORCHESTRATOR] Turn progression handled by movement script + continuous sync");

  orchestratorState.currentPlayer = window.TurnManager.getCurrentPlayer();
  orchestratorState.isProcessing = false;
  orchestratorState.lastLandedCell = null;

  console.log("✅ [ORCHESTRATOR] Turn complete - ready for next move");
  console.log("==========================================\n");
}

/**
 * Get current player from game script (one-vs-*.js)
 * These scripts use global variable 'x' to track current player
 */
function getCurrentPlayerFromGameScript() {
  if (typeof x !== "undefined") {
    return x;
  }
  return 1; // Default to player 1
}

/**
 * Reset orchestrator state
 */
function resetOrchestrator() {
  console.log("🔄 [ORCHESTRATOR] Resetting orchestrator");
  orchestratorState.isProcessing = false;
  orchestratorState.currentPlayer = null;
  orchestratorState.lastLandedCell = null;
  orchestratorState.awaitingModalClose = false;
}

// Auto-initialize when DOM is ready
if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initGameOrchestrator);
  } else {
    // DOM already loaded
    setTimeout(initGameOrchestrator, 100); // Small delay to ensure other scripts load
  }
}

console.log("✅ [ORCHESTRATOR] Game Orchestrator script loaded");
