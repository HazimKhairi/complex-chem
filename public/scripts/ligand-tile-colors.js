/*
 * ligand-tile-colors.js
 *
 * Applies the approved hex colours to every ligand tile on the board.
 * Runs on DOMContentLoaded so it finds tiles rendered by Astro + any
 * dynamically injected spans.
 *
 * Palette (from Hazim's spec):
 *   green           #0cc704
 *   yellow          #fcbc04
 *   red             #fc0404
 *   blue            #046cfc
 *   pastel green    #9cecc4
 *   pastel yellow   #f4e4a4
 *   pastel red      #f48c94
 *   pastel blue     #84e4fc
 *   pastel orange   #ec7c34  (explicitly for PPh₃)
 */

(function () {
  'use strict';

  // Ligand name (exact span text) → hex colour. Keep Unicode subscripts intact.
  var LIGAND_COLORS = {
    'H₂O':   '#84e4fc', // pastel blue — water
    'NH₃':   '#84e4fc', // pastel blue — ammonia
    'py':    '#f4e4a4', // pastel yellow
    'PPh₃':  '#ec7c34', // pastel orange — spec requirement
    'PPH₃':  '#ec7c34', // alt casing, safety
    'CN⁻':   '#fc0404', // bright red — cyanide warning
    'O²⁻':   '#fc0404', // bright red — oxide
    'CI':    '#9cecc4', // pastel green — chlorine (board uses "CI")
    'Cl':    '#9cecc4', // pastel green — chlorine (canonical)
    'Cl⁻':   '#9cecc4', // pastel green
    'ox':    '#f48c94', // pastel red
    'acac':  '#fcbc04', // yellow
    'CO₃²⁻': '#9cecc4', // pastel green — carbonate
    'phen':  '#0cc704', // bright green — phenanthroline
    'bipy':  '#046cfc', // bright blue — bipyridine
    'bpy':   '#046cfc', // alt spelling
    'en':    '#f4e4a4', // pastel yellow — ethylenediamine
    'EDTA':  '#046cfc', // bright blue
  };

  function applyColors() {
    // Grab every path tile — text is wrapped in a <span>
    var spans = document.querySelectorAll('.path td > span');
    var coloured = 0;

    spans.forEach(function (span) {
      // Skip spans that carry other roles (e.g. start label)
      if (span.classList.contains('start-label')) return;

      var text = (span.textContent || '').trim();
      if (!text) return;

      var color = LIGAND_COLORS[text];
      if (!color) return;

      var td = span.parentElement;
      if (!td) return;

      // Override any existing background. Use !important via style attr.
      td.style.setProperty('background-color', color, 'important');
      td.style.setProperty('background-image', 'none', 'important');
      td.classList.add('ligand-tile');

      // Make text readable — light tiles → dark text, vivid tiles → white text
      var isLight = /^#(f4e4a4|9cecc4|84e4fc|f48c94|fcbc04)/i.test(color);
      span.style.setProperty('color', isLight ? '#111' : '#fff', 'important');
      span.style.setProperty('font-weight', '700', 'important');
      span.style.setProperty('text-shadow', isLight
        ? '0 1px 0 rgba(255,255,255,0.6)'
        : '0 1px 2px rgba(0,0,0,0.45)', 'important');
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
  // Re-run after a tick in case tiles are injected late
  setTimeout(applyColors, 250);
  setTimeout(applyColors, 1000);
})();
