/**
 * Tests for board-path.js — BoardPath path mapping and navigation
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { loadScript, buildBoardDOM } from './helpers.js';

describe('BoardPath', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    delete window.BoardPath;
    buildBoardDOM();
    loadScript('board-path.js');
  });

  describe('initialization', () => {
    it('should expose BoardPath on window', () => {
      expect(window.BoardPath).toBeDefined();
    });

    it('should start uninitialized when no path cells exist', () => {
      // Reset and reload WITHOUT building the board first — auto-init
      // should defer until path cells appear in the DOM.
      delete window.BoardPath;
      document.body.innerHTML = '';
      loadScript('board-path.js');
      expect(window.BoardPath.initialized).toBe(false);
    });

    it('should initialize with paths for all 4 colors', () => {
      window.BoardPath.init();
      expect(window.BoardPath.initialized).toBe(true);
      expect(window.BoardPath.paths).toHaveProperty('r');
      expect(window.BoardPath.paths).toHaveProperty('b');
      expect(window.BoardPath.paths).toHaveProperty('y');
      expect(window.BoardPath.paths).toHaveProperty('g');
    });

    it('should find cells 1-57 for each color in test DOM', () => {
      window.BoardPath.init();
      ['r', 'b', 'y', 'g'].forEach(prefix => {
        const path = window.BoardPath.paths[prefix];
        expect(path.length).toBe(57);
        expect(path[0]).toBe(1);
        expect(path[path.length - 1]).toBe(57);
      });
    });
  });

  describe('getNextPos', () => {
    beforeEach(() => {
      window.BoardPath.init();
    });

    it('should return first cell when starting from position 0 (home)', () => {
      const next = window.BoardPath.getNextPos('r', 0);
      expect(next).toBe(1);
    });

    it('should return next sequential position', () => {
      expect(window.BoardPath.getNextPos('r', 1)).toBe(2);
      expect(window.BoardPath.getNextPos('r', 10)).toBe(11);
      expect(window.BoardPath.getNextPos('b', 5)).toBe(6);
    });

    it('should return next position near end of path', () => {
      expect(window.BoardPath.getNextPos('r', 56)).toBe(57);
    });

    it('should handle fallback for unknown prefix', () => {
      const result = window.BoardPath.getNextPos('x', 5);
      // Should return currentPos + 1 as fallback
      expect(result).toBe(6);
    });

    it('should handle position at end of path', () => {
      // Position 57 is the last cell — no next valid cell
      const result = window.BoardPath.getNextPos('r', 57);
      // Falls through to fallback since 57 is last index
      expect(result).toBe(58); // fallback: currentPos + 1
    });
  });

  describe('getStepsRemaining', () => {
    beforeEach(() => {
      window.BoardPath.init();
    });

    it('should return correct steps from position 1 to 57', () => {
      const steps = window.BoardPath.getStepsRemaining('r', 1);
      expect(steps).toBe(56);
    });

    it('should return 0 steps when at position 57', () => {
      expect(window.BoardPath.getStepsRemaining('r', 57)).toBe(0);
    });

    it('should return 1 step when at position 56', () => {
      expect(window.BoardPath.getStepsRemaining('r', 56)).toBe(1);
    });

    it('should fallback for unknown prefix', () => {
      const steps = window.BoardPath.getStepsRemaining('x', 10);
      expect(steps).toBe(47); // 57 - 10
    });
  });

  describe('positionExists', () => {
    beforeEach(() => {
      window.BoardPath.init();
    });

    it('should return true for existing positions', () => {
      expect(window.BoardPath.positionExists('r', 1)).toBe(true);
      expect(window.BoardPath.positionExists('r', 57)).toBe(true);
      expect(window.BoardPath.positionExists('b', 30)).toBe(true);
    });

    it('should return false for non-existing positions', () => {
      expect(window.BoardPath.positionExists('r', 0)).toBe(false);
      expect(window.BoardPath.positionExists('r', 58)).toBe(false);
      expect(window.BoardPath.positionExists('r', -1)).toBe(false);
    });

    it('should return false for unknown prefix', () => {
      expect(window.BoardPath.positionExists('x', 1)).toBe(false);
    });
  });

  describe('getPrefixFromHorse', () => {
    it('should extract color prefix from uppercase horse class', () => {
      expect(window.BoardPath.getPrefixFromHorse('RH1')).toBe('r');
      expect(window.BoardPath.getPrefixFromHorse('BH2')).toBe('b');
      expect(window.BoardPath.getPrefixFromHorse('YH3')).toBe('y');
      expect(window.BoardPath.getPrefixFromHorse('GH4')).toBe('g');
    });
  });
});
