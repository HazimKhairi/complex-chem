/*
 * character-swap.js
 *
 * Reads the player's chosen blook (sessionStorage `character-p{1..4}`)
 * and swaps every horse <img> on the board + player cards to use that
 * character's image, while keeping the original colour class so kill
 * detection, home-return and CSS selectors keep working.
 *
 * Runs on DOMContentLoaded and re-runs a few times in case horses are
 * re-rendered (mergeHorses, kills, etc.).
 */

(function () {
  'use strict';

  // Map board class (set by one-vs-*.js) to player id
  var CLASS_TO_PLAYER = {
    'rh1': 1, 'rh2': 1, 'rh3': 1, 'rh4': 1,
    'bh1': 2, 'bh2': 2, 'bh3': 2, 'bh4': 2,
    'yh1': 3, 'yh2': 3, 'yh3': 3, 'yh4': 3,
    'gh1': 4, 'gh2': 4, 'gh3': 4, 'gh4': 4,
  };

  // Default blook per player slot if none chosen — cycles through the roster
  var DEFAULTS = { 1: 'panda', 2: 'frog', 3: 'dog', 4: 'owl' };

  function chosenFor(playerId) {
    var id = sessionStorage.getItem('character-p' + playerId);
    return id || DEFAULTS[playerId] || 'panda';
  }

  function charImage(id) {
    return '/characters/blook/' + id + '.png';
  }

  function swapAll() {
    // Swap board/home corner horse pieces. They use class names like
    // "rh1"/"bh2"/"yh3"/"gh4" which hint at player.
    var imgs = document.querySelectorAll('img');
    var swapped = 0;

    imgs.forEach(function (img) {
      // Already swapped — skip
      if (img.dataset.charSwapped === 'true') return;

      var cls = Array.from(img.classList);
      // Find any class that maps to a player id
      var playerId = null;
      for (var i = 0; i < cls.length; i++) {
        if (CLASS_TO_PLAYER[cls[i]] !== undefined) {
          playerId = CLASS_TO_PLAYER[cls[i]];
          break;
        }
      }

      if (!playerId) return;

      var charId = chosenFor(playerId);
      img.src = charImage(charId);
      img.dataset.charSwapped = 'true';
      img.dataset.charId = charId;
      swapped++;
    });

    if (swapped > 0) {
      console.log('[character-swap] swapped ' + swapped + ' piece image(s) to chosen blooks');
    }
  }

  function swapPlayerCardAvatars() {
    // Replace the API-generated avatar in the player card with the blook.
    // The <img> has id player-{id}-image.
    for (var p = 1; p <= 4; p++) {
      var avatar = document.getElementById('player-' + p + '-image');
      if (!avatar) continue;
      if (avatar.dataset.charSwapped === 'true') continue;
      var charId = chosenFor(p);
      avatar.onerror = null; // drop any earlier error handler
      avatar.src = charImage(charId);
      avatar.dataset.charSwapped = 'true';
      avatar.dataset.charId = charId;

      // winner-N-image too
      var winner = document.getElementById('winner-' + p + '-image');
      if (winner && winner.dataset.charSwapped !== 'true') {
        winner.onerror = null;
        winner.src = charImage(charId);
        winner.dataset.charSwapped = 'true';
      }
    }
  }

  function run() {
    swapPlayerCardAvatars();
    swapAll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
  // Re-run to catch late-rendered pieces (merge animations, revives)
  setTimeout(run, 300);
  setTimeout(run, 1200);
  setTimeout(run, 3000);

  // Run whenever a piece is moved/killed etc.
  document.addEventListener('piece-moved', run);
  document.addEventListener('game-countdown-complete', run);
})();
