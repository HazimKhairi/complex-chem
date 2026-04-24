/*
 * auto-play.js — Demo/simulation driver.
 *
 * Runs ONLY when sessionStorage.simulation === "true" (set by the
 * /simulation landing page). It:
 *   - dismisses any objective/Level-2 intro overlay that sneaks in
 *   - presses Space on a timer to auto-roll the dice on the board
 *   - auto-submits random answers on question / fate / ligand modals
 *   - on Level 2 it clicks through each wizard step by itself
 *   - ends on the final podium with everything filled in
 *
 * Adds a "Demo Mode" pill top-left so the viewer knows it's a watch.
 */

(function () {
  'use strict';

  if (sessionStorage.getItem('simulation') !== 'true') return;

  var ON_BOARD = /game-board/.test(location.pathname);
  var ON_L2 = /level-2/.test(location.pathname);
  if (!ON_BOARD && !ON_L2) return;

  console.log('[auto-play] simulation mode engaged on', location.pathname);

  // --- "Demo Mode" pill + exit button ------------------------------
  function mountPill() {
    if (document.getElementById('demo-pill')) return;
    var pill = document.createElement('div');
    pill.id = 'demo-pill';
    pill.style.cssText = [
      'position:fixed', 'top:12px', 'left:12px', 'z-index:9999',
      'background:#1e3a8a', 'color:white', 'font-weight:800',
      'font-size:12px', 'letter-spacing:0.1em', 'padding:6px 10px',
      'border-radius:999px', 'box-shadow:0 4px 10px rgba(0,0,0,0.25)',
      'display:flex', 'gap:8px', 'align-items:center',
    ].join(';');
    pill.innerHTML =
      '<span style="width:8px;height:8px;background:#ef4444;border-radius:999px;animation:demo-blink 1s infinite"></span>' +
      '<span>DEMO MODE</span>' +
      '<button id="demo-exit" style="background:rgba(255,255,255,0.15);border:none;color:white;padding:2px 8px;border-radius:6px;margin-left:8px;cursor:pointer;font-weight:700;font-size:11px">Exit</button>';
    document.body.appendChild(pill);

    var style = document.createElement('style');
    style.textContent = '@keyframes demo-blink{0%,100%{opacity:1}50%{opacity:0.3}}';
    document.head.appendChild(style);

    document.getElementById('demo-exit').addEventListener('click', function () {
      sessionStorage.removeItem('simulation');
      location.href = '/';
    });
  }

  // --- Utilities ---------------------------------------------------
  function wait(ms) { return new Promise(function (res) { setTimeout(res, ms); }); }
  function rnd(lo, hi) { return Math.floor(Math.random() * (hi - lo + 1)) + lo; }
  function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function click(el) { if (el) el.click(); }
  function visible(el) {
    if (!el) return false;
    var s = window.getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden') return false;
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  // --- Modal dismisser: fires continuously during the whole run ----
  function handleModals() {
    // Objective modal (game-board) — already auto-dismissed via
    // sessionStorage.objective-seen, but be safe.
    var obj = document.getElementById('objective-modal');
    if (obj && visible(obj) && !obj.classList.contains('hidden')) {
      var next = document.getElementById('objective-next-btn');
      if (next) click(next);
    }

    var l2intro = document.getElementById('level2-intro-modal');
    if (l2intro && visible(l2intro) && !l2intro.classList.contains('hidden')) {
      var nb = document.getElementById('l2-next-btn');
      if (nb) click(nb);
    }

    // Question modal — pick random answer
    var q = document.getElementById('question-modal');
    if (q && visible(q) && !q.classList.contains('hidden')) {
      if (!q.dataset.autoAnswered) {
        var opts = q.querySelectorAll('.answer-option');
        if (opts.length > 0) {
          q.dataset.autoAnswered = '1';
          var pick = opts[Math.floor(Math.random() * opts.length)];
          setTimeout(function () { click(pick); }, 500);
          setTimeout(function () {
            var submit = document.getElementById('submit-answer-btn');
            if (submit) click(submit);
          }, 1500);
          // Then dismiss feedback after a beat
          setTimeout(function () {
            q.classList.add('hidden');
            q.classList.remove('flex');
            q.dataset.autoAnswered = '';
          }, 4000);
        }
      }
    }

    // Fate modal — accept
    var f = document.getElementById('fate-modal');
    if (f && visible(f) && !f.classList.contains('hidden')) {
      if (!f.dataset.autoAccepted) {
        f.dataset.autoAccepted = '1';
        setTimeout(function () {
          var acc = document.getElementById('continue-fate-btn');
          if (acc) click(acc);
          // Auto-close any swap modal that pops from fate
          setTimeout(function () {
            var swap = document.getElementById('swap-ligand-modal');
            if (swap && visible(swap)) {
              swap.classList.add('hidden');
              document.dispatchEvent(new Event('swap-cancelled'));
            }
          }, 600);
          f.dataset.autoAccepted = '';
        }, 1200);
      }
    }

    // Ligand modal — dismiss after a breath
    var l = document.getElementById('ligand-modal');
    if (l && visible(l) && !l.classList.contains('hidden')) {
      if (!l.dataset.autoDismissed) {
        l.dataset.autoDismissed = '1';
        setTimeout(function () {
          l.classList.add('hidden');
          l.classList.remove('flex');
          l.dataset.autoDismissed = '';
        }, 1500);
      }
    }

    // Info modal (e.g. "no ligands to swap") — dismiss
    var info = document.getElementById('info-modal');
    if (info && visible(info) && !info.classList.contains('hidden')) {
      setTimeout(function () {
        var close = info.querySelector('button');
        if (close) click(close);
      }, 700);
    }
  }

  // --- Board auto-play (Level 1) -----------------------------------
  async function runBoardSim() {
    // Wait for countdown to finish
    await new Promise(function (res) {
      if (!document.getElementById('game-start-countdown')) { res(); return; }
      var done = false;
      document.addEventListener('game-countdown-complete', function () { if (!done) { done = true; res(); } }, { once: true });
      setTimeout(function () { if (!done) { done = true; res(); } }, 8000);
    });

    await wait(600);

    var maxTurns = 120; // safety cap
    var turn = 0;

    while (turn < maxTurns) {
      turn++;

      // If winners modal appeared — we're done with Level 1
      var winners = document.getElementById('winners');
      if (winners && !winners.classList.contains('hidden')) {
        console.log('[auto-play] Level 1 complete');
        await wait(2500);
        var cont = document.getElementById('continue-level-2');
        if (cont && !cont.hasAttribute('disabled')) {
          click(cont);
          return;
        }
        // Gate still shown (solo: only 1 player, should be open immediately)
        await wait(1000);
        continue;
      }

      // Auto-press Space to roll — only when no modal is currently open
      var anyModalOpen = [
        'question-modal', 'fate-modal', 'ligand-modal', 'swap-ligand-modal', 'info-modal',
      ].some(function (id) {
        var el = document.getElementById(id);
        return el && !el.classList.contains('hidden') && visible(el);
      });

      if (!anyModalOpen) {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true }));
      }

      await wait(2400);
    }

    console.warn('[auto-play] hit turn cap, navigating to Level 2 manually');
    location.href = '/level-2';
  }

  // --- Level 2 auto-play -------------------------------------------
  async function runLevel2Sim() {
    await wait(1000);

    var safety = 0;
    while (safety++ < 200) {
      // Podium = done
      var podium = document.getElementById('l2-podium');
      if (podium && !podium.classList.contains('hidden')) {
        console.log('[auto-play] reached final podium');
        return;
      }

      // Figure out which step is rendered and drive it.
      var c = document.getElementById('step-container');
      if (!c) { await wait(500); continue; }

      // Step 1 — setup (metal + ligand picker)
      var metalCard = c.querySelector('.metal-card');
      var ligandPill = c.querySelector('.ligand-pill');
      if (metalCard && ligandPill) {
        // Pick first metal then pick ligands till CN in 3..6
        var metals = c.querySelectorAll('.metal-card');
        if (metals[0] && metals[0].getAttribute('aria-selected') !== 'true') {
          click(metals[0]);
          await wait(400);
        }
        var pills = c.querySelectorAll('.ligand-pill');
        for (var i = 0; i < pills.length && i < 3; i++) { click(pills[i]); await wait(250); }
        await wait(400);
        var nextBtn = c.querySelector('#nav-next, button:not([disabled])[data-next], button.bg-ludon-blue:not([disabled])');
        var nextBtns = Array.from(c.querySelectorAll('button'));
        var goBtn = nextBtns.find(function (b) { return /next|submit|continue/i.test(b.textContent || '') && !b.disabled; });
        if (goBtn) { click(goBtn); await wait(600); }
        continue;
      }

      // Q1 / Q2 / Q3 / Q4 picture / Q5 name — any set of buttons in a grid
      var typeOpts = c.querySelectorAll('.type-opt:not([disabled])');
      var cnOpts = c.querySelectorAll('.cn-opt:not([disabled])');
      var geoOpts = c.querySelectorAll('.geo-btn:not([disabled])');
      var picOpts = c.querySelectorAll('.geo-pic-btn:not([disabled])');

      var list = null;
      if (typeOpts.length) list = typeOpts;
      else if (cnOpts.length) list = cnOpts;
      else if (geoOpts.length) list = geoOpts;
      else if (picOpts.length) list = picOpts;

      if (list) {
        // Prefer any "correct-looking" one; we don't know, so just pick
        // the first. Wrong attempts still progress the wizard.
        click(list[0]);
        await wait(700);
        var submitBtn = Array.from(c.querySelectorAll('button')).find(function (b) {
          return /submit|next/i.test(b.textContent || '') && !b.disabled;
        });
        if (submitBtn) { click(submitBtn); await wait(900); }
        continue;
      }

      // Step 5 — 3D build. BoneBuilder slots are DOM objects in
      // Three.js canvas; easiest path is to call onPlace ourselves.
      if (window.BoneBuilder && typeof window.BoneBuilder.getEmptySlots === 'function') {
        try {
          // Rough auto-solver: for each empty slot, ask an inventory
          // pill to place itself.
          var pills2 = document.querySelectorAll('#ligand-inventory .ligand-pill, #ligand-inventory button, #ligand-inventory [draggable]');
          for (var k = 0; k < pills2.length; k++) { click(pills2[k]); await wait(300); }
        } catch (e) {}
      }
      var submit3d = document.getElementById('btn-submit-3d');
      if (submit3d && !submit3d.disabled) { click(submit3d); await wait(1200); continue; }

      // Maybe we're on the Complex Built / Next to Naming screen
      var navNext = Array.from(c.querySelectorAll('button')).find(function (b) {
        return /next/i.test(b.textContent || '') && !b.disabled;
      });
      if (navNext) { click(navNext); await wait(800); continue; }

      // Nothing to click — wait and loop
      await wait(800);
    }

    console.warn('[auto-play] Level 2 simulation hit safety cap');
  }

  // --- Main --------------------------------------------------------
  function start() {
    mountPill();

    // Run the modal watcher on an interval — it handles mid-run modals
    setInterval(handleModals, 500);

    if (ON_BOARD) runBoardSim();
    if (ON_L2) runLevel2Sim();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
