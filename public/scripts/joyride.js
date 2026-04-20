/**
 * Joyride Walkthrough Engine
 * Pure vanilla JS — no external dependencies
 * Exposes window.Joyride with start(), startLevel1(), startLevel2(), stop()
 */
(function () {
  'use strict';

  var currentSteps = [];
  var currentIndex = 0;
  var overlayEl = null;
  var cutoutEl = null;
  var tooltipEl = null;
  var styleEl = null;
  var resizeHandler = null;
  var completionKey = null;

  // ── CSS injected once ──────────────────────────────────────────────
  var CSS = [
    '#joyride-overlay{position:fixed;top:0;left:0;width:100%;height:100%;z-index:99990;pointer-events:auto;}',
    '#joyride-cutout{position:fixed;z-index:99990;border-radius:4px;box-shadow:0 0 0 9999px rgba(0,0,0,0.6);pointer-events:none;transition:top 0.25s ease,left 0.25s ease,width 0.25s ease,height 0.25s ease;}',
    '#joyride-tooltip{position:fixed;z-index:99991;background:#fff;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.25);max-width:300px;padding:16px;font-family:system-ui,-apple-system,sans-serif;font-size:14px;line-height:1.5;color:#1a1a1a;}',
    '#joyride-tooltip .jt-title{font-weight:700;font-size:15px;margin-bottom:6px;}',
    '#joyride-tooltip .jt-text{margin-bottom:10px;color:#444;}',
    '#joyride-tooltip .jt-counter{font-size:12px;color:#888;margin-bottom:12px;}',
    '#joyride-tooltip .jt-buttons{display:flex;gap:8px;justify-content:flex-end;}',
    '#joyride-tooltip .jt-btn{padding:6px 14px;border:none;border-radius:4px;cursor:pointer;font-size:13px;font-weight:600;}',
    '#joyride-tooltip .jt-btn-back{background:#e5e7eb;color:#374151;}',
    '#joyride-tooltip .jt-btn-back:disabled{opacity:0.4;cursor:default;}',
    '#joyride-tooltip .jt-btn-next{background:#2563eb;color:#fff;}',
    '#joyride-tooltip .jt-btn-skip{background:transparent;color:#888;font-weight:400;}',
    '#joyride-arrow{position:absolute;width:0;height:0;border:8px solid transparent;}',
    '#joyride-arrow.arrow-top{bottom:100%;left:50%;transform:translateX(-50%);border-bottom-color:#fff;}',
    '#joyride-arrow.arrow-bottom{top:100%;left:50%;transform:translateX(-50%);border-top-color:#fff;}',
    '#joyride-arrow.arrow-left{right:100%;top:50%;transform:translateY(-50%);border-right-color:#fff;}',
    '#joyride-arrow.arrow-right{left:100%;top:50%;transform:translateY(-50%);border-left-color:#fff;}'
  ].join('\n');

  // ── Helpers ────────────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('joyride-styles')) return;
    styleEl = document.createElement('style');
    styleEl.id = 'joyride-styles';
    styleEl.textContent = CSS;
    document.head.appendChild(styleEl);
  }

  function removeStyles() {
    var el = document.getElementById('joyride-styles');
    if (el) el.parentNode.removeChild(el);
    styleEl = null;
  }

  function createOverlay() {
    overlayEl = document.createElement('div');
    overlayEl.id = 'joyride-overlay';
    overlayEl.addEventListener('click', function (e) { e.stopPropagation(); });
    document.body.appendChild(overlayEl);

    cutoutEl = document.createElement('div');
    cutoutEl.id = 'joyride-cutout';
    document.body.appendChild(cutoutEl);

    tooltipEl = document.createElement('div');
    tooltipEl.id = 'joyride-tooltip';
    document.body.appendChild(tooltipEl);
  }

  function removeElements() {
    ['joyride-overlay', 'joyride-cutout', 'joyride-tooltip'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.parentNode.removeChild(el);
    });
    overlayEl = null;
    cutoutEl = null;
    tooltipEl = null;
  }

  function getRect(selector) {
    var el = document.querySelector(selector);
    if (!el) return null;
    return el.getBoundingClientRect();
  }

  function positionCutout(rect) {
    var pad = 6;
    cutoutEl.style.top = (rect.top - pad) + 'px';
    cutoutEl.style.left = (rect.left - pad) + 'px';
    cutoutEl.style.width = (rect.width + pad * 2) + 'px';
    cutoutEl.style.height = (rect.height + pad * 2) + 'px';
  }

  function positionTooltip(rect, position) {
    var gap = 14;
    var tw = tooltipEl.offsetWidth;
    var th = tooltipEl.offsetHeight;
    var top, left;
    var arrowClass = '';

    switch (position) {
      case 'top':
        top = rect.top - th - gap;
        left = rect.left + rect.width / 2 - tw / 2;
        arrowClass = 'arrow-bottom';
        break;
      case 'left':
        top = rect.top + rect.height / 2 - th / 2;
        left = rect.left - tw - gap;
        arrowClass = 'arrow-right';
        break;
      case 'right':
        top = rect.top + rect.height / 2 - th / 2;
        left = rect.right + gap;
        arrowClass = 'arrow-left';
        break;
      default: // bottom
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2 - tw / 2;
        arrowClass = 'arrow-top';
        break;
    }

    // Clamp to viewport
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    if (left < 8) left = 8;
    if (left + tw > vw - 8) left = vw - tw - 8;
    if (top < 8) top = 8;
    if (top + th > vh - 8) top = vh - th - 8;

    tooltipEl.style.top = top + 'px';
    tooltipEl.style.left = left + 'px';

    var arrow = tooltipEl.querySelector('#joyride-arrow');
    if (arrow) arrow.className = arrowClass;
  }

  function renderStep() {
    // Skip steps with missing targets
    while (currentIndex < currentSteps.length) {
      var step = currentSteps[currentIndex];
      var rect = getRect(step.target);
      if (rect) break;
      currentIndex++;
    }

    if (currentIndex >= currentSteps.length) {
      complete();
      return;
    }

    var step = currentSteps[currentIndex];
    var rect = getRect(step.target);
    var pos = step.position || 'bottom';
    var total = currentSteps.length;
    var isFirst = currentIndex === 0;
    var isLast = currentIndex === total - 1;

    // Scroll target into view if needed
    var targetEl = document.querySelector(step.target);
    if (targetEl && typeof targetEl.scrollIntoView === 'function') {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Refresh rect after possible scroll
    setTimeout(function () {
      rect = getRect(step.target);
      if (!rect) { currentIndex++; renderStep(); return; }

      positionCutout(rect);

      tooltipEl.innerHTML =
        '<div id="joyride-arrow"></div>' +
        '<div class="jt-title">' + escapeHtml(step.title) + '</div>' +
        '<div class="jt-text">' + escapeHtml(step.text) + '</div>' +
        '<div class="jt-counter">Step ' + (currentIndex + 1) + ' of ' + total + '</div>' +
        '<div class="jt-buttons">' +
          '<button class="jt-btn jt-btn-skip" data-action="skip">Skip</button>' +
          '<button class="jt-btn jt-btn-back" data-action="back"' + (isFirst ? ' disabled' : '') + '>Back</button>' +
          '<button class="jt-btn jt-btn-next" data-action="next">' + (isLast ? 'Done' : 'Next') + '</button>' +
        '</div>';

      tooltipEl.querySelectorAll('.jt-btn').forEach(function (btn) {
        btn.addEventListener('click', handleButton);
      });

      positionTooltip(rect, pos);
    }, 60);
  }

  function escapeHtml(str) {
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function handleButton(e) {
    var action = e.target.getAttribute('data-action');
    if (action === 'skip') {
      stop();
    } else if (action === 'back') {
      if (currentIndex > 0) {
        currentIndex--;
        // Skip backward over missing targets
        while (currentIndex > 0 && !getRect(currentSteps[currentIndex].target)) {
          currentIndex--;
        }
        renderStep();
      }
    } else if (action === 'next') {
      if (currentIndex >= currentSteps.length - 1) {
        complete();
      } else {
        currentIndex++;
        renderStep();
      }
    }
  }

  function complete() {
    if (completionKey) {
      localStorage.setItem(completionKey, 'true');
    }
    cleanup();
  }

  function cleanup() {
    if (resizeHandler) {
      window.removeEventListener('resize', resizeHandler);
      resizeHandler = null;
    }
    removeElements();
    removeStyles();
    currentSteps = [];
    currentIndex = 0;
    completionKey = null;
  }

  function stop() {
    cleanup();
  }

  // ── Public API ─────────────────────────────────────────────────────
  function start(steps, lsKey) {
    if (!steps || !steps.length) return;

    // Clean up any running walkthrough
    cleanup();

    currentSteps = steps;
    currentIndex = 0;
    completionKey = lsKey || null;

    injectStyles();
    createOverlay();

    resizeHandler = function () {
      if (currentSteps.length === 0) return;
      var step = currentSteps[currentIndex];
      if (!step) return;
      var rect = getRect(step.target);
      if (!rect) return;
      positionCutout(rect);
      positionTooltip(rect, step.position || 'bottom');
    };
    window.addEventListener('resize', resizeHandler);

    renderStep();
  }

  function startLevel1() {
    start([
      { target: '.player-dice', title: 'Roll the Dice', text: 'Click the dice or press Space to roll and move your piece.', position: 'bottom' },
      { target: '#ludo-board', title: 'Game Board', text: 'Your piece moves along the path collecting ligands and answering questions.', position: 'top' },
      { target: '#player-1', title: 'Player Card', text: 'Shows your player name and current score.', position: 'right' },
      { target: '#ligand-display-1', title: 'Ligand Collection', text: 'Collected ligands appear here. Click to view details.', position: 'right' },
      { target: '.path td.bg-red-300', title: 'Special Tiles', text: 'Colored tiles trigger questions, fate cards, or ligand collection.', position: 'top' },
      { target: '.r57', title: 'Home', text: 'Get your piece to the center home area to complete Level 1.', position: 'top' }
    ], 'joyride-l1-done');
  }

  function startLevel2() {
    start([
      { target: '#step-container', title: 'Choose Metal', text: 'Select a central metal ion for your complex.', position: 'bottom' },
      { target: '.step-dot', title: 'Step Progress', text: 'Track your progress through the 4 steps.', position: 'bottom' },
      { target: '#builder-container', title: '3D Builder', text: 'Drag ligands from your inventory onto the 3D model slots.', position: 'top' },
      { target: '#l2-score', title: 'Level 2 Score', text: 'Your points for each step are shown here.', position: 'top' }
    ], 'joyride-l2-done');
  }

  // ── Expose ─────────────────────────────────────────────────────────
  window.Joyride = {
    start: start,
    startLevel1: startLevel1,
    startLevel2: startLevel2,
    stop: stop
  };
})();
