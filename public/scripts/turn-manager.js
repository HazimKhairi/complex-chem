/**
 * Turn Manager for COOR-CHEM Ludo Game
 * Comprehensive turn management system that tracks current player and coordinates turn flow
 *
 * @module TurnManager
 * @author JavaScript Pro Agent
 * @version 2.0
 */

(function (window) {
  'use strict';

  console.log('🔄 [TURN-MANAGER] Loading Turn Manager v2.0...');

  // ============================================================================
  // Constants
  // ============================================================================

  const PLAYER_STATES = Object.freeze({
    WAITING: 'waiting',
    ROLLING: 'rolling',
    MOVING: 'moving',
    INTERACTING: 'interacting',
    FINISHED: 'finished'
  });

  const EVENTS = Object.freeze({
    TURN_STARTED: 'turn-started',
    TURN_ENDED: 'turn-ended',
    PLAYER_STATE_CHANGED: 'player-state-changed',
    TURN_MANAGER_READY: 'turn-manager-ready'
  });

  const MAX_PLAYERS = 4;
  const MIN_PLAYERS = 1;

  // ============================================================================
  // State Management
  // ============================================================================

  /**
   * Internal state object
   * @type {Object}
   */
  const state = {
    currentPlayer: 1,
    playerStates: {
      1: PLAYER_STATES.WAITING,
      2: PLAYER_STATES.WAITING,
      3: PLAYER_STATES.WAITING,
      4: PLAYER_STATES.WAITING
    },
    activePlayers: [1, 2, 3, 4],
    isInitialized: false,
    turnInProgress: false,
    interactionsPending: 0,
    turnHistory: [],
    skipNextTurn: {},
    gameMode: null
  };

  // ============================================================================
  // Utility Functions
  // ============================================================================

  /**
   * Validates player ID
   * @param {number} playerId - Player ID to validate
   * @returns {boolean} True if valid
   */
  function isValidPlayerId(playerId) {
    return (
      typeof playerId === 'number' &&
      playerId >= MIN_PLAYERS &&
      playerId <= MAX_PLAYERS
    );
  }

  /**
   * Checks if player is active in current game
   * @param {number} playerId - Player ID to check
   * @returns {boolean} True if active
   */
  function isActivePlayer(playerId) {
    return state.activePlayers.includes(playerId);
  }

  /**
   * Gets next active player in rotation
   * @param {number} currentPlayerId - Current player ID
   * @returns {number} Next player ID
   */
  function getNextActivePlayer(currentPlayerId) {
    const currentIndex = state.activePlayers.indexOf(currentPlayerId);
    const nextIndex = (currentIndex + 1) % state.activePlayers.length;
    return state.activePlayers[nextIndex];
  }

  /**
   * Emits custom event
   * @param {string} eventName - Event name
   * @param {*} detail - Event detail data
   */
  function emitEvent(eventName, detail = {}) {
    const event = new CustomEvent(eventName, {
      detail: {
        ...detail,
        timestamp: Date.now()
      },
      bubbles: true,
      cancelable: false
    });
    document.dispatchEvent(event);

    // Log event for debugging
    if (window.DEBUG_TURN_MANAGER) {
      console.log(`[TurnManager] Event: ${eventName}`, detail);
    }
  }

  /**
   * Logs debug message
   * @param {string} message - Message to log
   * @param {*} data - Additional data
   */
  function debug(message, data) {
    if (window.DEBUG_TURN_MANAGER) {
      console.log(`[TurnManager] ${message}`, data || '');
    }
  }

  // ============================================================================
  // Visual Feedback
  // ============================================================================

  /**
   * Updates visual feedback for all players
   * Highlights current player's card, dims others
   */
  function updatePlayerVisuals() {
    state.activePlayers.forEach(playerId => {
      const playerArea = document.getElementById(`player-${playerId}-area`);
      const playerCard = document.getElementById(`player-${playerId}`);
      const playerDiceArrow = document.getElementById(`player-${playerId}-dice-arrow`);

      const isCurrentPlayer = playerId === state.currentPlayer;
      const playerState = state.playerStates[playerId];

      // Update player area styling
      if (playerArea) {
        if (isCurrentPlayer && playerState !== PLAYER_STATES.FINISHED) {
          playerArea.classList.add('active-player');
          playerArea.classList.remove('inactive-player');
          // Preserve any existing opacity from game scripts
          if (playerArea.style.opacity === '0') {
            // Don't modify if hidden by game script
          } else {
            playerArea.style.opacity = '1';
          }
        } else {
          playerArea.classList.remove('active-player');
          playerArea.classList.add('inactive-player');
          // Only dim if not hidden
          if (playerArea.style.opacity !== '0') {
            playerArea.style.opacity = '0.7';
          }
        }
      }

      // Update player card styling
      if (playerCard) {
        if (isCurrentPlayer && playerState !== PLAYER_STATES.FINISHED) {
          playerCard.style.boxShadow = '0 0 20px 5px rgba(59, 130, 246, 0.5)';
          playerCard.style.border = '3px solid #3B82F6';
        } else {
          playerCard.style.boxShadow = '';
          playerCard.style.border = '';
        }
      }
    });

    // Update ligand displays to reflect current player
    if (window.GameMechanics && typeof window.GameMechanics.updateAllLigandDisplays === 'function') {
      window.GameMechanics.updateAllLigandDisplays();
    }
  }

  /**
   * Adds CSS styles for visual feedback
   */
  function injectStyles() {
    if (document.getElementById('turn-manager-styles')) {
      return; // Already injected
    }

    const style = document.createElement('style');
    style.id = 'turn-manager-styles';
    style.textContent = `
      .active-player {
        position: relative;
        z-index: 10;
      }

      .active-player::after {
        content: '';
        position: absolute;
        inset: -5px;
        border: 2px solid #3B82F6;
        border-radius: 8px;
        pointer-events: none;
        animation: pulse-border 2s ease-in-out infinite;
      }

      @keyframes pulse-border {
        0%, 100% {
          opacity: 0.4;
          transform: scale(1);
        }
        50% {
          opacity: 1;
          transform: scale(1.02);
        }
      }

      .inactive-player {
        filter: grayscale(0.2);
      }

      .player-state-waiting {
        cursor: not-allowed;
      }

      .player-state-rolling {
        cursor: pointer;
      }

      .player-state-moving {
        cursor: pointer;
      }

      .player-state-interacting {
        cursor: wait;
      }

      .player-state-finished {
        opacity: 0.5;
        filter: grayscale(0.8);
      }
    `;
    document.head.appendChild(style);
  }

  // ============================================================================
  // Core Turn Management
  // ============================================================================

  /**
   * Gets current player ID
   * @returns {number} Current player ID
   */
  function getCurrentPlayer() {
    // Sync with game script global variable 'x' if available
    if (typeof window.x !== 'undefined' && window.x !== state.currentPlayer) {
      state.currentPlayer = window.x;
    }
    return state.currentPlayer;
  }

  /**
   * Sets current player
   * @param {number} playerId - Player ID to set as current
   * @returns {boolean} Success status
   */
  function setCurrentPlayer(playerId) {
    if (!isValidPlayerId(playerId)) {
      console.error(`[TurnManager] Invalid player ID: ${playerId}`);
      return false;
    }

    if (!isActivePlayer(playerId)) {
      console.error(`[TurnManager] Player ${playerId} is not active in this game`);
      return false;
    }

    const previousPlayer = state.currentPlayer;
    state.currentPlayer = playerId;

    // Update player state to rolling (ready to roll dice)
    setPlayerState(playerId, PLAYER_STATES.ROLLING);

    // Update visuals
    updatePlayerVisuals();

    // Sync with game script global variable
    if (typeof window.x !== 'undefined') {
      window.x = playerId;
    }

    // Sync with game-mechanics-cards.js if available
    if (window.GameMechanics && typeof window.GameMechanics.setCurrentPlayer === 'function') {
      window.GameMechanics.setCurrentPlayer(playerId);
    }

    debug(`Current player changed: ${previousPlayer} -> ${playerId}`);

    return true;
  }

  /**
   * Advances to next player's turn
   * @returns {number} New current player ID
   */
  function nextTurn() {
    if (state.interactionsPending > 0) {
      debug('Cannot advance turn: interactions pending', state.interactionsPending);
      return state.currentPlayer;
    }

    const previousPlayer = state.currentPlayer;

    // Check if player should skip turn
    if (state.skipNextTurn[previousPlayer]) {
      console.log(`⏭️ [TurnManager] Player ${previousPlayer} is skipping this turn`);
      delete state.skipNextTurn[previousPlayer];
    }

    // Emit turn ended event
    emitEvent(EVENTS.TURN_ENDED, {
      playerId: previousPlayer,
      state: state.playerStates[previousPlayer]
    });

    // Set previous player to waiting
    setPlayerState(previousPlayer, PLAYER_STATES.WAITING);

    // Get next active player
    const nextPlayer = getNextActivePlayer(previousPlayer);

    // Record turn in history
    state.turnHistory.push({
      from: previousPlayer,
      to: nextPlayer,
      timestamp: Date.now()
    });

    // Limit history to last 100 turns
    if (state.turnHistory.length > 100) {
      state.turnHistory.shift();
    }

    // Set next player as current
    setCurrentPlayer(nextPlayer);

    // Emit turn started event
    emitEvent(EVENTS.TURN_STARTED, {
      playerId: nextPlayer,
      previousPlayer: previousPlayer
    });

    debug(`Turn advanced: ${previousPlayer} -> ${nextPlayer}`);

    return nextPlayer;
  }

  /**
   * Sets player state
   * @param {number} playerId - Player ID
   * @param {string} newState - New state (from PLAYER_STATES)
   * @returns {boolean} Success status
   */
  function setPlayerState(playerId, newState) {
    if (!isValidPlayerId(playerId)) {
      console.error(`[TurnManager] Invalid player ID: ${playerId}`);
      return false;
    }

    if (!Object.values(PLAYER_STATES).includes(newState)) {
      console.error(`[TurnManager] Invalid state: ${newState}`);
      return false;
    }

    const oldState = state.playerStates[playerId];

    if (oldState === newState) {
      return true; // No change needed
    }

    state.playerStates[playerId] = newState;

    // Update visual feedback based on state
    const playerArea = document.getElementById(`player-${playerId}-area`);
    if (playerArea) {
      // Remove all state classes
      Object.values(PLAYER_STATES).forEach(s => {
        playerArea.classList.remove(`player-state-${s}`);
      });
      // Add new state class
      playerArea.classList.add(`player-state-${newState}`);
    }

    // Update visuals
    updatePlayerVisuals();

    // Emit state changed event
    emitEvent(EVENTS.PLAYER_STATE_CHANGED, {
      playerId,
      oldState,
      newState
    });

    debug(`Player ${playerId} state changed: ${oldState} -> ${newState}`);

    return true;
  }

  /**
   * Checks if player can perform actions
   * @param {number} playerId - Player ID to check
   * @returns {boolean} True if player can act
   */
  function canPlayerAct(playerId) {
    if (!isValidPlayerId(playerId)) {
      return false;
    }

    if (!isActivePlayer(playerId)) {
      return false;
    }

    // Player must be current player
    if (playerId !== state.currentPlayer) {
      return false;
    }

    const playerState = state.playerStates[playerId];

    // Player cannot act if finished
    if (playerState === PLAYER_STATES.FINISHED) {
      return false;
    }

    // Player cannot act if interacting (viewing card)
    if (playerState === PLAYER_STATES.INTERACTING) {
      return false;
    }

    return true;
  }

  /**
   * Gets current state of a player
   * @param {number} playerId - Player ID
   * @returns {string|null} Player state or null if invalid
   */
  function getPlayerState(playerId) {
    if (!isValidPlayerId(playerId)) {
      return null;
    }
    return state.playerStates[playerId];
  }

  /**
   * Gets all active players
   * @returns {number[]} Array of active player IDs
   */
  function getActivePlayers() {
    return [...state.activePlayers];
  }

  /**
   * Sets active players for the game
   * @param {number[]} playerIds - Array of player IDs
   * @returns {boolean} Success status
   */
  function setActivePlayers(playerIds) {
    if (!Array.isArray(playerIds) || playerIds.length === 0) {
      console.error('[TurnManager] Invalid active players array');
      return false;
    }

    const validPlayers = playerIds.filter(id => isValidPlayerId(id));

    if (validPlayers.length !== playerIds.length) {
      console.error('[TurnManager] Some player IDs are invalid');
      return false;
    }

    state.activePlayers = [...validPlayers];

    // Reset states for inactive players
    for (let i = 1; i <= MAX_PLAYERS; i++) {
      if (!state.activePlayers.includes(i)) {
        state.playerStates[i] = PLAYER_STATES.WAITING;
      }
    }

    // Ensure current player is active
    if (!state.activePlayers.includes(state.currentPlayer)) {
      state.currentPlayer = state.activePlayers[0];
    }

    debug('Active players set', state.activePlayers);

    return true;
  }

  /**
   * Mark a player to skip their next turn
   * @param {number} playerId - Player ID to skip
   */
  function skipTurn(playerId) {
    if (!isActivePlayer(playerId)) {
      console.warn(`⚠️ [TurnManager] Cannot skip turn for inactive player ${playerId}`);
      return;
    }

    state.skipNextTurn[playerId] = true;
    console.log(`⏭️ [TurnManager] Player ${playerId} will skip their next turn`);
  }

  /**
   * Get turn history
   * @param {number} limit - Maximum number of turns to return
   * @returns {object[]} Array of turn history objects
   */
  function getTurnHistory(limit = 10) {
    return state.turnHistory.slice(-limit);
  }

  // ============================================================================
  // Interaction Tracking
  // ============================================================================

  /**
   * Marks that an interaction has started (viewing card)
   */
  function startInteraction() {
    state.interactionsPending++;
    if (state.currentPlayer) {
      setPlayerState(state.currentPlayer, PLAYER_STATES.INTERACTING);
    }
    debug('Interaction started', state.interactionsPending);
  }

  /**
   * Marks that an interaction has ended
   */
  function endInteraction() {
    if (state.interactionsPending > 0) {
      state.interactionsPending--;
    }

    if (state.interactionsPending === 0 && state.currentPlayer) {
      // Return to rolling state after interaction
      setPlayerState(state.currentPlayer, PLAYER_STATES.ROLLING);
    }

    debug('Interaction ended', state.interactionsPending);
  }

  // ============================================================================
  // Event Listeners
  // ============================================================================

  /**
   * Sets up event listeners for game events
   */
  function setupEventListeners() {
    // Listen for ligand collection completion
    document.addEventListener('ligand-continue', () => {
      debug('Ligand continue event received');
      endInteraction();
    });

    // Listen for fate card acceptance
    document.addEventListener('fate-continue', () => {
      debug('Fate continue event received');
      endInteraction();
    });

    // Listen for question answered
    document.addEventListener('question-answered', (e) => {
      debug('Question answered event received', e.detail);
      endInteraction();
    });

    // Listen for dice rolled
    document.addEventListener('dice-rolled', (e) => {
      debug('Dice rolled event received', e.detail);
      if (state.currentPlayer) {
        setPlayerState(state.currentPlayer, PLAYER_STATES.MOVING);
      }
    });

    // Listen for game countdown complete
    document.addEventListener('game-countdown-complete', () => {
      debug('Game countdown complete');
      setPlayerState(state.currentPlayer, PLAYER_STATES.ROLLING);
      updatePlayerVisuals();
    });
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  /**
   * Detects active players from game mode
   */
  function detectActivePlayers() {
    const gameOption = sessionStorage.getItem('game-option');

    if (gameOption === 'one-vs-one') {
      state.gameMode = '1v1';
      const horse1 = sessionStorage.getItem('one-vs-one-horse-1');

      if (horse1 === 'red') {
        setActivePlayers([1, 4]); // Red vs Green
      } else if (horse1 === 'blue') {
        setActivePlayers([2, 3]); // Blue vs Yellow
      } else {
        setActivePlayers([1, 4]); // Default
      }
    } else if (gameOption === 'one-vs-two') {
      state.gameMode = '1v2';
      const player1 = parseInt(sessionStorage.getItem('one-vs-two-player-1')) || 1;
      const player2 = parseInt(sessionStorage.getItem('one-vs-two-player-2')) || 2;
      const player3 = parseInt(sessionStorage.getItem('one-vs-two-player-3')) || 3;
      setActivePlayers([player1, player2, player3]);
    } else if (gameOption === 'one-vs-three') {
      state.gameMode = '1v3';
      setActivePlayers([1, 2, 3, 4]); // All players
    } else {
      // Default to all players
      state.gameMode = '1v3';
      setActivePlayers([1, 2, 3, 4]);
    }

    console.log(`🔄 [TurnManager] Detected game mode: ${state.gameMode}`);
  }

  /**
   * Get current player from game script
   */
  function getCurrentPlayerFromGameScript() {
    if (typeof window.x !== 'undefined') {
      return window.x;
    }
    return state.activePlayers[0] || 1;
  }

  /**
   * Initializes turn manager
   */
  function initialize() {
    if (state.isInitialized) {
      debug('Already initialized');
      return;
    }

    console.log('🔄 [TurnManager] Initializing Turn Manager...');

    // Inject CSS styles
    injectStyles();

    // Detect active players
    detectActivePlayers();

    // Get initial player from game script
    state.currentPlayer = getCurrentPlayerFromGameScript();

    // Set first player as current
    setPlayerState(state.currentPlayer, PLAYER_STATES.ROLLING);

    // Setup event listeners
    setupEventListeners();

    // Initial visual update
    updatePlayerVisuals();

    // Start continuous sync with game script
    startContinuousSync();

    state.isInitialized = true;

    // Emit ready event
    emitEvent(EVENTS.TURN_MANAGER_READY, {
      currentPlayer: state.currentPlayer,
      activePlayers: state.activePlayers
    });

    console.log('✅ [TurnManager] Initialized successfully');
    console.log(`   Game mode: ${state.gameMode}`);
    console.log(`   Active players: ${state.activePlayers.join(', ')}`);
    console.log(`   Current player: ${state.currentPlayer}`);
  }

  /**
   * Start continuous synchronization with game script's window.x variable
   * Checks every 100ms if window.x changed and updates TurnManager
   */
  function startContinuousSync() {
    setInterval(() => {
      if (typeof window.x !== 'undefined') {
        const gameScriptPlayer = window.x;

        // If game script player differs from our current player, sync it
        if (gameScriptPlayer !== state.currentPlayer && isValidPlayerId(gameScriptPlayer)) {
          console.log(`🔄 [TurnManager] Syncing with game script: ${state.currentPlayer} -> ${gameScriptPlayer}`);

          // Update internal state
          state.currentPlayer = gameScriptPlayer;

          // Update player states
          for (let i = 1; i <= MAX_PLAYERS; i++) {
            if (i === gameScriptPlayer) {
              state.playerStates[i] = PLAYER_STATES.ROLLING;
            } else if (isActivePlayer(i)) {
              state.playerStates[i] = PLAYER_STATES.WAITING;
            }
          }

          // Update visuals
          updatePlayerVisuals();

          // Sync with game-mechanics-cards.js
          if (window.GameMechanics && typeof window.GameMechanics.setCurrentPlayer === 'function') {
            window.GameMechanics.setCurrentPlayer(gameScriptPlayer);
          }
        }
      }
    }, 100); // Check every 100ms
  }

  /**
   * Reset turn manager
   */
  function reset() {
    console.log('🔄 [TurnManager] Resetting turn manager');

    state.currentPlayer = state.activePlayers[0] || 1;
    state.turnHistory = [];
    state.skipNextTurn = {};
    state.interactionsPending = 0;

    // Reset player states
    state.activePlayers.forEach(id => {
      state.playerStates[id] = PLAYER_STATES.WAITING;
    });

    // Sync with game script
    if (typeof window.x !== 'undefined') {
      window.x = state.currentPlayer;
    }

    setPlayerState(state.currentPlayer, PLAYER_STATES.ROLLING);
    updatePlayerVisuals();

    console.log(`   Reset to player: ${state.currentPlayer}`);
  }

  // ============================================================================
  // State Persistence
  // ============================================================================

  /**
   * Saves state to session storage
   */
  function saveState() {
    const stateToSave = {
      currentPlayer: state.currentPlayer,
      playerStates: { ...state.playerStates },
      activePlayers: [...state.activePlayers],
      turnHistory: [...state.turnHistory],
      skipNextTurn: { ...state.skipNextTurn },
      gameMode: state.gameMode
    };

    try {
      sessionStorage.setItem('turn-manager-state', JSON.stringify(stateToSave));
      debug('State saved');
    } catch (e) {
      console.error('[TurnManager] Failed to save state:', e);
    }
  }

  /**
   * Loads state from session storage
   */
  function loadState() {
    try {
      const saved = sessionStorage.getItem('turn-manager-state');
      if (saved) {
        const parsed = JSON.parse(saved);
        state.currentPlayer = parsed.currentPlayer;
        state.playerStates = { ...parsed.playerStates };
        state.activePlayers = [...parsed.activePlayers];
        state.turnHistory = parsed.turnHistory || [];
        state.skipNextTurn = parsed.skipNextTurn || {};
        state.gameMode = parsed.gameMode;
        debug('State loaded', parsed);
        return true;
      }
    } catch (e) {
      console.error('[TurnManager] Failed to load state:', e);
    }
    return false;
  }

  /**
   * Clears saved state
   */
  function clearState() {
    sessionStorage.removeItem('turn-manager-state');
    debug('State cleared');
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Public TurnManager API
   * @namespace
   */
  window.TurnManager = {
    // Core functions
    getCurrentPlayer,
    setCurrentPlayer,
    nextTurn,
    setPlayerState,
    getPlayerState,
    canPlayerAct,

    // Player management
    getActivePlayers,
    setActivePlayers,
    skipTurn,
    getTurnHistory,

    // Interaction tracking
    startInteraction,
    endInteraction,

    // State management
    saveState,
    loadState,
    clearState,
    reset,

    // Utilities
    initialize,
    updateVisuals: updatePlayerVisuals,

    // Constants (read-only)
    STATES: PLAYER_STATES,
    EVENTS: EVENTS,

    // Debug info
    getState: () => ({ ...state }),
    isInitialized: () => state.isInitialized
  };

  // ============================================================================
  // Auto-initialization
  // ============================================================================

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Try to load saved state
      const loaded = loadState();
      if (!loaded) {
        initialize();
      } else {
        // Restore visuals from loaded state
        state.isInitialized = true;
        setupEventListeners();
        injectStyles();
        updatePlayerVisuals();

        emitEvent(EVENTS.TURN_MANAGER_READY, {
          currentPlayer: state.currentPlayer,
          activePlayers: state.activePlayers,
          restored: true
        });

        console.log('✅ [TurnManager] Restored from saved state');
      }
    });
  } else {
    // DOM already loaded
    const loaded = loadState();
    if (!loaded) {
      initialize();
    } else {
      state.isInitialized = true;
      setupEventListeners();
      injectStyles();
      updatePlayerVisuals();

      emitEvent(EVENTS.TURN_MANAGER_READY, {
        currentPlayer: state.currentPlayer,
        activePlayers: state.activePlayers,
        restored: true
      });

      console.log('✅ [TurnManager] Restored from saved state');
    }
  }

  // Enable debug mode via console
  console.log('[TurnManager] Set window.DEBUG_TURN_MANAGER = true for debug logging');

})(window);
