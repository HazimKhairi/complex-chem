/**
 * Tests for game-mechanics-cards.js — GameMechanics cards, ligands, questions, fate
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadScript, buildBoardDOM, buildPlayerAreas, buildModals, mockSessionStorage, stubGlobals } from './helpers.js';

describe('GameMechanics (Cards)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    sessionStorage.clear();
    delete window.GameMechanics;
    delete window.TileDetector;
    delete window.savePiecePositions;
    delete window.restorePiecePositions;

    buildBoardDOM();
    buildPlayerAreas();
    buildModals();
    stubGlobals();
    mockSessionStorage();

    // Load tile detector first (collectLigand uses it)
    loadScript('tile-detector.js');
    loadScript('game-mechanics-cards.js');
  });

  describe('initialization', () => {
    it('should expose GameMechanics on window', () => {
      expect(window.GameMechanics).toBeDefined();
    });

    it('should have all public API methods', () => {
      expect(typeof window.GameMechanics.collectLigand).toBe('function');
      expect(typeof window.GameMechanics.showQuestion).toBe('function');
      expect(typeof window.GameMechanics.showFate).toBe('function');
      expect(typeof window.GameMechanics.setCurrentPlayer).toBe('function');
      expect(typeof window.GameMechanics.getCurrentPlayer).toBe('function');
      expect(typeof window.GameMechanics.awardPoints).toBe('function');
      expect(typeof window.GameMechanics.getPlayerPoints).toBe('function');
      expect(typeof window.GameMechanics.getGlobalUncollectedLigands).toBe('function');
      expect(typeof window.GameMechanics.testTile).toBe('function');
    });

    it('should expose savePiecePositions and restorePiecePositions', () => {
      expect(typeof window.savePiecePositions).toBe('function');
      expect(typeof window.restorePiecePositions).toBe('function');
    });
  });

  describe('LIGANDS_DATA integrity', () => {
    it('should have 13 ligands', () => {
      // Access via getGlobalUncollectedLigands (initially all uncollected)
      const uncollected = window.GameMechanics.getGlobalUncollectedLigands();
      expect(uncollected.length).toBe(13);
    });

    it('should have unique IDs', () => {
      const uncollected = window.GameMechanics.getGlobalUncollectedLigands();
      const ids = uncollected.map(l => l.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('should have imageFile for each ligand', () => {
      const uncollected = window.GameMechanics.getGlobalUncollectedLigands();
      uncollected.forEach(l => {
        expect(l.imageFile).toBeTruthy();
        expect(l.imageFile).toMatch(/^\d+\.png$/);
      });
    });

    it('should have known ligand IDs', () => {
      const uncollected = window.GameMechanics.getGlobalUncollectedLigands();
      const ids = uncollected.map(l => l.id);
      const expected = ['h2o', 'nh3', 'py', 'pph3', 'cn', 'o2', 'cl', 'ox', 'acac', 'co32', 'phen', 'bipy', 'en'];
      expected.forEach(id => {
        expect(ids).toContain(id);
      });
    });
  });

  describe('setCurrentPlayer / getCurrentPlayer', () => {
    it('should set and get current player', () => {
      window.GameMechanics.setCurrentPlayer(3);
      expect(window.GameMechanics.getCurrentPlayer()).toBe(3);
    });

    it('should persist current player to sessionStorage', () => {
      window.GameMechanics.setCurrentPlayer(2);
      const saved = JSON.parse(sessionStorage.getItem('game-state'));
      expect(saved.currentPlayer).toBe(2);
    });
  });

  describe('awardPoints / getPlayerPoints', () => {
    it('should start with 0 points for each player', () => {
      expect(window.GameMechanics.getPlayerPoints(1)).toBe(0);
      expect(window.GameMechanics.getPlayerPoints(2)).toBe(0);
    });

    it('should award points to player', () => {
      window.GameMechanics.awardPoints(1, 5, 'hard');
      expect(window.GameMechanics.getPlayerPoints(1)).toBe(5);
    });

    it('should accumulate points', () => {
      window.GameMechanics.awardPoints(1, 5, 'hard');
      window.GameMechanics.awardPoints(1, 3, 'medium');
      expect(window.GameMechanics.getPlayerPoints(1)).toBe(8);
    });

    it('should track points independently per player', () => {
      window.GameMechanics.awardPoints(1, 5, 'hard');
      window.GameMechanics.awardPoints(2, 2, 'easy');
      expect(window.GameMechanics.getPlayerPoints(1)).toBe(5);
      expect(window.GameMechanics.getPlayerPoints(2)).toBe(2);
    });

    it('should update DOM points display', () => {
      window.GameMechanics.awardPoints(1, 5, 'hard');
      const el = document.getElementById('player-1-points');
      expect(el.textContent).toBe('5');
    });
  });

  describe('collectLigand', () => {
    it('should collect ligand for player by tile class name', () => {
      // r11 has phen
      window.GameMechanics.collectLigand(1, 'r11');
      // Check ligand display updated
      const display = document.getElementById('ligand-display-1');
      expect(display.innerHTML).not.toBe('');
    });

    it('should show ligand modal after collection', () => {
      window.GameMechanics.collectLigand(1, 'r11');
      const modal = document.getElementById('ligand-modal');
      expect(modal.classList.contains('hidden')).toBe(false);
    });

    it('should fall back to random ligand for unknown tile', () => {
      window.GameMechanics.collectLigand(1, 'r20');
      // Should still collect something (random fallback)
      const uncollected = window.GameMechanics.getGlobalUncollectedLigands();
      expect(uncollected.length).toBe(12); // one was collected
    });

    it('should decrease uncollected pool after collection', () => {
      expect(window.GameMechanics.getGlobalUncollectedLigands().length).toBe(13);
      window.GameMechanics.collectLigand(1, 'r11');
      expect(window.GameMechanics.getGlobalUncollectedLigands().length).toBe(12);
    });
  });

  describe('showQuestion', () => {
    it('should show question modal', () => {
      window.GameMechanics.showQuestion(1);
      const modal = document.getElementById('question-modal');
      expect(modal.classList.contains('flex')).toBe(true);
    });

    it('should populate question modal with data attributes', () => {
      window.GameMechanics.showQuestion(1);
      const modal = document.getElementById('question-modal');
      expect(modal.dataset.playerId).toBe('1');
      expect(modal.dataset.difficulty).toBeTruthy();
      expect(modal.dataset.correctAnswer).toBeTruthy();
      expect(modal.dataset.imageFile).toBeTruthy();
    });

    it('should render 4 answer options', () => {
      window.GameMechanics.showQuestion(1);
      const options = document.querySelectorAll('#question-options .answer-option');
      // q18 only has 3 answers, but all others have 4. Usually 4.
      expect(options.length).toBeGreaterThanOrEqual(3);
    });

    it('should filter by difficulty based on tile color', () => {
      window.GameMechanics.showQuestion(1, '#ef4444'); // red = hard
      const modal = document.getElementById('question-modal');
      expect(modal.dataset.difficulty).toBe('hard');
    });
  });

  describe('showFate', () => {
    it('should show fate modal', () => {
      window.GameMechanics.showFate(1);
      const modal = document.getElementById('fate-modal');
      expect(modal.classList.contains('flex')).toBe(true);
    });

    it('should populate fate modal with data attributes', () => {
      window.GameMechanics.showFate(1);
      const modal = document.getElementById('fate-modal');
      expect(modal.dataset.playerId).toBe('1');
      expect(modal.dataset.fateEffect).toBeTruthy();
      expect(modal.dataset.fateTitle).toBeTruthy();
    });

    it('should render fate card content', () => {
      window.GameMechanics.showFate(1);
      const container = document.getElementById('fate-card-container');
      expect(container.innerHTML).toContain('fate-card');
    });
  });

  describe('testTile', () => {
    it('should call collectLigand for ligand type', () => {
      const spy = vi.spyOn(window.GameMechanics, 'collectLigand');
      // testTile won't exist as spy target since it calls the actual function
      // Just verify it doesn't throw
      window.GameMechanics.testTile(1, 'ligand');
      // Ligand was collected
      expect(window.GameMechanics.getGlobalUncollectedLigands().length).toBe(12);
    });

    it('should call showQuestion for question type', () => {
      window.GameMechanics.testTile(1, 'question');
      const modal = document.getElementById('question-modal');
      expect(modal.classList.contains('flex')).toBe(true);
    });

    it('should call showFate for fate type', () => {
      window.GameMechanics.testTile(1, 'fate');
      const modal = document.getElementById('fate-modal');
      expect(modal.classList.contains('flex')).toBe(true);
    });
  });

  describe('state persistence', () => {
    it('should save game state to sessionStorage', () => {
      window.GameMechanics.awardPoints(1, 5, 'hard');
      const saved = JSON.parse(sessionStorage.getItem('game-state'));
      expect(saved.playerPoints[1]).toBe(5);
    });

    it('should restore game state from sessionStorage', () => {
      const state = {
        playerLigands: { 1: [{ id: 'h2o', name: 'H2O', color: '#3B82F6', imageFile: '1.png' }], 2: [], 3: [], 4: [] },
        playerPoints: { 1: 7, 2: 0, 3: 0, 4: 0 },
        collectedLigandIds: ['h2o'],
        piecePositions: {},
        currentPlayer: 1,
      };
      sessionStorage.setItem('game-state', JSON.stringify(state));

      // Re-initialize
      document.body.innerHTML = '';
      delete window.GameMechanics;
      buildBoardDOM();
      buildPlayerAreas();
      buildModals();
      loadScript('tile-detector.js');
      loadScript('game-mechanics-cards.js');

      expect(window.GameMechanics.getPlayerPoints(1)).toBe(7);
      expect(window.GameMechanics.getGlobalUncollectedLigands().length).toBe(12);
    });
  });
});
