/*
 * ligand-tile-colors.js
 *
 * Applies the approved hex colours to every ligand tile on the board.
 * Source of truth = the official Indicator table (image #14):
 *   H₂O Red · NH₃ Blue · py Blue · PPh₃ Orange · CN⁻ Blue · O²⁻ Red
 *   Cl Green · ox Red · acac Red · CO₃²⁻ Red · phen Blue · bipy Blue · en Blue
 */

(function () {
  'use strict';

  var RED = '#fc0404';
  var BLUE = '#046cfc';
  var GREEN = '#0cc704';
  var ORANGE = '#f97316';

  // Uniform map — every instance of a ligand on the board takes the
  // same colour as the indicator table specifies.
  var LIGAND_COLORS = {
    'H₂O':   RED,
    'NH₃':   BLUE,
    'py':    BLUE,
    'PPh₃':  ORANGE,
    'CN⁻':   BLUE,
    'O²⁻':   RED,
    'Cl':    GREEN,
    'Cl⁻':   GREEN,
    'ox':    RED,
    'acac':  RED,
    'CO₃²⁻': RED,
    'phen':  BLUE,
    'bipy':  BLUE,
    'en':    BLUE,
    'EDTA':  BLUE,
  };

  function applyColors() {
    var spans = document.querySelectorAll('.path td > span');
    var coloured = 0;

    spans.forEach(function (span) {
      if (span.classList.contains('start-label')) return;

      var text = (span.textContent || '').trim();
      if (!text) return;

      var color = LIGAND_COLORS[text];
      if (!color) return;

      var td = span.parentElement;
      if (!td) return;

      td.style.setProperty('background-color', color, 'important');
      td.style.setProperty('background-image', 'none', 'important');
      td.classList.add('ligand-tile');

      // All four indicator colours (red/blue/green/orange) are mid-to-
      // dark saturated → white text with a dark shadow reads on every one.
      span.style.setProperty('color', '#fff', 'important');
      span.style.setProperty('font-weight', '900', 'important');
      span.style.setProperty('text-shadow', '0 1px 2px rgba(0,0,0,0.55)', 'important');
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
