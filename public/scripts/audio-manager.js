/**
 * Centralized Audio Manager
 * Replaces all inline new Audio() calls with volume/mute support
 */
window.AudioManager = (function () {
  'use strict';

  var sounds = {
    'game-start': '/audio/game-start.wav',
    'dice-roll': '/audio/dice-roll.wav',
    'horse-move': '/audio/horse-move.wav',
    'horse-kill': '/audio/horse-kill.wav',
    'horse-safe': '/audio/horse-safe.wav',
    'horse-home': '/audio/horse-home.wav',
    // SFX from Kenney Interface Sounds (CC0)
    'correct': '/audio/sfx/correct.wav',
    'wrong': '/audio/sfx/wrong.wav',
    'win': '/audio/sfx/win.wav',
    'complex-built': '/audio/sfx/complex-built.wav',
    'fate-card': '/audio/sfx/fate-card.wav',
    'ligand': '/audio/sfx/ligand.wav',
    'level-2-start': '/audio/sfx/level-2-start.wav',
    'char-hover': '/audio/sfx/char-hover.wav',
    'char-select': '/audio/sfx/char-select.wav',
  };

  var cache = {};
  var volume = parseFloat(localStorage.getItem('game-volume') || '1');
  var muted = localStorage.getItem('game-muted') === 'true';
  var bgm = null; // Background music Audio instance

  // Preload all sounds
  Object.keys(sounds).forEach(function (name) {
    var audio = new Audio(sounds[name]);
    audio.preload = 'auto';
    cache[name] = audio;
  });

  function play(name) {
    if (muted) return;
    var src = sounds[name];
    if (!src) return;
    var audio = new Audio(src);
    audio.volume = volume;
    audio.play().catch(function () {});
  }

  function startBGM() {
    if (bgm) return; // already playing
    // "Cozy Puzzle In-Game 1" by MintoDog — CC0 (Public Domain)
    // https://opengameart.org/content/cozy-puzzle-in-game-1
    bgm = new Audio('/audio/bgm-cozy-puzzle.mp3');
    bgm.loop = true;
    bgm.volume = volume * 0.35; // BGM quieter than SFX
    if (!muted) {
      bgm.play().catch(function () {});
    }
  }

  function stopBGM() {
    if (!bgm) return;
    bgm.pause();
    bgm.currentTime = 0;
    bgm = null;
  }

  function syncBGM() {
    if (!bgm) return;
    bgm.volume = volume * 0.35;
    if (muted) {
      bgm.pause();
    } else {
      bgm.play().catch(function () {});
    }
  }

  function getVolume() {
    return volume;
  }

  function setVolume(val) {
    volume = Math.max(0, Math.min(1, val));
    localStorage.setItem('game-volume', volume.toString());
    syncBGM();
  }

  function isMuted() {
    return muted;
  }

  function setMuted(val) {
    muted = !!val;
    localStorage.setItem('game-muted', muted.toString());
    syncBGM();
  }

  function toggleMute() {
    setMuted(!muted);
    return muted;
  }

  function isBGMPlaying() {
    return bgm !== null && !bgm.paused;
  }

  return {
    play: play,
    getVolume: getVolume,
    setVolume: setVolume,
    isMuted: isMuted,
    setMuted: setMuted,
    toggleMute: toggleMute,
    startBGM: startBGM,
    stopBGM: stopBGM,
    isBGMPlaying: isBGMPlaying,
  };
})();
