/*
 * Piece Watchdog — Layer 3 of the "horse can't disappear" defence.
 *
 * Layer 1: CSS z-index (animations.css) keeps the piece visually on
 *          top of every tile background / text layer.
 * Layer 2: auto-move-piece guards against moving onto a non-existent
 *          cell and auto-restores if the append silently fails.
 * Layer 3: THIS FILE — a MutationObserver + polling interval that
 *          continuously verifies each active player's piece is in
 *          the DOM. If a piece vanishes (stray remove, race, third
 *          party script), the watchdog puts it back at its last
 *          known path position or, failing that, back in its home
 *          circle.
 */

(function () {
  'use strict';

  // Only run on game-board pages
  if (!/game-board/.test(location.pathname)) return;

  var COLOR_FOR_PLAYER = { 1: 'red', 2: 'blue', 3: 'yellow', 4: 'green' };
  var LETTER_FOR_PLAYER = { 1: 'r', 2: 'b', 3: 'y', 4: 'g' };

  function getActivePlayerIds() {
    try {
      if (window.TurnManager && typeof window.TurnManager.getActivePlayers === 'function') {
        var ap = window.TurnManager.getActivePlayers();
        if (Array.isArray(ap) && ap.length > 0) return ap;
      }
    } catch (e) {}
    var opt = sessionStorage.getItem('game-option');
    if (opt === 'solo') {
      var horse = sessionStorage.getItem('solo-horse') || 'red';
      var map = { red: 1, blue: 2, yellow: 3, green: 4 };
      return [map[horse] || 1];
    }
    if (opt === 'one-vs-one') return [1, 4];
    if (opt === 'one-vs-two') return [1, 2, 3];
    if (opt === 'one-vs-three') return [1, 2, 3, 4];
    return [];
  }

  /**
   * Count how many times a player's piece appears in the DOM.
   * Looks across: home circle, path tiles, centre home (g57, r57, etc).
   */
  function findPiece(playerId) {
    var letter = LETTER_FOR_PLAYER[playerId];
    if (!letter) return null;

    var horseClass = letter + 'h1';
    var pieces = document.querySelectorAll('img.' + horseClass);
    return {
      count: pieces.length,
      elements: pieces,
      horseClass: horseClass,
      color: COLOR_FOR_PLAYER[playerId],
      letter: letter,
    };
  }

  /**
   * Restore a missing piece for `playerId` to its last known path
   * position, or home if we have no record.
   */
  function restorePiece(playerId) {
    var info = findPiece(playerId);
    if (!info || info.count > 0) return false; // only restore if missing

    var color = info.color;
    var horseClass = info.horseClass;
    var letter = info.letter;

    // Where should it go? Prefer last known lastPos{L}H1, else home.
    var posVar = 'lastPos' + letter.toUpperCase() + 'H1';
    var lastPos = Number(window[posVar]);
    var placed = false;

    if (lastPos >= 1 && lastPos <= 57) {
      var pathCell = document.querySelector('.' + letter + lastPos);
      if (pathCell) {
        var img = document.createElement('img');
        img.className = horseClass + ' ' + color;
        img.src = '/horses/' + color + '.png';
        pathCell.appendChild(img);

        // Let character-swap.js swap it to a blook on its next pass
        if (img) img.dataset.charSwapped = '';

        console.warn('[watchdog] Restored missing Player ' + playerId + ' piece at path cell ' + letter + lastPos);
        placed = true;
      }
    }

    if (!placed) {
      // Fallback — return to home
      var home = document.getElementById('player-' + playerId);
      if (home) {
        var homeInner = home.querySelector('.bg-gray-200') || home;
        var img2 = document.createElement('img');
        img2.className = horseClass + ' ' + color + ' w-5 sm:w-[22px] md:w-6 lg:w-[26px]';
        img2.src = '/horses/' + color + '.png';
        img2.dataset.charSwapped = '';
        homeInner.appendChild(img2);
        window[posVar] = 0;
        console.warn('[watchdog] Restored missing Player ' + playerId + ' piece to home (no lastPos)');
        placed = true;
      }
    }

    // Re-trigger the blook swap so the restored piece uses the chosen character
    if (placed && typeof window.__characterSwapRun === 'function') {
      try { window.__characterSwapRun(); } catch (e) {}
    }

    return placed;
  }

  /** Run a full sweep: every active player should have exactly 1 piece. */
  function sweep() {
    var players = getActivePlayerIds();
    players.forEach(function (pid) {
      var info = findPiece(pid);
      if (!info) return;
      if (info.count === 0) {
        restorePiece(pid);
      }
      // count > 1 is handled elsewhere (merge logic / kill logic) and
      // isn't inherently a bug, so the watchdog stays quiet.
    });
  }

  // --- Trigger: MutationObserver on the board ------------------------------
  // Fire a debounced sweep whenever an <img> descendant is removed from the
  // board. This catches "piece silently vanished" in O(1).
  var debounceTimer = null;
  function scheduleSweep() {
    if (debounceTimer) return;
    debounceTimer = setTimeout(function () {
      debounceTimer = null;
      sweep();
    }, 120);
  }

  function observeBoard() {
    var board = document.getElementById('ludo-board')
             || document.getElementById('game-container')
             || document.body;
    if (!board) return;

    var observer = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var m = mutations[i];
        // Only care about removed <img> nodes
        if (m.removedNodes && m.removedNodes.length > 0) {
          for (var j = 0; j < m.removedNodes.length; j++) {
            var n = m.removedNodes[j];
            if (n.nodeType === 1 && (n.tagName === 'IMG' || n.querySelector && n.querySelector('img'))) {
              scheduleSweep();
              return;
            }
          }
        }
      }
    });
    observer.observe(board, { childList: true, subtree: true });
  }

  // --- Trigger: periodic poll (belt + braces) ------------------------------
  // Covers any edge case the observer missed (detached subtrees, iframes, etc).
  function startPolling() {
    setInterval(sweep, 2000);
  }

  // --- Trigger: every piece-moved event ------------------------------------
  function listenPieceEvents() {
    document.addEventListener('piece-moved', function () { scheduleSweep(); });
    document.addEventListener('game-countdown-complete', function () {
      setTimeout(sweep, 500);
    });
  }

  function start() {
    observeBoard();
    startPolling();
    listenPieceEvents();
    // Expose for manual debugging
    window.__pieceWatchdog = { sweep: sweep, restore: restorePiece, find: findPiece };
    console.log('[watchdog] Piece integrity watchdog armed');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
