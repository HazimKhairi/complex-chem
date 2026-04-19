/**
 * Tests for win-checker.js — WinChecker win detection and scoring
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadScript, buildBoardDOM, buildPlayerAreas, buildModals, mockSessionStorage } from './helpers.js';

describe('WinChecker', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    sessionStorage.clear();
    delete window.WinChecker;
    delete window.gameState;

    buildBoardDOM();
    buildPlayerAreas();
    buildModals();
    mockSessionStorage();

    // Set up gameState for scoring
    window.gameState = {
      playerLigands: { 1: [], 2: [], 3: [], 4: [] },
      playerPoints: { 1: 0, 2: 0, 3: 0, 4: 0 },
    };

    loadScript('win-checker.js');
  });

  describe('initialization', () => {
    it('should expose WinChecker on window', () => {
      expect(window.WinChecker).toBeDefined();
    });

    it('should have all public API methods', () => {
      expect(typeof window.WinChecker.checkWinCondition).toBe('function');
      expect(typeof window.WinChecker.getPiecesInHome).toBe('function');
      expect(typeof window.WinChecker.calculateScore).toBe('function');
      expect(typeof window.WinChecker.declareWinner).toBe('function');
      expect(typeof window.WinChecker.hasPlayerWon).toBe('function');
      expect(typeof window.WinChecker.getGameStatus).toBe('function');
      expect(typeof window.WinChecker.reset).toBe('function');
      expect(typeof window.WinChecker.getWinners).toBe('function');
      expect(typeof window.WinChecker.isGameEnded).toBe('function');
    });

    it('should start with no winners', () => {
      expect(window.WinChecker.getWinners()).toEqual([]);
      expect(window.WinChecker.isGameEnded()).toBe(false);
    });
  });

  describe('getPiecesInHome', () => {
    it('should return 0 for empty home cell', () => {
      expect(window.WinChecker.getPiecesInHome(1)).toBe(0);
    });

    it('should count pieces in home cell', () => {
      const homeCell = document.querySelector('td.r57');
      const img = document.createElement('img');
      img.classList.add('rh1');
      homeCell.appendChild(img);
      expect(window.WinChecker.getPiecesInHome(1)).toBe(1);
    });

    it('should return 0 for invalid player ID', () => {
      expect(window.WinChecker.getPiecesInHome(0)).toBe(0);
      expect(window.WinChecker.getPiecesInHome(5)).toBe(0);
    });
  });

  describe('hasPlayerWon', () => {
    it('should return false when no pieces in home', () => {
      expect(window.WinChecker.hasPlayerWon(1)).toBe(false);
    });

    it('should return true when piece is in home (single piece mode)', () => {
      const homeCell = document.querySelector('td.r57');
      homeCell.appendChild(document.createElement('img'));
      expect(window.WinChecker.hasPlayerWon(1)).toBe(true);
    });
  });

  describe('calculateScore', () => {
    it('should return 0 for player with no ligands and no points', () => {
      expect(window.WinChecker.calculateScore(1)).toBe(0);
    });

    it('should count ligands', () => {
      window.gameState.playerLigands[1] = [
        { id: 'h2o', name: 'H2O' },
        { id: 'nh3', name: 'NH3' },
      ];
      expect(window.WinChecker.calculateScore(1)).toBe(2);
    });

    it('should add bonus points', () => {
      window.gameState.playerPoints[1] = 5;
      expect(window.WinChecker.calculateScore(1)).toBe(5);
    });

    it('should combine ligands and bonus points', () => {
      window.gameState.playerLigands[1] = [{ id: 'h2o' }];
      window.gameState.playerPoints[1] = 3;
      expect(window.WinChecker.calculateScore(1)).toBe(4);
    });

    it('should return 0 for invalid player ID', () => {
      expect(window.WinChecker.calculateScore(0)).toBe(0);
    });
  });

  describe('declareWinner', () => {
    it('should add player to winners list', () => {
      window.WinChecker.declareWinner(1, 5);
      const winners = window.WinChecker.getWinners();
      expect(winners.length).toBe(1);
      expect(winners[0].playerId).toBe(1);
      expect(winners[0].score).toBe(5);
    });

    it('should not duplicate winners', () => {
      window.WinChecker.declareWinner(1, 5);
      window.WinChecker.declareWinner(1, 5);
      expect(window.WinChecker.getWinners().length).toBe(1);
    });

    it('should sort winners by score descending', () => {
      window.WinChecker.declareWinner(1, 3);
      window.WinChecker.declareWinner(2, 7);
      const winners = window.WinChecker.getWinners();
      expect(winners[0].playerId).toBe(2);
      expect(winners[1].playerId).toBe(1);
    });
  });

  describe('checkWinCondition', () => {
    it('should detect new winner', () => {
      const homeCell = document.querySelector('td.r57');
      homeCell.appendChild(document.createElement('img'));
      const found = window.WinChecker.checkWinCondition();
      expect(found).toBe(true);
      expect(window.WinChecker.getWinners().length).toBe(1);
    });

    it('should not detect winners when no pieces in home', () => {
      expect(window.WinChecker.checkWinCondition()).toBe(false);
    });

    it('should end game when required winners reached (1v1 = 2)', () => {
      sessionStorage.setItem('game-option', 'one-vs-one');
      document.querySelector('td.r57').appendChild(document.createElement('img'));
      document.querySelector('td.g57').appendChild(document.createElement('img'));
      window.WinChecker.checkWinCondition();
      expect(window.WinChecker.isGameEnded()).toBe(true);
    });

    it('should return false after game ended', () => {
      sessionStorage.setItem('game-option', 'one-vs-one');
      document.querySelector('td.r57').appendChild(document.createElement('img'));
      document.querySelector('td.g57').appendChild(document.createElement('img'));
      window.WinChecker.checkWinCondition();
      expect(window.WinChecker.checkWinCondition()).toBe(false);
    });
  });

  describe('getGameStatus', () => {
    it('should return status for all 4 players', () => {
      const status = window.WinChecker.getGameStatus();
      expect(status.winners).toEqual([]);
      expect(status.gameEnded).toBe(false);
      expect(Object.keys(status.playersStatus).length).toBe(4);
    });

    it('should include correct per-player info', () => {
      const homeCell = document.querySelector('td.r57');
      homeCell.appendChild(document.createElement('img'));
      window.WinChecker.checkWinCondition();

      const status = window.WinChecker.getGameStatus();
      expect(status.playersStatus[1].hasWon).toBe(true);
      expect(status.playersStatus[1].isWinner).toBe(true);
      expect(status.playersStatus[2].hasWon).toBe(false);
    });
  });

  describe('reset', () => {
    it('should clear winners and game ended flag', () => {
      window.WinChecker.declareWinner(1, 5);
      window.WinChecker.reset();
      expect(window.WinChecker.getWinners()).toEqual([]);
      expect(window.WinChecker.isGameEnded()).toBe(false);
    });
  });
});
