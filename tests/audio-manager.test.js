import { describe, it, expect, beforeEach } from 'vitest';
import { loadScript } from './helpers.js';

// jsdom does not implement HTMLMediaElement.play — stub it
window.HTMLMediaElement.prototype.play = function () {
  return Promise.resolve();
};

describe('AudioManager', () => {
  beforeEach(() => {
    localStorage.clear();
    delete window.AudioManager;
    loadScript('audio-manager.js');
  });

  describe('initialization', () => {
    it('should expose AudioManager on window', () => {
      expect(window.AudioManager).toBeDefined();
    });

    it('should have all public API methods', () => {
      expect(typeof window.AudioManager.play).toBe('function');
      expect(typeof window.AudioManager.getVolume).toBe('function');
      expect(typeof window.AudioManager.setVolume).toBe('function');
      expect(typeof window.AudioManager.isMuted).toBe('function');
      expect(typeof window.AudioManager.setMuted).toBe('function');
      expect(typeof window.AudioManager.toggleMute).toBe('function');
    });
  });

  describe('volume', () => {
    it('should default to volume 1.0', () => {
      expect(window.AudioManager.getVolume()).toBe(1);
    });

    it('should set volume and persist to localStorage', () => {
      window.AudioManager.setVolume(0.5);
      expect(window.AudioManager.getVolume()).toBe(0.5);
      expect(localStorage.getItem('game-volume')).toBe('0.5');
    });

    it('should clamp volume to 0 minimum', () => {
      window.AudioManager.setVolume(-1);
      expect(window.AudioManager.getVolume()).toBe(0);
    });

    it('should clamp volume to 1 maximum', () => {
      window.AudioManager.setVolume(2);
      expect(window.AudioManager.getVolume()).toBe(1);
    });

    it('should restore volume from localStorage', () => {
      localStorage.setItem('game-volume', '0.7');
      delete window.AudioManager;
      loadScript('audio-manager.js');
      expect(window.AudioManager.getVolume()).toBe(0.7);
    });
  });

  describe('mute', () => {
    it('should default to not muted', () => {
      expect(window.AudioManager.isMuted()).toBe(false);
    });

    it('should toggle mute', () => {
      window.AudioManager.toggleMute();
      expect(window.AudioManager.isMuted()).toBe(true);
      window.AudioManager.toggleMute();
      expect(window.AudioManager.isMuted()).toBe(false);
    });

    it('should set mute and persist to localStorage', () => {
      window.AudioManager.setMuted(true);
      expect(window.AudioManager.isMuted()).toBe(true);
      expect(localStorage.getItem('game-muted')).toBe('true');
    });

    it('should restore mute state from localStorage', () => {
      localStorage.setItem('game-muted', 'true');
      delete window.AudioManager;
      loadScript('audio-manager.js');
      expect(window.AudioManager.isMuted()).toBe(true);
    });
  });

  describe('play', () => {
    it('should not throw when muted', () => {
      window.AudioManager.setMuted(true);
      expect(() => window.AudioManager.play('dice-roll')).not.toThrow();
    });

    it('should not throw for unknown sound name', () => {
      expect(() => window.AudioManager.play('nonexistent')).not.toThrow();
    });

    it('should not throw for valid sound name', () => {
      expect(() => window.AudioManager.play('dice-roll')).not.toThrow();
    });
  });
});
