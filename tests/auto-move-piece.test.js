/**
 * Tests for auto-move-piece.js — AutoMovePiece direct movement
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { loadScript } from './helpers.js';

describe('AutoMovePiece', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    delete window.AutoMovePiece;
    loadScript('auto-move-piece.js');
  });

  describe('initialization', () => {
    it('should expose AutoMovePiece on window', () => {
      expect(window.AutoMovePiece).toBeDefined();
    });

    it('should have moveFromHome method', () => {
      expect(typeof window.AutoMovePiece.moveFromHome).toBe('function');
    });
  });

  describe('getPlayerColor', () => {
    it('should map player IDs to colors', () => {
      expect(window.AutoMovePiece.getPlayerColor(1)).toBe('green');
      expect(window.AutoMovePiece.getPlayerColor(2)).toBe('yellow');
      expect(window.AutoMovePiece.getPlayerColor(3)).toBe('red');
      expect(window.AutoMovePiece.getPlayerColor(4)).toBe('blue');
    });

    it('should default to yellow for unknown player', () => {
      expect(window.AutoMovePiece.getPlayerColor(5)).toBe('yellow');
    });
  });

  describe('getPlayerIdentifier', () => {
    it('should map player IDs to CSS selectors', () => {
      expect(window.AutoMovePiece.getPlayerIdentifier(1)).toBe('.g');
      expect(window.AutoMovePiece.getPlayerIdentifier(2)).toBe('.y');
      expect(window.AutoMovePiece.getPlayerIdentifier(3)).toBe('.r');
      expect(window.AutoMovePiece.getPlayerIdentifier(4)).toBe('.b');
    });

    it('should default to .y for unknown player', () => {
      expect(window.AutoMovePiece.getPlayerIdentifier(5)).toBe('.y');
    });
  });
});
