/*
 * ligand-tile-colors.js
 *
 * Applies the approved hex colours to every ligand tile on the board.
 * Runs on DOMContentLoaded so it finds tiles rendered by Astro + any
 * dynamically injected spans.
 *
 * Palette (Hazim spec — saturated home colours):
 *   green   #0cc704
 *   yellow  #fcbc04
 *   red     #fc0404
 *   blue    #046cfc
 */

(function () {
  'use strict';

  var RED = '#fc0404';
  var BLUE = '#046cfc';
  var GREEN = '#0cc704';
  var YELLOW = '#fcbc04';

  // Uniform ligands — single colour, applies to every instance on board.
  var LIGAND_COLORS = {
    'H₂O':   RED,
    'NH₃':   BLUE,
    'py':    BLUE,
    'CN⁻':   YELLOW,
    'O²⁻':   BLUE,
    'CO₃²⁻': YELLOW,
    'phen':  RED,
    'en':    GREEN,
    'EDTA':  BLUE,
  };

  // Per-instance overrides — same ligand has 2 board tiles, each gets a
  // different colour. Keyed by the unique cell class on each <td>.
  var CELL_OVERRIDES = {
    // ox
    'g7':  BLUE,    // top arm
    'g33': RED,     // bottom arm
    // PPh₃
    'g16': YELLOW,  // top arm
    'g44': RED,     // bottom arm
    // bipy
    'g6':  BLUE,    // top arm
    'g19': YELLOW,  // right arm
    // Cl
    'g17': BLUE,    // top arm
    'g43': GREEN,   // bottom arm
    // acac
    'g49': GREEN,   // left arm
    'g23': YELLOW,  // right arm
  };

  function colorForCell(td, ligandText) {
    // Cell-class override wins over name lookup.
    var classes = td.className.split(/\s+/);
    for (var i = 0; i < classes.length; i++) {
      if (CELL_OVERRIDES[classes[i]]) return CELL_OVERRIDES[classes[i]];
    }
    return LIGAND_COLORS[ligandText] || null;
  }

  function applyColors() {
    var spans = document.querySelectorAll('.path td > span');
    var coloured = 0;

    spans.forEach(function (span) {
      if (span.classList.contains('start-label')) return;

      var text = (span.textContent || '').trim();
      if (!text) return;

      var td = span.parentElement;
      if (!td) return;

      var color = colorForCell(td, text);
      if (!color) return;

      td.style.setProperty('background-color', color, 'important');
      td.style.setProperty('background-image', 'none', 'important');
      td.classList.add('ligand-tile');

      // All home colours are saturated → use white text + dark shadow,
      // EXCEPT yellow (#fcbc04) is light enough that dark text reads better.
      var isLight = color.toLowerCase() === YELLOW.toLowerCase();
      span.style.setProperty('color', isLight ? '#111' : '#fff', 'important');
      span.style.setProperty('font-weight', '900', 'important');
      span.style.setProperty('text-shadow', isLight
        ? '0 1px 0 rgba(255,255,255,0.6)'
        : '0 1px 2px rgba(0,0,0,0.55)', 'important');
      coloured++;
    });

    if (coloured > 0) {
      console.log('[ligand-tile-colors] coloured ' + coloured + ' ligand tile(s)');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyColors);
  } else {
    applyColors();
  }
  setTimeout(applyColors, 250);
  setTimeout(applyColors, 1000);
})();
