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
    'gh1': 1, 'gh2': 1, 'gh3': 1, 'gh4': 1,
    'yh1': 2, 'yh2': 2, 'yh3': 2, 'yh4': 2,
    'rh1': 3, 'rh2': 3, 'rh3': 3, 'rh4': 3,
    'bh1': 4, 'bh2': 4, 'bh3': 4, 'bh4': 4,
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

  // Expose the runner so other systems (e.g. piece-watchdog) can
  // re-apply blook skins after they restore a vanished piece.
  window.__characterSwapRun = run;

  /**
   * Swap a single freshly-added img node immediately (no delay, no
   * flash). Used by the MutationObserver so a player never sees the
   * raw horse sprite flash before the blook swap catches up.
   */
  function swapSingle(img) {
    if (!img || img.dataset.charSwapped === 'true') return;
    var cls = Array.from(img.classList || []);
    for (var i = 0; i < cls.length; i++) {
      var playerId = CLASS_TO_PLAYER[cls[i]];
      if (playerId !== undefined) {
        var charId = chosenFor(playerId);
        img.src = charImage(charId);
        img.dataset.charSwapped = 'true';
        img.dataset.charId = charId;
        return;
      }
    }
  }

  /**
   * Observe the board + player homes for new piece <img> nodes so
   * we can swap them synchronously on insertion — eliminates the
   * brief horse-sprite flash during moves / merges / revives.
   */
  function startObserver() {
    var targets = [
      document.getElementById('ludo-board'),
      document.getElementById('game-container'),
      document.getElementById('player-1'),
      document.getElementById('player-2'),
      document.getElementById('player-3'),
      document.getElementById('player-4'),
    ].filter(Boolean);
    if (targets.length === 0) {
      // DOM not ready yet — retry shortly
      setTimeout(startObserver, 300);
      return;
    }

    var mo = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var added = mutations[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          var n = added[j];
          if (n.nodeType !== 1) continue;
          if (n.tagName === 'IMG') {
            swapSingle(n);
          } else if (n.querySelectorAll) {
            var imgs = n.querySelectorAll('img');
            for (var k = 0; k < imgs.length; k++) swapSingle(imgs[k]);
          }
        }
      }
    });
    targets.forEach(function (t) { mo.observe(t, { childList: true, subtree: true }); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { run(); startObserver(); });
  } else {
    run();
    startObserver();
  }
  // Re-run to catch late-rendered pieces (merge animations, revives)
  setTimeout(run, 300);
  setTimeout(run, 1200);
  setTimeout(run, 3000);

  // Run whenever a piece is moved/killed etc.
  document.addEventListener('piece-moved', run);
  document.addEventListener('game-countdown-complete', run);
})();
