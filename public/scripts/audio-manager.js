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
  };

  var cache = {};
  var volume = parseFloat(localStorage.getItem('game-volume') || '1');
  var muted = localStorage.getItem('game-muted') === 'true';

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
    // Create fresh instance each time (allows overlapping plays)
    var audio = new Audio(src);
    audio.volume = volume;
    audio.play().catch(function () {});
  }

  function getVolume() {
    return volume;
  }

  function setVolume(val) {
    volume = Math.max(0, Math.min(1, val));
    localStorage.setItem('game-volume', volume.toString());
  }

  function isMuted() {
    return muted;
  }

  function setMuted(val) {
    muted = !!val;
    localStorage.setItem('game-muted', muted.toString());
  }

  function toggleMute() {
    setMuted(!muted);
    return muted;
  }

  return {
    play: play,
    getVolume: getVolume,
    setVolume: setVolume,
    isMuted: isMuted,
    setMuted: setMuted,
    toggleMute: toggleMute,
  };
})();
