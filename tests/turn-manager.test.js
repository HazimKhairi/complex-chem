/**
 * Tests for turn-manager.js — TurnManager turn flow and state management
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadScript, buildPlayerAreas, mockSessionStorage, stubGlobals } from './helpers.js';

describe('TurnManager', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    sessionStorage.clear();
    delete window.TurnManager;
    delete window.x;
    delete window.GameMechanics;

    buildPlayerAreas();
    stubGlobals();
    mockSessionStorage({ 'game-option': 'one-vs-three' });

    loadScript('turn-manager.js');
  });

  describe('initialization', () => {
    it('should expose TurnManager on window', () => {
      expect(window.TurnManager).toBeDefined();
    });

    it('should expose STATES constants', () => {
      expect(window.TurnManager.STATES).toEqual({
        WAITING: 'waiting',
        ROLLING: 'rolling',
        MOVING: 'moving',
        INTERACTING: 'interacting',
        FINISHED: 'finished',
      });
    });

    it('should expose EVENTS constants', () => {
      expect(window.TurnManager.EVENTS).toHaveProperty('TURN_STARTED');
      expect(window.TurnManager.EVENTS).toHaveProperty('TURN_ENDED');
      expect(window.TurnManager.EVENTS).toHaveProperty('PLAYER_STATE_CHANGED');
      expect(window.TurnManager.EVENTS).toHaveProperty('TURN_MANAGER_READY');
    });

    it('should detect 4 active players for one-vs-three', () => {
      const players = window.TurnManager.getActivePlayers();
      expect(players).toEqual([1, 2, 3, 4]);
    });

    it('should be initialized', () => {
      expect(window.TurnManager.isInitialized()).toBe(true);
    });
  });

  describe('getCurrentPlayer / setCurrentPlayer', () => {
    it('should return current player ID', () => {
      const player = window.TurnManager.getCurrentPlayer();
      expect([1, 2, 3, 4]).toContain(player);
    });

    it('should set current player', () => {
      window.TurnManager.setCurrentPlayer(2);
      expect(window.TurnManager.getCurrentPlayer()).toBe(2);
    });

    it('should sync with window.x', () => {
      window.x = 3;
      expect(window.TurnManager.getCurrentPlayer()).toBe(3);
    });

    it('should reject invalid player IDs', () => {
      const result = window.TurnManager.setCurrentPlayer(0);
      expect(result).toBe(false);
    });

    it('should reject player ID > 4', () => {
      const result = window.TurnManager.setCurrentPlayer(5);
      expect(result).toBe(false);
    });

    it('should reject inactive player', () => {
      window.TurnManager.setActivePlayers([1, 2]);
      const result = window.TurnManager.setCurrentPlayer(3);
      expect(result).toBe(false);
    });
  });

  describe('nextTurn', () => {
    it('should advance to next player in rotation', () => {
      window.TurnManager.setCurrentPlayer(1);
      const next = window.TurnManager.nextTurn();
      expect(next).toBe(2);
    });

    it('should wrap around from last to first player', () => {
      window.TurnManager.setCurrentPlayer(4);
      const next = window.TurnManager.nextTurn();
      expect(next).toBe(1);
    });

    it('should not advance during pending interactions', () => {
      window.TurnManager.setCurrentPlayer(1);
      window.TurnManager.startInteraction();
      const result = window.TurnManager.nextTurn();
      expect(result).toBe(1); // stays on current player
    });

    it('should emit turn-ended and turn-started events', () => {
      const endedHandler = vi.fn();
      const startedHandler = vi.fn();
      document.addEventListener('turn-ended', endedHandler);
      document.addEventListener('turn-started', startedHandler);

      window.TurnManager.setCurrentPlayer(1);
      window.TurnManager.nextTurn();

      expect(endedHandler).toHaveBeenCalled();
      expect(startedHandler).toHaveBeenCalled();

      document.removeEventListener('turn-ended', endedHandler);
      document.removeEventListener('turn-started', startedHandler);
    });

    it('should record turn in history', () => {
      window.TurnManager.setCurrentPlayer(1);
      window.TurnManager.nextTurn();
      const history = window.TurnManager.getTurnHistory(1);
      expect(history.length).toBe(1);
      expect(history[0].from).toBe(1);
      expect(history[0].to).toBe(2);
    });
  });

  describe('setPlayerState / getPlayerState', () => {
    it('should set and get player state', () => {
      window.TurnManager.setPlayerState(1, 'moving');
      expect(window.TurnManager.getPlayerState(1)).toBe('moving');
    });

    it('should reject invalid states', () => {
      const result = window.TurnManager.setPlayerState(1, 'flying');
      expect(result).toBe(false);
    });

    it('should reject invalid player IDs', () => {
      expect(window.TurnManager.getPlayerState(0)).toBeNull();
      expect(window.TurnManager.getPlayerState(5)).toBeNull();
    });

    it('should return true when state is same (no-op)', () => {
      window.TurnManager.setPlayerState(1, 'waiting');
      const result = window.TurnManager.setPlayerState(1, 'waiting');
      expect(result).toBe(true);
    });
  });

  describe('canPlayerAct', () => {
    it('should allow current active player to act', () => {
      window.TurnManager.setCurrentPlayer(1);
      window.TurnManager.setPlayerState(1, 'rolling');
      expect(window.TurnManager.canPlayerAct(1)).toBe(true);
    });

    it('should not allow non-current player to act', () => {
      window.TurnManager.setCurrentPlayer(1);
      expect(window.TurnManager.canPlayerAct(2)).toBe(false);
    });

    it('should not allow finished player to act', () => {
      window.TurnManager.setCurrentPlayer(1);
      window.TurnManager.setPlayerState(1, 'finished');
      expect(window.TurnManager.canPlayerAct(1)).toBe(false);
    });

    it('should not allow interacting player to act', () => {
      window.TurnManager.setCurrentPlayer(1);
      window.TurnManager.setPlayerState(1, 'interacting');
      expect(window.TurnManager.canPlayerAct(1)).toBe(false);
    });

    it('should return false for invalid player ID', () => {
      expect(window.TurnManager.canPlayerAct(0)).toBe(false);
    });
  });

  describe('setActivePlayers', () => {
    it('should set active players for 1v1', () => {
      const result = window.TurnManager.setActivePlayers([1, 4]);
      expect(result).toBe(true);
      expect(window.TurnManager.getActivePlayers()).toEqual([1, 4]);
    });

    it('should reject empty array', () => {
      const result = window.TurnManager.setActivePlayers([]);
      expect(result).toBe(false);
    });

    it('should reject invalid player IDs in array', () => {
      const result = window.TurnManager.setActivePlayers([1, 5]);
      expect(result).toBe(false);
    });

    it('should ensure current player is active after change', () => {
      window.TurnManager.setCurrentPlayer(1);
      window.TurnManager.setActivePlayers([2, 3]);
      expect(window.TurnManager.getCurrentPlayer()).toBe(2);
    });
  });

  describe('interaction tracking', () => {
    it('should track pending interactions', () => {
      window.TurnManager.setCurrentPlayer(1);
      window.TurnManager.startInteraction();
      expect(window.TurnManager.getPlayerState(1)).toBe('interacting');
    });

    it('should return to rolling after interaction ends', () => {
      window.TurnManager.setCurrentPlayer(1);
      window.TurnManager.startInteraction();
      window.TurnManager.endInteraction();
      expect(window.TurnManager.getPlayerState(1)).toBe('rolling');
    });

    it('should handle multiple nested interactions', () => {
      window.TurnManager.setCurrentPlayer(1);
      window.TurnManager.startInteraction();
      window.TurnManager.startInteraction();
      window.TurnManager.endInteraction();
      // Still interacting — 1 pending
      expect(window.TurnManager.getPlayerState(1)).toBe('interacting');
      window.TurnManager.endInteraction();
      expect(window.TurnManager.getPlayerState(1)).toBe('rolling');
    });
  });

  describe('skipTurn', () => {
    it('should mark player to skip next turn', () => {
      window.TurnManager.skipTurn(1);
      // Verify via internal state
      const state = window.TurnManager.getState();
      expect(state.skipNextTurn[1]).toBe(true);
    });
  });

  describe('state persistence', () => {
    it('should save state to sessionStorage', () => {
      window.TurnManager.setCurrentPlayer(3);
      window.TurnManager.saveState();
      const saved = sessionStorage.getItem('turn-manager-state');
      expect(saved).toBeTruthy();
      const parsed = JSON.parse(saved);
      expect(parsed.currentPlayer).toBe(3);
    });

    it('should load state from sessionStorage', () => {
      window.TurnManager.setCurrentPlayer(2);
      window.TurnManager.saveState();

      // Reset and reload
      window.TurnManager.setCurrentPlayer(1);
      const loaded = window.TurnManager.loadState();
      expect(loaded).toBe(true);
      expect(window.TurnManager.getCurrentPlayer()).toBe(2);
    });

    it('should clear state', () => {
      window.TurnManager.saveState();
      window.TurnManager.clearState();
      expect(sessionStorage.getItem('turn-manager-state')).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset to first active player', () => {
      window.TurnManager.setCurrentPlayer(3);
      window.TurnManager.nextTurn();
      window.TurnManager.nextTurn();
      window.TurnManager.reset();
      expect(window.TurnManager.getCurrentPlayer()).toBe(1);
    });

    it('should clear turn history', () => {
      window.TurnManager.nextTurn();
      window.TurnManager.reset();
      expect(window.TurnManager.getTurnHistory()).toEqual([]);
    });
  });

  describe('game mode detection', () => {
    it('should detect 1v1 with red vs green', () => {
      document.body.innerHTML = '';
      sessionStorage.clear();
      delete window.TurnManager;
      buildPlayerAreas();
      mockSessionStorage({
        'game-option': 'one-vs-one',
        'one-vs-one-horse-1': 'red',
      });
      loadScript('turn-manager.js');
      expect(window.TurnManager.getActivePlayers()).toEqual([1, 4]);
    });

    it('should detect 1v1 with blue vs yellow', () => {
      document.body.innerHTML = '';
      sessionStorage.clear();
      delete window.TurnManager;
      buildPlayerAreas();
      mockSessionStorage({
        'game-option': 'one-vs-one',
        'one-vs-one-horse-1': 'blue',
      });
      loadScript('turn-manager.js');
      expect(window.TurnManager.getActivePlayers()).toEqual([2, 3]);
    });
  });
});
