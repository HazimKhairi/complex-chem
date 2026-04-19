/**
 * Tests for tile-detector.js — TileDetector tile type detection
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { loadScript, buildBoardDOM } from './helpers.js';

describe('TileDetector', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    delete window.TileDetector;
    buildBoardDOM();
    loadScript('tile-detector.js');
  });

  describe('initialization', () => {
    it('should expose TileDetector on window', () => {
      expect(window.TileDetector).toBeDefined();
    });

    it('should have all public API methods', () => {
      expect(typeof window.TileDetector.getTileType).toBe('function');
      expect(typeof window.TileDetector.getTileAtPosition).toBe('function');
      expect(typeof window.TileDetector.isSpecialTile).toBe('function');
      expect(typeof window.TileDetector.getAllTilesOfType).toBe('function');
      expect(typeof window.TileDetector.getTileByClassName).toBe('function');
      expect(typeof window.TileDetector.getLigandName).toBe('function');
      expect(typeof window.TileDetector.printTileSummary).toBe('function');
      expect(typeof window.TileDetector.testTileDetector).toBe('function');
    });
  });

  describe('getTileType', () => {
    it('should return "normal" for null input', () => {
      expect(window.TileDetector.getTileType(null)).toBe('normal');
    });

    it('should return "normal" for non-TD elements', () => {
      const div = document.createElement('div');
      expect(window.TileDetector.getTileType(div)).toBe('normal');
    });

    it('should detect home tiles (r57, b57, etc.)', () => {
      const cell = document.querySelector('td.r57');
      expect(window.TileDetector.getTileType(cell)).toBe('home');
    });

    it('should detect start tiles (arrow backgrounds)', () => {
      const cell = document.querySelector('td.r51');
      expect(window.TileDetector.getTileType(cell)).toBe('start');
    });

    it('should detect safe tiles (colored backgrounds)', () => {
      const cell = document.querySelector('td.r1');
      expect(window.TileDetector.getTileType(cell)).toBe('safe');
    });

    it('should detect fate tiles (fate_card.png background)', () => {
      const cell = document.querySelector('td.r5');
      expect(window.TileDetector.getTileType(cell)).toBe('fate');
    });

    it('should detect question tiles (complexes background)', () => {
      const cell = document.querySelector('td.r4');
      expect(window.TileDetector.getTileType(cell)).toBe('question');
    });

    it('should detect ligand tiles (span with ligand formula)', () => {
      const cell = document.querySelector('td.r11');
      expect(window.TileDetector.getTileType(cell)).toBe('ligand');
    });

    it('should return "normal" for plain cells', () => {
      const cell = document.querySelector('td.r20');
      expect(window.TileDetector.getTileType(cell)).toBe('normal');
    });
  });

  describe('isSpecialTile', () => {
    it('should return true for non-normal tiles', () => {
      const homeCell = document.querySelector('td.r57');
      expect(window.TileDetector.isSpecialTile(homeCell)).toBe(true);

      const fateCell = document.querySelector('td.r5');
      expect(window.TileDetector.isSpecialTile(fateCell)).toBe(true);
    });

    it('should return false for normal tiles', () => {
      const normalCell = document.querySelector('td.r20');
      expect(window.TileDetector.isSpecialTile(normalCell)).toBe(false);
    });
  });

  describe('getTileByClassName', () => {
    it('should find tile by class name', () => {
      const tile = window.TileDetector.getTileByClassName('r1');
      expect(tile).not.toBeNull();
      expect(tile.type).toBe('safe');
      expect(tile.isSpecial).toBe(true);
    });

    it('should return null for non-existent class', () => {
      const tile = window.TileDetector.getTileByClassName('r99');
      expect(tile).toBeNull();
    });

    it('should extract background color from Tailwind classes', () => {
      const tile = window.TileDetector.getTileByClassName('r1');
      expect(tile.backgroundColor).toBe('#EF4444'); // bg-red-300 maps to red
    });

    it('should return classes array', () => {
      const tile = window.TileDetector.getTileByClassName('r11');
      expect(Array.isArray(tile.classes)).toBe(true);
      expect(tile.classes).toContain('r11');
    });
  });

  describe('getLigandName', () => {
    it('should return ligand name from ligand cell', () => {
      const cell = document.querySelector('td.r11');
      const name = window.TileDetector.getLigandName(cell);
      expect(name).toBe('phen');
    });

    it('should return NH3 ligand name', () => {
      const cell = document.querySelector('td.r15');
      const name = window.TileDetector.getLigandName(cell);
      expect(name).toBe('NH\u2083');
    });

    it('should return null for non-ligand cells', () => {
      const cell = document.querySelector('td.r20');
      const name = window.TileDetector.getLigandName(cell);
      expect(name).toBeNull();
    });
  });

  describe('getAllTilesOfType', () => {
    it('should find all home tiles', () => {
      const homes = window.TileDetector.getAllTilesOfType('home');
      // 4 colors x 1 cell (57) = 4
      expect(homes.length).toBe(4);
    });

    it('should find all safe tiles', () => {
      const safes = window.TileDetector.getAllTilesOfType('safe');
      expect(safes.length).toBeGreaterThanOrEqual(4);
    });

    it('should return empty for no board', () => {
      document.body.innerHTML = '';
      const tiles = window.TileDetector.getAllTilesOfType('home');
      expect(tiles).toEqual([]);
    });
  });

  describe('printTileSummary', () => {
    it('should return summary object with all tile types', () => {
      const summary = window.TileDetector.printTileSummary();
      expect(summary).toHaveProperty('safe');
      expect(summary).toHaveProperty('ligand');
      expect(summary).toHaveProperty('question');
      expect(summary).toHaveProperty('fate');
      expect(summary).toHaveProperty('start');
      expect(summary).toHaveProperty('home');
      expect(summary).toHaveProperty('normal');
    });
  });
});
