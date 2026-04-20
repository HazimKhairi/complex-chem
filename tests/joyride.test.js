import { describe, it, expect, beforeEach } from 'vitest';
import { loadScript } from './helpers.js';

describe('Joyride', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
    delete window.Joyride;
    loadScript('joyride.js');
  });

  describe('initialization', () => {
    it('should expose Joyride on window', () => {
      expect(window.Joyride).toBeDefined();
    });

    it('should have start method', () => {
      expect(typeof window.Joyride.start).toBe('function');
    });

    it('should have startLevel1 method', () => {
      expect(typeof window.Joyride.startLevel1).toBe('function');
    });

    it('should have startLevel2 method', () => {
      expect(typeof window.Joyride.startLevel2).toBe('function');
    });

    it('should have stop method', () => {
      expect(typeof window.Joyride.stop).toBe('function');
    });
  });

  describe('start with empty steps', () => {
    it('should not throw with empty array', () => {
      expect(() => window.Joyride.start([])).not.toThrow();
    });
  });

  describe('start with valid steps', () => {
    beforeEach(() => {
      // Add a target element
      const target = document.createElement('div');
      target.id = 'test-target';
      target.style.width = '100px';
      target.style.height = '100px';
      document.body.appendChild(target);
    });

    it('should inject overlay into DOM when started', () => {
      window.Joyride.start([
        { target: '#test-target', title: 'Test', text: 'Test step' }
      ]);
      const overlay = document.getElementById('joyride-overlay');
      expect(overlay).not.toBeNull();
    });

    it('should inject tooltip into DOM when started', () => {
      window.Joyride.start([
        { target: '#test-target', title: 'Test', text: 'Test step' }
      ]);
      const tooltip = document.getElementById('joyride-tooltip');
      expect(tooltip).not.toBeNull();
    });

    it('should remove elements from DOM on stop', () => {
      window.Joyride.start([
        { target: '#test-target', title: 'Test', text: 'Test step' }
      ]);
      window.Joyride.stop();
      const overlay = document.getElementById('joyride-overlay');
      expect(overlay).toBeNull();
    });

    it('should inject styles element', () => {
      window.Joyride.start([
        { target: '#test-target', title: 'Test', text: 'Test step' }
      ]);
      const styles = document.getElementById('joyride-styles');
      expect(styles).not.toBeNull();
    });

    it('should remove styles on stop', () => {
      window.Joyride.start([
        { target: '#test-target', title: 'Test', text: 'Test step' }
      ]);
      window.Joyride.stop();
      const styles = document.getElementById('joyride-styles');
      expect(styles).toBeNull();
    });
  });

  describe('skip missing targets', () => {
    it('should not throw when target does not exist', () => {
      expect(() => {
        window.Joyride.start([
          { target: '#nonexistent', title: 'Test', text: 'Test step' }
        ]);
      }).not.toThrow();
    });
  });

  describe('localStorage flags', () => {
    it('should not set L1 flag before completion', () => {
      expect(localStorage.getItem('joyride-l1-done')).toBeNull();
    });

    it('should not set L2 flag before completion', () => {
      expect(localStorage.getItem('joyride-l2-done')).toBeNull();
    });
  });
});
