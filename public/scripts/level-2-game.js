/* ============================================================
   Level 2 — Build Your Complex  (level-2-game.js)
   4-step wizard: Metal → Geometry → 3D Build → Name
   ============================================================ */

(function () {
  "use strict";

  // Chat-bubble tail for Q2 info bubbles. Injected once so the speech-
  // shape pointer renders without needing a separate stylesheet.
  if (typeof document !== "undefined" && !document.getElementById("l2-chat-bubble-style")) {
    var s = document.createElement("style");
    s.id = "l2-chat-bubble-style";
    s.textContent = ''
      + '.q2-chat-bubble{position:relative;}'
      + '.q2-chat-bubble::after{content:"";position:absolute;bottom:-10px;left:28px;width:0;height:0;'
      + '  border-left:10px solid transparent;border-right:10px solid transparent;border-top:12px solid #3b56a0;'
      + '  filter:drop-shadow(0 1px 0 rgba(0,0,0,0.05));}'
      + '.q2-chat-bubble{animation:q2-bubble-in 220ms cubic-bezier(.2,.7,.2,1);}'
      + '@keyframes q2-bubble-in{from{opacity:0;transform:translateY(-6px) scale(.96);}to{opacity:1;transform:translateY(0) scale(1);}}';
    document.head.appendChild(s);
  }

  // ── Chemistry Data ───────────────────────────────────────

  // bond  = donor atom shown on the 3D sphere ("Shape sphere bond")
  // image = filename in /public/assets/ligand-cards/ used by the
  //         click-to-open card popup (logo half + description half)
  var LIGAND_CHEMISTRY = {
    h2o:  { name: "H\u2082O",    charge: 0,  denticity: 1, type: "Monodentate", sphere: "red",    bond: "O",  image: "1.png"  },
    nh3:  { name: "NH\u2083",    charge: 0,  denticity: 1, type: "Monodentate", sphere: "blue",   bond: "N",  image: "2.png"  },
    py:   { name: "py",          charge: 0,  denticity: 1, type: "Monodentate", sphere: "blue",   bond: "N",  image: "3.png"  },
    pph3: { name: "PPh\u2083",   charge: 0,  denticity: 1, type: "Monodentate", sphere: "orange", bond: "P",  image: "4.png"  },
    cn:   { name: "CN\u207B",    charge: -1, denticity: 1, type: "Monodentate", sphere: "blue",   bond: "N",  image: "5.png"  },
    o2:   { name: "O\u00B2\u207B", charge: -2, denticity: 1, type: "Monodentate", sphere: "red",  bond: "O",  image: "6.png"  },
    cl:   { name: "Cl\u207B",   charge: -1, denticity: 1, type: "Monodentate", sphere: "green",   bond: "Cl", image: "7.png"  },
    ox:   { name: "Ox\u00B2\u207B",  charge: -2, denticity: 2, type: "Bidentate", sphere: "red",  bond: "O",  image: "8.png"  },
    acac: { name: "acac\u207B", charge: -1, denticity: 2, type: "Bidentate",  sphere: "red",      bond: "O",  image: "9.png"  },
    co32: { name: "CO\u2083\u00B2\u207B", charge: -2, denticity: 2, type: "Bidentate", sphere: "red", bond: "O", image: "10.png" },
    phen: { name: "phen",       charge: 0,  denticity: 2, type: "Bidentate",  sphere: "blue",     bond: "N",  image: "11.png" },
    bipy: { name: "bipy",       charge: 0,  denticity: 2, type: "Bidentate",  sphere: "blue",     bond: "N",  image: "12.png" },
    en:   { name: "en",         charge: 0,  denticity: 2, type: "Bidentate",  sphere: "blue",     bond: "N",  image: "13.png" },
  };

  var CENTRAL_METALS = [
    { name: "Co\u00B3\u207A", id: "co3", charge: 3 },
    { name: "Cr\u00B3\u207A", id: "cr3", charge: 3 },
    { name: "Fe\u00B3\u207A", id: "fe3", charge: 3 },
    { name: "Cu\u00B2\u207A", id: "cu2", charge: 2 },
    { name: "Ni\u00B2\u207A", id: "ni2", charge: 2 },
    { name: "Zn\u00B2\u207A", id: "zn2", charge: 2 },
  ];

  var GEOMETRY_MAP = {
    3: ["Trigonal planar"],
    4: ["Tetrahedral", "Square planar"],
    5: ["Trigonal bipyramidal", "Square pyramidal"],
    6: ["Octahedral"],
  };

  var ALL_GEOMETRIES = [
    "Trigonal planar", "Tetrahedral", "Square planar",
    "Trigonal bipyramidal", "Square pyramidal", "Octahedral",
  ];

  // Image + CN tag for the Step 4 geometry picker. Files live under
  // /public/assets/geometry/ — names match GEOMETRY_MAP exactly.
  var GEOMETRY_META = {
    "Trigonal planar":      { img: "/assets/geometry/trigonal-planar.png",      cn: 3 },
    "Tetrahedral":          { img: "/assets/geometry/tetrahedral.png",          cn: 4 },
    "Square planar":        { img: "/assets/geometry/square-planar.png",        cn: 4 },
    "Trigonal bipyramidal": { img: "/assets/geometry/trigonal-bipyramidal.png", cn: 5 },
    "Square pyramidal":     { img: "/assets/geometry/square-pyramidal.png",     cn: 5 },
    "Octahedral":           { img: "/assets/geometry/octahedral.png",           cn: 6 },
  };

  var SPHERE_COLORS_CSS = {
    red: "#EF4444", blue: "#3B82F6", orange: "#F97316", green: "#10B981",
  };

  var LIGAND_IUPAC = {
    h2o: "aqua", nh3: "ammine", py: "pyridine", pph3: "triphenylphosphine",
    cn: "cyano", o2: "oxo", cl: "chlorido", ox: "oxalato",
    acac: "acetylacetonato", co32: "carbonato", phen: "phenanthroline",
    bipy: "bipyridine", en: "ethylenediamine",
  };

  var NUMBER_PREFIX = {
    1: "", 2: "di", 3: "tri", 4: "tetra", 5: "penta", 6: "hexa",
  };

  // IUPAC rule: use bis/tris/tetrakis for ligand names that already have a
  // numerical/Greek prefix or are otherwise complex (e.g. ethylenediamine),
  // wrapping the ligand name in parentheses.
  var COMPLEX_PREFIX = {
    1: "", 2: "bis", 3: "tris", 4: "tetrakis", 5: "pentakis", 6: "hexakis",
  };
  var COMPLEX_LIGAND_IDS = { en: 1, bipy: 1, phen: 1, acac: 1, pph3: 1 };

  // ── Game State ──────────────────────────────────────────

  var gameState = null;
  var gameOption = "one-vs-one";
  var playerLigands = [];

  var level2State = {
    playerId: null,
    playerName: "",
    selectedMetal: null,
    selectedGeometry: null,
    geometryAttempts: 0,
    geometryScore: 0,
    geometryDone: false,
    buildAttempts: 0,
    buildScore: 0,
    buildDone: false,
    setupScore: 0,
    setupAwarded: false,
    level2Score: 0,
    /** Indices into playerLigands selected by the user in Step 1. */
    selectedLigandIdxs: [],
    /** Q1 — type of complex (neutral/anion/cation). */
    typeAnswer: null,
    typeScore: 0,
    typeAttempts: 0,
    typeDone: false,
  };

  var currentStep = 1;

  // ── Persistence ─────────────────────────────────────────
  // Level 2 progress is keyed per-player so that pass-and-play sessions
  // don't bleed state across players. Saved on every render; restored
  // on init; cleared once the player finishes.

  var L2_SCHEMA_V = 1;

  function level2StorageKey() {
    return "level2-state-" + (level2State.playerId || "1");
  }

  function saveLevel2State() {
    try {
      sessionStorage.setItem(level2StorageKey(), JSON.stringify({
        v: L2_SCHEMA_V,
        currentStep: currentStep,
        level2State: level2State,
        savedAt: Date.now(),
      }));
    } catch (e) {}
  }

  function restoreLevel2State() {
    try {
      var raw = sessionStorage.getItem(level2StorageKey());
      if (!raw) return false;
      var snap = JSON.parse(raw);
      if (!snap || snap.v !== L2_SCHEMA_V || !snap.level2State) return false;
      // Preserve the freshly-resolved playerId/playerName from init() —
      // they reflect the *current* device, not the snapshotted player.
      var keepId = level2State.playerId;
      var keepName = level2State.playerName;
      Object.assign(level2State, snap.level2State, {
        playerId: keepId, playerName: keepName,
      });
      currentStep = Number(snap.currentStep) || 1;
      return true;
    } catch (e) { return false; }
  }

  function clearLevel2State() {
    try { sessionStorage.removeItem(level2StorageKey()); } catch (e) {}
  }

  // ── Init ────────────────────────────────────────────────

  function init() {
    try {
      gameState = JSON.parse(sessionStorage.getItem("game-state"));
    } catch (e) {
      window.location.href = "/pass-and-play"; return;
    }
    if (!gameState) { window.location.href = "/pass-and-play"; return; }

    // The 3D builder dispatches this when it refuses a placement (e.g.
    // bidentate dropped on the only free slot, with no partner left).
    // Surface a quick red toast instead of a silent ignore.
    document.addEventListener("ligand-place-rejected", function (e) {
      var reason = (e.detail && e.detail.reason) || "";
      var msg = "Cannot place that here.";
      if (reason === "no-bidentate-partner") {
        msg = "Bidentate ligand needs 2 free slots — fill another slot first.";
      }
      showLevel2Toast(msg, "error");
      if (window.AudioManager) window.AudioManager.play("wrong");
    });

    gameOption = sessionStorage.getItem("game-option") || "one-vs-one";

    var pl = gameState.playerLigands || {};
    for (var id in pl) {
      if (pl[id] && pl[id].length > 0) {
        level2State.playerId = id;
        playerLigands = pl[id];
        break;
      }
    }
    if (!level2State.playerId) {
      level2State.playerId = "1";
      playerLigands = [];
    }

    // Resolve player name. Solo / simulation modes don't write
    // "solo-player-{N}-name" — they use "solo-player-name" (no slot
    // suffix) and also "one-vs-one-player-1-name". Fall back through
    // the candidates before defaulting to "Player N".
    var nameCandidates = [
      gameOption + "-player-" + level2State.playerId + "-name",
      "solo-player-name",
      "one-vs-one-player-1-name",
    ];
    var foundName = null;
    for (var ni = 0; ni < nameCandidates.length; ni++) {
      var v = sessionStorage.getItem(nameCandidates[ni]);
      if (v) { foundName = v; break; }
    }
    level2State.playerName = foundName || ("Player " + level2State.playerId);

    var info = document.getElementById("player-info");
    if (info) info.textContent = level2State.playerName + " \u2014 " + playerLigands.length + " ligand(s) collected";

    // Show message if no ligands collected
    if (playerLigands.length === 0) {
      var c = $("step-container");
      if (c) {
        c.innerHTML = '<div class="text-center py-12">'
          + '<div class="text-5xl mb-4">&#9888;</div>'
          + '<h2 class="text-xl font-bold text-gray-800 mb-3">No Ligands Collected</h2>'
          + '<p class="text-gray-600 mb-6">You need to collect ligands in Level 1 before building a complex in Level 2.</p>'
          + '<a href="/pass-and-play" class="inline-block px-6 py-3 rounded-lg bg-[#4187a0] text-white font-semibold hover:bg-[#357a91] transition">Play Level 1</a>'
          + '</div>';
      }
      updateScoreBar();
      return;
    }

    var resumed = restoreLevel2State();
    updateScoreBar();
    renderStep(resumed ? (currentStep || 1) : 1);
    if (resumed) showResumeToast();
  }

  function showResumeToast() {
    var el = document.createElement("div");
    el.className = "fixed top-4 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold shadow-lg transition-opacity";
    el.textContent = "Resumed your progress.";
    document.body.appendChild(el);
    setTimeout(function () { el.style.opacity = "0"; }, 2000);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 2600);
  }

  /**
   * Generic Level 2 toast — used for non-points feedback like
   * "Bidentate ligand needs 2 free slots". Floats top-centre, fades
   * after ~2.5 s. kind = "error" | "info" | "success".
   */
  function showLevel2Toast(message, kind) {
    var palette = {
      error:   "bg-red-500 text-white",
      info:    "bg-slate-800 text-white",
      success: "bg-emerald-600 text-white",
    };
    var cls = palette[kind] || palette.info;
    var el = document.createElement("div");
    el.className = "fixed top-6 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2.5 rounded-xl text-sm font-semibold shadow-2xl transition-opacity " + cls;
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(function () { el.style.opacity = "0"; }, 2200);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 2800);
  }

  /**
   * Bouncy "You earned +N points" toast — shown after a correct answer
   * before the next step renders. Plays the correct chime too.
   */
  function showPointsToast(points, label) {
    if (window.AudioManager) window.AudioManager.play("correct");
    if (!points || points <= 0) return;
    var el = document.createElement("div");
    el.className = "l2-points-toast";
    el.innerHTML = ''
      + '<div class="l2-points-toast-inner">'
      +   '<span class="l2-points-toast-label">' + (label || "You earned") + '</span>'
      +   '<span class="l2-points-toast-num">+' + points + ' pts</span>'
      + '</div>';
    document.body.appendChild(el);
    // Cleanup after the bounce + fade animation finishes.
    setTimeout(function () { el.classList.add("l2-points-toast-fade"); }, 1200);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 1800);
  }

  // ── Helpers ─────────────────────────────────────────────

  function $(id) { return document.getElementById(id); }

  function updateStepIndicator(step) {
    var dots = document.querySelectorAll(".step-dot");
    var lines = document.querySelectorAll(".step-line");
    dots.forEach(function (d, i) {
      var n = i + 1;
      d.classList.remove("active", "done");
      if (n < step) d.classList.add("done");
      else if (n === step) d.classList.add("active");
    });
    lines.forEach(function (l, i) {
      l.classList.remove("done");
      if (i + 1 < step) l.classList.add("done");
    });
  }

  function updateScoreBar() {
    var l1 = 0;
    if (gameState && gameState.playerPoints) l1 = gameState.playerPoints[level2State.playerId] || 0;
    var l2 = level2State.level2Score;
    var el1 = $("l1-score"); if (el1) el1.textContent = l1;
    var el2 = $("l2-score"); if (el2) el2.textContent = l2;
    var et  = $("total-score"); if (et) et.textContent = l1 + l2;
  }

  // Sphere colour name → CSS background.
  var SPHERE_COLOR_CSS = {
    red:    '#ef4444',
    blue:   '#3b82f6',
    orange: '#f97316',
    green:  '#10b981',
  };

  /**
   * Renders the always-visible "Your collected ligands" strip above the
   * step container. Groups duplicates with × count, shows each ligand's
   * sphere colour + bond atom + denticity tag so players can reference
   * what they have without leaving the current step.
   */
  function renderCollectedLigandsStrip(step) {
    var strip = $("collected-ligands-strip");
    var list = $("collected-ligands-list");
    var count = $("cl-count");
    if (!strip || !list) return;

    if (!playerLigands || playerLigands.length === 0) {
      strip.classList.add("hidden");
      return;
    }

    // From Step 2 onwards, narrow the strip down to only the ligands
    // the player committed to in Step 1. Step 1 still shows everything
    // collected so they can choose freely.
    var sourceLigands = playerLigands;
    var selIdxs = level2State && level2State.selectedLigandIdxs;
    if (step && step >= 2 && Array.isArray(selIdxs) && selIdxs.length > 0) {
      sourceLigands = selIdxs
        .map(function (i) { return playerLigands[i]; })
        .filter(Boolean);
    }

    // Group by id
    var byId = {};
    sourceLigands.forEach(function (lig) {
      var key = lig.id || (lig.name || "?").toLowerCase();
      if (!byId[key]) {
        var chem = LIGAND_CHEMISTRY[key] || LIGAND_CHEMISTRY[(lig.id || "").toLowerCase()] || {};
        byId[key] = {
          name: lig.name || key,
          sphere: chem.sphere || 'red',
          bond: chem.bond || '?',
          type: chem.type || 'Monodentate',
          denticity: chem.denticity || 1,
          count: 0,
        };
      }
      byId[key].count++;
    });

    var html = Object.keys(byId).map(function (k) {
      var r = byId[k];
      var bg = SPHERE_COLOR_CSS[r.sphere] || '#9ca3af';
      // Mono/Bi denticity tag dropped per Hazim spec — pill shows the
      // donor-atom badge + ligand name + ×count only.
      return ''
        + '<button type="button" class="ligand-strip-pill flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 hover:bg-white hover:border-[#4187a0] hover:shadow-sm transition" data-ligand-id="' + k + '" title="' + r.name + ' — click to view card">'
        +   '<span class="inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-[10px] font-black shadow" style="background:' + bg + '">' + r.bond + '</span>'
        +   '<span class="text-sm font-semibold text-gray-800">' + r.name + '</span>'
        +   (r.count > 1 ? '<span class="text-xs font-bold text-gray-500">&times;' + r.count + '</span>' : '')
        + '</button>';
    }).join('');

    list.innerHTML = html;
    if (count) count.textContent = String(sourceLigands.length);
    strip.classList.remove("hidden");

    // Wire up click → open the flippable ligand card popup
    list.querySelectorAll('.ligand-strip-pill').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-ligand-id');
        if (id) openLigandCardPopup(id);
      });
    });
  }

  /**
   * Pop up a single ligand card showing the designer-drawn front
   * (logo) on first display; click it to flip to the back
   * (description). Click overlay or the × to dismiss.
   */
  function openLigandCardPopup(ligandId) {
    var chem = LIGAND_CHEMISTRY[ligandId];
    if (!chem) return;
    var imgPath = '/assets/ligand-cards/' + (chem.image || '1.png');
    var color = SPHERE_COLOR_CSS[chem.sphere] || '#4187a0';

    // Reuse single overlay
    var overlay = document.getElementById('ligand-card-popup');
    if (overlay) overlay.remove();

    overlay = document.createElement('div');
    overlay.id = 'ligand-card-popup';
    overlay.className = 'fixed inset-0 z-[90] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4';
    overlay.innerHTML = ''
      + '<div class="relative w-full max-w-sm" style="perspective:1200px;">'
      +   '<button id="ligand-card-close" class="absolute -top-3 -right-3 z-10 w-9 h-9 rounded-full bg-white text-gray-700 shadow-lg text-xl leading-none font-black hover:bg-gray-100" aria-label="Close">&times;</button>'
      +   '<div id="ligand-card-flip" class="relative w-full" style="aspect-ratio:3/4; transform-style:preserve-3d; transition:transform 600ms cubic-bezier(.2,.7,.2,1); cursor:pointer;">'
      +     '<div class="absolute inset-0 rounded-2xl border-4 overflow-hidden bg-white shadow-2xl" style="border-color:' + color + '; backface-visibility:hidden;">'
      +       '<div class="w-full h-full bg-no-repeat" style="background-image:url(\'' + imgPath + '\'); background-position:6% center; background-size:220%;"></div>'
      +       '<div class="absolute bottom-2 right-2 px-3 py-1 bg-black/70 text-white text-xs rounded-full font-semibold pointer-events-none">Click to flip</div>'
      +     '</div>'
      +     '<div class="absolute inset-0 rounded-2xl border-4 overflow-hidden bg-white shadow-2xl" style="border-color:' + color + '; backface-visibility:hidden; transform:rotateY(180deg);">'
      +       '<div class="w-full h-full bg-no-repeat" style="background-image:url(\'' + imgPath + '\'); background-position:94% center; background-size:220%;"></div>'
      +       '<div class="absolute bottom-2 right-2 px-3 py-1 bg-black/70 text-white text-xs rounded-full font-semibold pointer-events-none">Click to flip back</div>'
      +     '</div>'
      +   '</div>'
      +   '<p class="mt-4 text-center text-white text-sm font-semibold tracking-wide">' + chem.name + ' &middot; ' + chem.type + ' &middot; donor: ' + chem.bond + '</p>'
      + '</div>';
    document.body.appendChild(overlay);

    var card = overlay.querySelector('#ligand-card-flip');
    var flipped = false;
    if (card) {
      card.addEventListener('click', function () {
        flipped = !flipped;
        card.style.transform = flipped ? 'rotateY(180deg)' : 'rotateY(0deg)';
      });
    }

    function dismiss() { overlay.remove(); }
    overlay.addEventListener('click', function (e) { if (e.target === overlay) dismiss(); });
    var closeBtn = overlay.querySelector('#ligand-card-close');
    if (closeBtn) closeBtn.addEventListener('click', dismiss);
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { dismiss(); document.removeEventListener('keydown', esc); }
    });

    if (window.AudioManager) window.AudioManager.play('book-flip');
  }

  function navButtons(opts) {
    var html = '<div class="l2-nav-row">';
    if (opts.back) {
      html += '<button id="btn-back" class="l2-nav-btn l2-nav-btn--secondary">&larr; Back</button>';
    } else { html += '<div></div>'; }
    if (opts.next) {
      var dis = opts.nextDisabled ? ' disabled' : '';
      var label = opts.nextLabel || 'Next';
      html += '<button id="btn-next" class="l2-nav-btn l2-nav-btn--primary"' + dis + '>' + label + '</button>';
    }
    html += '</div>';
    return html;
  }

  /**
   * Kahoot-style step heading. Wraps the title + subtitle in a big
   * blue gradient banner with a points pill on the right.
   */
  function headingBanner(title, subtitle, ptsLabel) {
    var html = '<div class="l2-step-banner">';
    html += '  <h2>' + title;
    if (ptsLabel) html += '<span class="l2-step-pts">' + ptsLabel + '</span>';
    html += '  </h2>';
    if (subtitle) html += '  <p>' + subtitle + '</p>';
    html += '</div>';
    return html;
  }

  function bindNav(opts) {
    var back = $("btn-back"), next = $("btn-next");
    if (back && opts.onBack) back.addEventListener("click", opts.onBack);
    if (next && opts.onNext) next.addEventListener("click", opts.onNext);
  }

  function renderStep(step) {
    currentStep = step;
    saveLevel2State();
    updateStepIndicator(step);
    renderCollectedLigandsStrip(step);
    var bc = $("builder-container");
    // 3D builder only shown on step 5 (was step 4)
    if (bc) bc.classList.toggle("hidden", step !== 5);
    // Toggle 2-col workspace layout on lg+ when builder is showing.
    var ws = $("l2-workspace");
    if (ws) {
      if (step === 5) {
        ws.classList.add("lg:grid-cols-2");
        ws.dataset.builderVisible = "true";
      } else {
        ws.classList.remove("lg:grid-cols-2");
        ws.dataset.builderVisible = "false";
      }
      // Three.js canvas needs to know the new container size when the
      // 2-col layout kicks in (no window-resize event fires).
      setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 0);
    }
    // Latest spec (5 stages — IUPAC naming step removed):
    //   1) Choose metal + ligands       2 pts
    //   2) Predict type                 2 pts
    //   3) Predict coordination number  1 pt
    //   4) Choose geometry              1 pt
    //   5) Build complex in 3D          6 pts
    switch (step) {
      case 1: renderStep1(); break;
      case 2: renderStep2_Q1_type(); break;
      case 3: renderStep3_Q2_cn(); break;
      case 4: renderStep2(); break;
      case 5: renderStep3(); break;
      default: renderResults(); break;
    }
  }

  // ── Helpers: selection + CN ─────────────────────────────

  function ligandDenticity(lig) {
    var chem = LIGAND_CHEMISTRY[lig.id] || LIGAND_CHEMISTRY[(lig.id || '').toLowerCase()];
    return chem ? chem.denticity : 1;
  }

  /** Ligands the user explicitly selected in Step 1 (empty → all collected). */
  function getSelectedLigands() {
    if (!level2State.selectedLigandIdxs || level2State.selectedLigandIdxs.length === 0) {
      return [];
    }
    return level2State.selectedLigandIdxs
      .map(function (i) { return playerLigands[i]; })
      .filter(Boolean);
  }

  function calcCN() {
    var sel = getSelectedLigands();
    var pool = sel.length > 0 ? sel : playerLigands;
    var total = 0;
    pool.forEach(function (lig) { total += ligandDenticity(lig); });
    return total;
  }

  function calcCNForIndices(idxs) {
    var total = 0;
    idxs.forEach(function (i) {
      var lig = playerLigands[i];
      if (lig) total += ligandDenticity(lig);
    });
    return total;
  }

  // ── Step 1: Q1 — Choose Metal + Ligands (CN must be 3–6) ───

  function renderStep1() {
    saveLevel2State();
    var c = $("step-container");
    var selectedIdxs = level2State.selectedLigandIdxs || [];
    var selCN = calcCNForIndices(selectedIdxs);
    var validCN = selCN >= 3 && selCN <= 6;
    var canAdvance = !!level2State.selectedMetal && selectedIdxs.length > 0 && validCN;

    var html = headingBanner(
      "Step 1 — Build Your Complex",
      "Pick one central metal, then choose ligands so the total coordination number (CN) is 3, 4, 5, or 6.",
      "2 PTS"
    );

    // Metal picker
    html += '<h3 class="text-sm font-bold text-gray-700 mb-2">Choose one central metal</h3>';
    html += '<div class="grid grid-cols-3 gap-3 mb-6">';
    CENTRAL_METALS.forEach(function (m) {
      var sel = level2State.selectedMetal && level2State.selectedMetal.id === m.id;
      var border = sel ? 'border-[#4187a0] ring-2 ring-[#4187a0]/30 bg-[#4187a0]/5' : 'border-gray-200 hover:border-[#4187a0]/50';
      html += '<button class="metal-card p-3 rounded-full border-2 ' + border + ' text-center transition cursor-pointer" data-metal="' + m.id + '">';
      html += '<span class="text-xl font-bold text-gray-800 block">' + m.name + '</span>';
      html += '</button>';
    });
    html += '</div>';

    // Ligand picker
    html += '<h3 class="text-sm font-bold text-gray-700 mb-1">These are the ligands your group collected in Level 1</h3>';
    html += '<p class="text-xs text-gray-500 mb-3">Tap to add or remove. Total CN must be 3, 4, 5, or 6.</p>';
    html += '<div class="grid grid-cols-3 gap-3 mb-3">';
    playerLigands.forEach(function (lig, idx) {
      var picked = selectedIdxs.indexOf(idx) >= 0;
      var d = ligandDenticity(lig);
      var border = picked
        ? 'bg-[#3DB5C8] text-white border-[#3DB5C8] ring-2 ring-[#3DB5C8]/40'
        : 'bg-white text-gray-800 border-gray-200 hover:border-[#3DB5C8]';
      // Denticity tag (d=N) dropped per Hazim spec — students should
      // pick by ligand name, not memorise the number.
      html += '<button class="ligand-pill p-3 rounded-full border-2 font-semibold text-base ' + border + ' transition cursor-pointer" data-ligand-idx="' + idx + '">';
      html += lig.name;
      html += '</button>';
    });
    html += '</div>';

    // CN readout + validation
    var cnClass = validCN ? 'text-green-700' : (selCN > 6 ? 'text-red-700' : 'text-gray-500');
    html += '<div class="bg-gray-50 rounded-lg p-3 flex items-center justify-between mb-3">';
    html += '<span class="text-sm text-gray-600">Total coordination number:</span>';
    html += '<span class="text-2xl font-bold ' + cnClass + '">CN = ' + selCN + '</span>';
    html += '</div>';

    // Error box for CN > 6
    html += '<div id="l2-q1-error" class="bg-red-50 border-l-4 border-red-500 text-red-800 rounded-lg p-3 text-sm mb-3 ' + (selCN > 6 ? '' : 'hidden') + '">';
    html += '<strong>Invalid selection.</strong> The coordination number cannot exceed 6. Please try again.';
    html += '</div>';

    // Hint for CN < 3
    if (selectedIdxs.length > 0 && selCN < 3) {
      html += '<div class="bg-amber-50 border-l-4 border-amber-400 text-amber-800 rounded-lg p-3 text-sm mb-3">';
      html += 'CN must be at least 3. Add more ligands.';
      html += '</div>';
    }

    html += navButtons({ back: false, next: true, nextDisabled: !canAdvance });
    c.innerHTML = html;

    // Metal click handlers
    document.querySelectorAll(".metal-card").forEach(function (card) {
      card.addEventListener("click", function () {
        var mid = this.getAttribute("data-metal");
        level2State.selectedMetal = CENTRAL_METALS.find(function (m) { return m.id === mid; });
        renderStep1();
      });
    });

    // Ligand toggle handlers — block additions that would push CN > 6
    document.querySelectorAll(".ligand-pill").forEach(function (pill) {
      pill.addEventListener("click", function () {
        var idx = parseInt(this.getAttribute("data-ligand-idx"), 10);
        var cur = level2State.selectedLigandIdxs.slice();
        var pos = cur.indexOf(idx);
        if (pos >= 0) {
          // Deselect
          cur.splice(pos, 1);
          level2State.selectedLigandIdxs = cur;
          renderStep1();
        } else {
          // Would this push us over 6?
          var projected = cur.concat([idx]);
          if (calcCNForIndices(projected) > 6) {
            // Show the specific spec error and DO NOT add
            var box = document.getElementById("l2-q1-error");
            if (box) {
              box.classList.remove("hidden");
              box.classList.add("animate-pulse");
              setTimeout(function () { box.classList.remove("animate-pulse"); }, 1200);
            }
            if (window.AudioManager) window.AudioManager.play("wrong");
            return;
          }
          level2State.selectedLigandIdxs = projected;
          if (window.AudioManager) window.AudioManager.play("ligand");
          renderStep1();
        }
      });
    });

    bindNav({ onNext: function () {
      // Final guard — CN must be 3-6
      var cn = calcCNForIndices(level2State.selectedLigandIdxs);
      if (cn > 6 || cn < 3 || !level2State.selectedMetal) {
        var box = document.getElementById("l2-q1-error");
        if (box && cn > 6) box.classList.remove("hidden");
        return;
      }
      // Spec: 2 pts for completing Setup (metal + valid ligand selection),
      // awarded once.
      if (!level2State.setupAwarded) {
        level2State.setupScore = 2;
        level2State.level2Score += 2;
        level2State.setupAwarded = true;
        updateScoreBar();
        // Reward chime + bouncy "+2 pts" toast — Hazim spec for Q1.
        showPointsToast(2, "Nice pick!");
        // Hold the toast on screen briefly before navigating away so the
        // player actually sees what they earned.
        setTimeout(function () { renderStep(2); }, 900);
        return;
      }
      renderStep(2);
    } });
  }

  // ── Step 2: Q1 — Predict the type of complex (2 pts) ────
  // Formula: total charge = metal charge + Σ(ligand charge × count).
  //   0 → neutral, <0 → anion, >0 → cation.

  function summariseSelectedLigands() {
    // Group selected ligands by id → count, keeping chemistry details
    var sel = getSelectedLigands();
    if (sel.length === 0) sel = playerLigands;
    var byId = {};
    sel.forEach(function (lig) {
      var key = lig.id || (lig.name || "?").toLowerCase();
      if (!byId[key]) {
        var chem = LIGAND_CHEMISTRY[key] || LIGAND_CHEMISTRY[(lig.id || "").toLowerCase()];
        byId[key] = {
          id: key,
          name: lig.name || key,
          charge: chem ? chem.charge : 0,
          count: 0,
        };
      }
      byId[key].count++;
    });
    return Object.keys(byId).map(function (k) { return byId[k]; });
  }

  function computeTotalCharge() {
    var metalCharge = level2State.selectedMetal ? level2State.selectedMetal.charge : 0;
    var rows = summariseSelectedLigands();
    var ligandTotal = 0;
    rows.forEach(function (r) { ligandTotal += r.charge * r.count; });
    return { total: metalCharge + ligandTotal, metalCharge: metalCharge, ligandTotal: ligandTotal, rows: rows };
  }

  function classifyComplex(total) {
    if (total === 0) return "neutral";
    if (total < 0) return "anion";
    return "cation";
  }

  // ── Chemistry-notation helpers (used by Q5 builder HUD) ─────────────
  function numToSubscript(n) {
    var subs = ["₀","₁","₂","₃","₄","₅","₆","₇","₈","₉"];
    return String(n).split("").map(function (d) { return subs[parseInt(d, 10)] || d; }).join("");
  }
  function numToSuperscript(n) {
    var sups = ["⁰","¹","²","³","⁴","⁵","⁶","⁷","⁸","⁹"];
    return String(n).split("").map(function (d) { return sups[parseInt(d, 10)] || d; }).join("");
  }
  function formatComplexFormula() {
    if (!level2State.selectedMetal) return "";
    var metalRaw = level2State.selectedMetal.name || "";
    // Strip charge symbols off the element label so the formula reads
    // "[Cr(NH₃)₃...]³⁺" — the charge belongs at the end of the bracket,
    // not next to the element symbol.
    var metalSym = metalRaw.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]/g, "").trim() || metalRaw;

    var rows = summariseSelectedLigands();
    var lParts = rows.map(function (r) {
      if (r.count <= 1) return "(" + r.name + ")";
      return "(" + r.name + ")" + numToSubscript(r.count);
    });

    var charge = computeTotalCharge().total;
    var chargeStr = "";
    if (charge !== 0) {
      var abs = Math.abs(charge);
      var num = abs > 1 ? numToSuperscript(abs) : "";
      chargeStr = num + (charge > 0 ? "⁺" : "⁻");
    }
    return "[" + metalSym + lParts.join("") + "]" + chargeStr;
  }
  function updateBuilderHud() {
    var formula = $("builder-formula");
    var pill = $("builder-charge-pill");
    if (formula) {
      formula.textContent = formatComplexFormula();
    }
    if (pill) {
      var charge = computeTotalCharge().total;
      if (charge === 0) {
        pill.textContent = "Neutral";
      } else {
        var sign = charge > 0 ? "+" : "−";
        pill.textContent = "Charge " + sign + Math.abs(charge);
      }
      pill.classList.remove("hidden");
    }
  }

  function renderStep2_Q1_type() {
    saveLevel2State();
    var c = $("step-container");
    var charge = computeTotalCharge();
    var correct = classifyComplex(charge.total);
    var done = level2State.typeDone;
    var chosen = level2State.typeAnswer;

    var html = headingBanner("Q1 — Predict the type of complex", "Calculate the charges and decide whether the complex is cation, anion, or neutral.", "2 PTS");

    // Info pills — non-blocking chat bubbles like Q3. Same INFO_BUBBLES
    // store + openInfoBubble overlay. Hazim spec: "info what complex &
    // type complex letak pop up macam Q3".
    html += '<div class="flex flex-wrap gap-2 mb-3">';
    html += '  <button type="button" class="q1-info-trigger inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border-2 bg-white border-[#3b56a0] text-[#3b56a0] hover:bg-[#3b56a0]/5 transition" data-bubble="what_complex">';
    html += '    <span class="w-4 h-4 inline-flex items-center justify-center rounded-full bg-[#3b56a0] text-white text-[10px] font-black">i</span>';
    html += '    What is a complex?';
    html += '  </button>';
    html += '  <button type="button" class="q1-info-trigger inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border-2 bg-white border-[#3b56a0] text-[#3b56a0] hover:bg-[#3b56a0]/5 transition" data-bubble="type_complex">';
    html += '    <span class="w-4 h-4 inline-flex items-center justify-center rounded-full bg-[#3b56a0] text-white text-[10px] font-black">i</span>';
    html += '    Type of complex';
    html += '  </button>';
    html += '</div>';

    // Per latest spec: every fill-in column is a chip group — students pick
    // the value themselves. After submit, wrong picks get a red ring.
    if (!level2State.q1ChargeInputs)        level2State.q1ChargeInputs = {};
    if (!level2State.q1CountInputs)         level2State.q1CountInputs = {};
    if (!level2State.q1ContribInputs)       level2State.q1ContribInputs = {};
    if (!("q1TotalLigandChargeInput" in level2State)) level2State.q1TotalLigandChargeInput = null;
    if (!("q1ComplexChargeInput" in level2State))     level2State.q1ComplexChargeInput = null;
    if (!Array.isArray(level2State.q1EliminatedTypes))  level2State.q1EliminatedTypes = [];

    var q1Charges  = level2State.q1ChargeInputs;
    var q1Counts   = level2State.q1CountInputs;
    var q1Contribs = level2State.q1ContribInputs;
    var ligandChargeOpts = ['−2', '−1', '0', '+1', '+2'];
    var metalChargeOpts  = ['+1', '+2', '+3'];
    var countOpts        = ['1', '2', '3', '4', '5', '6'];
    var contribOpts      = ['−6', '−4', '−3', '−2', '−1', '0', '+1', '+2', '+3', '+4', '+6'];

    function pickerChips(field, key, opts, currentValue, expectedValue) {
      var sel = currentValue != null ? currentValue : '';
      var chipBase = 'q1-' + field + '-chip text-xs font-semibold px-2 py-1 rounded-md border-2 transition select-none ';
      var out = '<div class="flex flex-wrap justify-center gap-1">';
      opts.forEach(function (o) {
        var picked = sel === o;
        var cls = chipBase;
        if (done) {
          var isWrongPick = picked && expectedValue != null && String(o) !== String(expectedValue);
          if (isWrongPick) {
            cls += 'border-red-500 bg-red-50 text-red-700 ring-2 ring-red-300 cursor-default ';
          } else if (picked) {
            cls += 'border-[#4187a0] bg-[#4187a0]/10 text-[#4187a0] cursor-default ';
          } else {
            cls += 'border-gray-200 text-gray-300 cursor-default ';
          }
        } else {
          cls += picked ? 'border-[#4187a0] bg-[#4187a0]/10 text-[#4187a0] '
                        : 'border-gray-300 bg-white text-gray-600 hover:border-[#4187a0] cursor-pointer ';
        }
        out += '<button type="button" class="' + cls + '" data-field="' + field + '" data-key="' + key + '" data-val="' + o + '"' + (done ? ' disabled' : '') + '>' + o + '</button>';
      });
      out += '</div>';
      return out;
    }

    // Helper to format a numeric charge into the same +/- string shape
    // used by the chip options (so "expectedValue" comparisons work).
    function fmtSignedCharge(n) {
      if (n === 0) return '0';
      if (n > 0) return '+' + n;
      return '−' + Math.abs(n); // unicode minus to match chip labels
    }

    html += '<div class="overflow-x-auto mb-3 rounded-lg border border-gray-200">';
    html += '<table class="w-full text-sm">';
    html += '<thead class="bg-gray-50 text-gray-700"><tr>';
    html += '<th class="text-left px-3 py-2 font-semibold">Ligand</th>';
    html += '<th class="text-center px-3 py-2 font-semibold">Charge</th>';
    html += '<th class="text-center px-3 py-2 font-semibold">No. of ligand(s), n</th>';
    html += '<th class="text-center px-3 py-2 font-semibold">Charge Contribution<span class="block text-[10px] font-normal text-gray-500">(Charge × n)</span></th>';
    html += '</tr></thead><tbody>';

    charge.rows.forEach(function (r, i) {
      var label = r.count > 1 ? (r.name + ' &times; ' + r.count) : r.name;
      var key = 'lig_' + i;
      var expChargeStr  = fmtSignedCharge(r.charge);
      var expCountStr   = String(r.count);
      var expContribStr = fmtSignedCharge(r.charge * r.count);
      html += '<tr class="border-t border-gray-100">';
      html += '<td class="px-3 py-2 font-medium text-gray-800">' + label + '</td>';
      html += '<td class="text-center px-3 py-2">' + pickerChips('charge',  key, ligandChargeOpts, q1Charges[key],  expChargeStr)  + '</td>';
      html += '<td class="text-center px-3 py-2">' + pickerChips('count',   key, countOpts,        q1Counts[key],   expCountStr)   + '</td>';
      html += '<td class="text-center px-3 py-2">' + pickerChips('contrib', key, contribOpts,      q1Contribs[key], expContribStr) + '</td>';
      html += '</tr>';
    });

    // Total of ligand charge — sum of contributions (Σ charge×n).
    var expTotalLigand = charge.ligandTotal;
    var expTotalLigandStr = fmtSignedCharge(expTotalLigand);
    html += '<tr class="border-t border-gray-100 bg-emerald-50">';
    html += '<td class="px-3 py-2 font-semibold text-emerald-900" colspan="3">Total of ligand charge</td>';
    html += '<td class="text-center px-3 py-2">' + pickerChips('totLigand', 'tot', contribOpts, level2State.q1TotalLigandChargeInput, expTotalLigandStr) + '</td>';
    html += '</tr>';

    // Metal row — chip pickers reduced to [+1][+2][+3] per Hazim spec.
    var expMetalCharge = level2State.selectedMetal ? level2State.selectedMetal.charge : 0;
    var expMetalChargeStr = fmtSignedCharge(expMetalCharge);
    html += '<tr class="border-t border-gray-100 bg-blue-50">';
    html += '<td class="px-3 py-2 font-medium text-gray-800">Metal: ' + (level2State.selectedMetal ? level2State.selectedMetal.name : "—") + '</td>';
    html += '<td class="text-center px-3 py-2">' + pickerChips('charge',  'metal', metalChargeOpts, q1Charges.metal,  expMetalChargeStr)  + '</td>';
    html += '<td class="text-center px-3 py-2 text-gray-300">—</td>';
    html += '<td class="text-center px-3 py-2">' + pickerChips('contrib', 'metal', metalChargeOpts, q1Contribs.metal, expMetalChargeStr) + '</td>';
    html += '</tr>';

    // Charge of complex — sum of metal + total ligand.
    var expComplexCharge = charge.total;
    var expComplexChargeStr = fmtSignedCharge(expComplexCharge);
    html += '<tr class="border-t border-gray-200 bg-amber-50">';
    html += '<td class="px-3 py-2 font-semibold text-amber-900" colspan="3">Charge of Complex</td>';
    html += '<td class="text-center px-3 py-2">' + pickerChips('complex', 'cmp', contribOpts, level2State.q1ComplexChargeInput, expComplexChargeStr) + '</td>';
    html += '</tr>';
    html += '</tbody></table></div>';

    // 3-option answer with eliminate-on-2nd-wrong logic. Kahoot-style
    // depth buttons; one colour per option so the grid reads bright.
    var options = [
      { id: "neutral", label: "Neutral", hint: "Total = 0", color: "yellow" },
      { id: "anion",   label: "Anion",   hint: "Total < 0", color: "red"    },
      { id: "cation",  label: "Cation",  hint: "Total > 0", color: "green"  },
    ];
    var eliminated = level2State.q1EliminatedTypes || [];
    html += '<div class="grid grid-cols-3 gap-3 mb-3">';
    options.forEach(function (opt) {
      var isEliminated = eliminated.indexOf(opt.id) !== -1;
      var disabled = done || isEliminated;
      var state = "idle";
      if (done) {
        if (opt.id === correct) state = "correct";
        else if (opt.id === chosen) state = "wrong";
        else state = "faded";
      } else if (isEliminated) {
        state = "eliminated";
      } else if (opt.id === chosen) {
        state = "selected";
      }
      var cls = "type-opt l2-kahoot-btn l2-kahoot-btn--" + opt.color;
      html += '<button class="' + cls + '" data-state="' + state + '" data-val="' + opt.id + '"' + (disabled ? ' disabled' : '') + '>';
      html += '<span>' + opt.label + '</span>';
      html += '<span class="l2-btn-sub">' + opt.hint + '</span>';
      html += '</button>';
    });
    html += '</div>';

    if (done) {
      var pts = level2State.typeScore;
      var pickedRight = chosen === correct;
      if (pickedRight) {
        var ptsTxt = pts > 0 ? ' +' + pts + ' point' + (pts > 1 ? 's' : '') : '';
        html += '<div class="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm text-center font-semibold mb-3">You are correct!' + ptsTxt + '</div>';
      } else {
        html += '<div class="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center mb-3">You are wrong. The correct answer was <strong>' + correct + '</strong>.</div>';
      }
    } else if (level2State.typeAttempts > 0) {
      html += '<div class="p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-700 text-sm text-center mb-3">Try again. Attempt ' + level2State.typeAttempts + '/3 — wrong picks have been eliminated.</div>';
    }

    html += navButtons({ back: true, next: true, nextDisabled: !done && !chosen, nextLabel: done ? "Next: Geometry" : "Submit" });
    c.innerHTML = html;

    document.querySelectorAll(".type-opt").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (done) return;
        level2State.typeAnswer = this.getAttribute("data-val");
        saveLevel2State();
        renderStep2_Q1_type();
      });
    });

    var q1FieldStores = {
      charge:  level2State.q1ChargeInputs,
      count:   level2State.q1CountInputs,
      contrib: level2State.q1ContribInputs,
    };
    document.querySelectorAll(".q1-charge-chip, .q1-count-chip, .q1-contrib-chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        if (done) return;
        var field = this.getAttribute("data-field");
        var store = q1FieldStores[field];
        if (!store) return;
        store[this.getAttribute("data-key")] = this.getAttribute("data-val");
        saveLevel2State();
        renderStep2_Q1_type();
      });
    });

    // Working-out totals — single chip per row.
    document.querySelectorAll(".q1-totLigand-chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        if (done) return;
        level2State.q1TotalLigandChargeInput = chip.getAttribute("data-val");
        saveLevel2State();
        renderStep2_Q1_type();
      });
    });
    document.querySelectorAll(".q1-complex-chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        if (done) return;
        level2State.q1ComplexChargeInput = chip.getAttribute("data-val");
        saveLevel2State();
        renderStep2_Q1_type();
      });
    });

    // Info pills — open the shared overlay popup (same as Q3 bubbles).
    document.querySelectorAll(".q1-info-trigger").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var key = this.getAttribute("data-bubble");
        if (key) openInfoBubble(key);
      });
    });

    bindNav({
      onBack: function () { renderStep(1); },
      onNext: function () {
        if (done) { renderStep(3); return; }
        if (!level2State.typeAnswer) return;
        // Don't double-count an already-eliminated option (defensive).
        if ((level2State.q1EliminatedTypes || []).indexOf(level2State.typeAnswer) !== -1) return;

        level2State.typeAttempts++;
        var isRight = level2State.typeAnswer === correct;

        if (isRight) {
          // Spec scoring: 1st-try = 2 pts, 2nd-try = 1 pt, 3rd-try = 0.
          level2State.typeScore = level2State.typeAttempts === 1 ? 2 :
                                  level2State.typeAttempts === 2 ? 1 : 0;
          level2State.typeDone = true;
          level2State.level2Score += level2State.typeScore;
          updateScoreBar();
          if (level2State.typeScore > 0) showPointsToast(level2State.typeScore, "You earned");
          else if (window.AudioManager) window.AudioManager.play("correct");
        } else if (level2State.typeAttempts >= 3) {
          // Out of attempts.
          level2State.typeScore = 0;
          level2State.typeDone = true;
          updateScoreBar();
          if (window.AudioManager) window.AudioManager.play("wrong");
        } else {
          // Wrong, but attempts left — eliminate the option they just
          // picked and clear typeAnswer so they pick again.
          if (level2State.q1EliminatedTypes.indexOf(level2State.typeAnswer) === -1) {
            level2State.q1EliminatedTypes.push(level2State.typeAnswer);
          }
          level2State.typeAnswer = null;
          if (window.AudioManager) window.AudioManager.play("wrong");
        }
        saveLevel2State();
        renderStep2_Q1_type();
      },
    });
  }

  // ── Step 3: Q2 — Predict the coordination number (2 pts) ─
  // CN = Σ (coordination sites per ligand × number of ligands).
  // cs = denticity for each ligand type.

  // Also expose state for Q2 on first render
  if (!("cnAnswer" in level2State)) {
    level2State.cnAnswer = null;
    level2State.cnScore = 0;
    level2State.cnAttempts = 0;
    level2State.cnDone = false;
  }

  // Info bubble content keyed by topic. Bubbles are non-blocking chat
  // shapes — students can keep answering questions while one or more
  // bubbles are open.
  var INFO_BUBBLES = {
    what_complex: {
      title: "What is a complex?",
      body: "A complex is a species formed when a central metal ion is bonded to surrounding ligands through coordinate (dative) bonds.",
    },
    type_complex: {
      title: "Type of complex",
      body: "<ul class='space-y-1'>" +
            "<li><strong>Cation</strong> &mdash; complex with an overall <strong>positive</strong> charge.</li>" +
            "<li><strong>Anion</strong> &mdash; complex with an overall <strong>negative</strong> charge.</li>" +
            "<li><strong>Neutral</strong> &mdash; complex with <strong>no</strong> overall charge.</li>" +
            "</ul>",
    },
    denticity_type: {
      title: "Type of denticity",
      body: "Type of denticity refers to the classification of ligands based on their denticity.<br><br>" +
            "<strong>Monodentate (1)</strong> &rarr; 1 donor atom<br>" +
            "<strong>Bidentate (2)</strong> &rarr; 2 donor atoms",
    },
    denticity: {
      title: "Denticity",
      body: "Denticity is the number of donor atoms in a ligand that can bind to the central metal ion.",
    },
    cn: {
      title: "Coordination Number",
      body: "Coordination Number is the number of ligand donor atoms surrounding the central metal.",
    },
    sites: {
      title: "No. of coordination sites",
      body: "The number of bonding positions on the central metal used by a single ligand.",
    },
  };

  function openInfoBubble(key) {
    var info = INFO_BUBBLES[key];
    if (!info) return;
    // Reuse an existing overlay or create one
    var overlay = document.getElementById("l2-info-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "l2-info-overlay";
      overlay.className = "fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-6";
      overlay.innerHTML = '<div class="bg-[#4187a0] text-white rounded-3xl shadow-2xl max-w-md w-full p-6 relative">'
        + '<button id="l2-info-close" class="absolute top-3 right-4 text-white/80 hover:text-white text-2xl leading-none" aria-label="Close">&times;</button>'
        + '<h3 id="l2-info-title" class="text-lg font-bold mb-3"></h3>'
        + '<div id="l2-info-body" class="text-sm leading-relaxed"></div>'
        + '</div>';
      document.body.appendChild(overlay);
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) overlay.remove();
      });
      var closeBtn = overlay.querySelector("#l2-info-close");
      if (closeBtn) closeBtn.addEventListener("click", function () { overlay.remove(); });
    }
    overlay.querySelector("#l2-info-title").textContent = info.title;
    overlay.querySelector("#l2-info-body").innerHTML = info.body;
  }

  // Expose for inline onclick
  window.__l2InfoBubble = openInfoBubble;

  function renderStep3_Q2_cn() {
    saveLevel2State();
    var c = $("step-container");
    var cn = calcCN(); // correct CN derived from Step 1 selections
    var sel = getSelectedLigands();
    if (sel.length === 0) sel = playerLigands;

    // Group by ligand id for the table, counting occurrences
    var byId = {};
    sel.forEach(function (lig) {
      var key = lig.id || (lig.name || "?").toLowerCase();
      if (!byId[key]) {
        var chem = LIGAND_CHEMISTRY[key] || LIGAND_CHEMISTRY[(lig.id || "").toLowerCase()];
        byId[key] = {
          id: key,
          name: lig.name || key,
          denticity: chem ? chem.denticity : 1,
          type: chem ? chem.type : "Monodentate",
          count: 0,
        };
      }
      byId[key].count++;
    });
    var rows = Object.keys(byId).map(function (k) { return byId[k]; });

    var done = level2State.cnDone;
    var chosen = level2State.cnAnswer;

    var html = headingBanner("Q2 — Predict the coordination number", "Sum the donor atoms across all ligands. CN can be 3, 4, 5, or 6.", "1 PT");

    // Three toggle buttons that open chat-bubble explainers. Bubbles
    // appear inline below — they don't block the rest of the question
    // so students can keep answering while one or more are open.
    if (!Array.isArray(level2State.q2OpenBubbles)) level2State.q2OpenBubbles = [];
    var openBubbles = level2State.q2OpenBubbles;
    var bubbleTriggers = [
      { key: 'denticity_type', label: 'Type of denticity' },
      { key: 'denticity',      label: 'Denticity' },
      { key: 'cn',             label: 'Coordination Number' },
    ];
    html += '<div class="flex flex-wrap gap-2 mb-3">';
    bubbleTriggers.forEach(function (t) {
      var open = openBubbles.indexOf(t.key) !== -1;
      var pillCls = 'q2-bubble-trigger inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition select-none ' +
        (open
          ? 'bg-[#3b56a0] border-[#3b56a0] text-white shadow-md '
          : 'bg-white border-[#3b56a0] text-[#3b56a0] hover:bg-[#3b56a0]/5 cursor-pointer ');
      html += '<button type="button" class="' + pillCls + '" data-bubble="' + t.key + '">' +
              '<span class="w-4 h-4 inline-flex items-center justify-center rounded-full ' +
                (open ? 'bg-white text-[#3b56a0]' : 'bg-[#3b56a0] text-white') +
                ' text-[10px] font-black">i</span>' +
              t.label +
              (open ? ' <span class="text-[10px] opacity-80">×</span>' : '') +
              '</button>';
    });
    html += '</div>';

    if (openBubbles.length > 0) {
      html += '<div class="flex flex-wrap gap-3 mb-4">';
      openBubbles.forEach(function (key) {
        var info = INFO_BUBBLES[key];
        if (!info) return;
        html += '<div class="q2-chat-bubble relative bg-[#3b56a0] text-white rounded-3xl shadow-md px-4 py-3 max-w-sm flex-1 min-w-[220px]" data-bubble="' + key + '">' +
                '  <button type="button" class="q2-bubble-close absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white text-[#3b56a0] border-2 border-[#3b56a0] text-sm font-bold flex items-center justify-center hover:bg-[#3b56a0] hover:text-white transition shadow" data-bubble="' + key + '" aria-label="Close">&times;</button>' +
                '  <p class="font-bold text-sm mb-1">' + info.title + '</p>' +
                '  <p class="text-xs leading-relaxed">' + info.body + '</p>' +
                '</div>';
      });
      html += '</div>';
    }

    // Per latest spec: Type of denticity + Denticity (d) + No. of ligand
    // are all chip groups — students pick. After submit, wrong picks get
    // a red box (Hazim spec: "kalau bantai CN then betul, kotak ada salah,
    // keluarkan box merah keliling pilihan salah").
    if (!level2State.q2TypeInputs) level2State.q2TypeInputs = {};
    if (!level2State.q2DenticityInputs) level2State.q2DenticityInputs = {};
    if (!level2State.q2CountInputs) level2State.q2CountInputs = {};
    var q2Type  = level2State.q2TypeInputs;
    var q2Dent  = level2State.q2DenticityInputs;
    var q2Count = level2State.q2CountInputs;
    var typeOpts  = ['Monodentate', 'Bidentate'];
    var dentOpts  = ['1', '2'];
    var countOpts = ['1', '2', '3'];

    function q2Chips(cls, key, opts, sel, expectedVal) {
      var chipBase = cls + ' text-xs font-semibold px-2 py-1 rounded-md border-2 transition select-none ';
      var out = '<div class="flex flex-wrap justify-center gap-1">';
      opts.forEach(function (o) {
        var picked = sel === o;
        var c = chipBase;
        if (done) {
          // After submit, surface wrong picks in red so the player sees
          // exactly which working-out steps were off.
          var isWrongPick = picked && expectedVal !== undefined && String(o) !== String(expectedVal);
          if (isWrongPick) {
            c += 'border-red-500 bg-red-50 text-red-700 ring-2 ring-red-300 cursor-default ';
          } else if (picked) {
            c += 'border-[#4187a0] bg-[#4187a0]/10 text-[#4187a0] cursor-default ';
          } else {
            c += 'border-gray-200 text-gray-300 cursor-default ';
          }
        } else {
          c += picked ? 'border-[#4187a0] bg-[#4187a0]/10 text-[#4187a0] '
                      : 'border-gray-300 bg-white text-gray-600 hover:border-[#4187a0] cursor-pointer ';
        }
        out += '<button type="button" class="' + c + '" data-key="' + key + '" data-val="' + o + '"' + (done ? ' disabled' : '') + '>' + o + '</button>';
      });
      out += '</div>';
      return out;
    }

    html += '<div class="overflow-x-auto mb-3 rounded-lg border border-gray-200">';
    html += '<table class="w-full text-sm">';
    html += '<thead class="bg-[#4187a0] text-white"><tr>';
    html += '<th class="text-left px-3 py-2 font-semibold">Ligand(s)</th>';
    html += '<th class="px-3 py-2 font-semibold">Type of denticity</th>';
    html += '<th class="text-center px-3 py-2 font-semibold">Denticity, d</th>';
    html += '<th class="text-center px-3 py-2 font-semibold">No. of ligand(s), n</th>';
    html += '</tr></thead><tbody>';
    rows.forEach(function (r, i) {
      var key = 'r_' + i;
      var expectedType  = r.type;             // Monodentate / Bidentate
      var expectedDent  = String(r.denticity);
      var expectedCount = String(r.count);
      html += '<tr class="border-t border-gray-100">';
      html += '<td class="px-3 py-2 font-medium text-gray-800">' + r.name + '</td>';
      html += '<td class="text-center px-3 py-2">' + q2Chips('q2-type-chip',  key, typeOpts,  q2Type[key],  expectedType)  + '</td>';
      html += '<td class="text-center px-3 py-2">' + q2Chips('q2-dent-chip',  key, dentOpts,  q2Dent[key],  expectedDent)  + '</td>';
      html += '<td class="text-center px-3 py-2">' + q2Chips('q2-count-chip', key, countOpts, q2Count[key], expectedCount) + '</td>';
      html += '</tr>';
    });
    html += '</tbody></table></div>';


    // 4-option answer
    var opts = [3, 4, 5, 6];
    html += '<div class="grid grid-cols-4 gap-3 mb-3">';
    opts.forEach(function (n) {
      var cls = 'p-4 rounded-lg font-bold text-xl border-2 transition text-center ';
      if (done) {
        if (n === cn) cls += 'border-green-500 bg-green-50 text-green-700 ';
        else if (n === chosen) cls += 'border-red-500 bg-red-50 text-red-700 ';
        else cls += 'border-gray-200 text-gray-400 ';
        cls += 'cursor-default ';
      } else {
        if (n === chosen) cls += 'border-[#4187a0] bg-[#4187a0]/10 text-[#4187a0] ';
        else cls += 'border-gray-200 hover:border-[#4187a0] cursor-pointer ';
      }
      html += '<button class="cn-opt ' + cls + '" data-val="' + n + '"' + (done ? ' disabled' : '') + '>' + n + '</button>';
    });
    html += '</div>';

    if (done) {
      var pts = level2State.cnScore;
      var pickedRight = chosen === cn;
      if (pickedRight) {
        var ptsTxt = pts > 0 ? ' (+' + pts + ' pt' + (pts > 1 ? 's' : '') + ')' : '';
        html += '<div class="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm text-center font-semibold mb-3">You are correct! CN = ' + cn + ptsTxt + '</div>';
      } else {
        html += '<div class="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center mb-3">You are wrong. The correct CN was <strong>' + cn + '</strong>.</div>';
      }
    } else if (level2State.cnAttempts > 0) {
      html += '<div class="p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-700 text-sm text-center mb-3">Try again. Attempt ' + level2State.cnAttempts + '/2</div>';
    }

    html += navButtons({ back: true, next: true, nextDisabled: !done && !chosen, nextLabel: done ? "Next: Geometry" : "Submit" });
    c.innerHTML = html;

    document.querySelectorAll(".cn-opt").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (done) return;
        level2State.cnAnswer = parseInt(this.getAttribute("data-val"), 10);
        saveLevel2State();
        renderStep3_Q2_cn();
      });
    });

    document.querySelectorAll(".q2-type-chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        if (done) return;
        level2State.q2TypeInputs[this.getAttribute("data-key")] = this.getAttribute("data-val");
        saveLevel2State();
        renderStep3_Q2_cn();
      });
    });
    document.querySelectorAll(".q2-dent-chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        if (done) return;
        level2State.q2DenticityInputs[this.getAttribute("data-key")] = this.getAttribute("data-val");
        saveLevel2State();
        renderStep3_Q2_cn();
      });
    });
    document.querySelectorAll(".q2-count-chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        if (done) return;
        level2State.q2CountInputs[this.getAttribute("data-key")] = this.getAttribute("data-val");
        saveLevel2State();
        renderStep3_Q2_cn();
      });
    });

    // Toggle bubble open/close — clicking the trigger again or the
    // bubble's × button removes it from the open list.
    function toggleBubble(key) {
      var idx = level2State.q2OpenBubbles.indexOf(key);
      if (idx === -1) level2State.q2OpenBubbles.push(key);
      else level2State.q2OpenBubbles.splice(idx, 1);
      saveLevel2State();
      renderStep3_Q2_cn();
    }
    document.querySelectorAll(".q2-bubble-trigger").forEach(function (btn) {
      btn.addEventListener("click", function () { toggleBubble(this.getAttribute("data-bubble")); });
    });
    document.querySelectorAll(".q2-bubble-close").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        toggleBubble(this.getAttribute("data-bubble"));
      });
    });

    bindNav({
      onBack: function () { renderStep(2); },
      onNext: function () {
        if (done) { renderStep(4); return; }
        if (level2State.cnAnswer === null) return;

        level2State.cnAttempts++;
        var right = level2State.cnAnswer === cn;
        if (right) {
          // Spec: 1 pt max for CN regardless of attempts
          level2State.cnScore = level2State.cnAttempts === 1 ? 1 : 0;
          level2State.cnDone = true;
          level2State.level2Score += level2State.cnScore;
          updateScoreBar();
          if (window.AudioManager) window.AudioManager.play("correct");
          renderStep3_Q2_cn();
        } else if (level2State.cnAttempts >= 2) {
          level2State.cnScore = 0;
          level2State.cnDone = true;
          updateScoreBar();
          if (window.AudioManager) window.AudioManager.play("wrong");
          renderStep3_Q2_cn();
        } else {
          if (window.AudioManager) window.AudioManager.play("wrong");
          renderStep3_Q2_cn();
        }
      },
    });
  }

  // ── Step 4: Pick Geometry (2 pts) ───────────────────────

  function renderStep2() {
    saveLevel2State();
    var c = $("step-container");
    var cn = calcCN();
    var correctList = GEOMETRY_MAP[cn] || [];
    var displayLigands = getSelectedLigands();
    if (displayLigands.length === 0) displayLigands = playerLigands;

    var html = headingBanner("Q3 — State the possible complex geometry", "Choose the correct geometry for your coordination number.", "1 PT");

    // Reminder: surface the CN they computed in Q2 so they don't have
    // to flip back, but no longer reveal which geometries map to which
    // CN — students must recall that themselves from the images.
    var cnReminder = calcCN();
    html += '<div class="mb-4 px-4 py-3 rounded-xl bg-sky-50 border-2 border-sky-200 text-sky-900 text-sm">';
    html += '  <strong>Your CN that you calculated before is ' + cnReminder + '</strong> &mdash; choose the correct geometry for that CN.';
    html += '</div>';

    // Randomise the option order so students don't memorise the layout.
    // Persist the shuffled order on level2State so wrong-attempt re-renders
    // don't reshuffle the cards under the player's feet.
    if (!Array.isArray(level2State.geometryOrder) || level2State.geometryOrder.length !== ALL_GEOMETRIES.length) {
      level2State.geometryOrder = ALL_GEOMETRIES.slice().sort(function () { return Math.random() - 0.5; });
    }

    var done = level2State.geometryDone;
    // Cycle through 6 Kahoot colours so the grid reads bright.
    var geoColors = ["red", "yellow", "green", "purple", "teal", "pink"];
    html += '<div class="grid grid-cols-2 sm:grid-cols-3 gap-3">';
    level2State.geometryOrder.forEach(function (geo, idx) {
      var isCorrect = correctList.indexOf(geo) >= 0;
      var state = "idle";
      if (done) {
        if (isCorrect) state = "correct";
        else if (geo === level2State.selectedGeometry && !isCorrect) state = "wrong";
        else state = "faded";
      }
      var cls = "geo-btn l2-kahoot-btn l2-kahoot-btn--" + geoColors[idx % geoColors.length];
      html += '<button class="' + cls + '" data-state="' + state + '" data-val="' + geo + '"' + (done ? ' disabled' : '') + '>';
      html +=   '<span>' + geo + '</span>';
      html += '</button>';
    });
    html += '</div>';

    if (done) {
      var pts = level2State.geometryScore;
      var pickedRight = correctList.indexOf(level2State.selectedGeometry) >= 0;
      if (pickedRight) {
        var ptsTxt = pts > 0 ? ' +' + pts + ' point' + (pts > 1 ? 's' : '') : '';
        html += '<div class="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm text-center font-semibold">You are correct!' + ptsTxt + '</div>';
      } else {
        html += '<div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">You are wrong. The correct geometry: <strong>' + correctList.join(", ") + '</strong></div>';
      }
    } else if (level2State.geometryAttempts > 0) {
      html += '<div class="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-700 text-sm text-center">Try again. Attempts: ' + level2State.geometryAttempts + '/3</div>';
    }

    html += navButtons({ back: true, next: true, nextDisabled: !done });
    c.innerHTML = html;

    if (!done) {
      document.querySelectorAll(".geo-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var val = this.getAttribute("data-val");
          level2State.geometryAttempts++;
          var isCorrect = correctList.indexOf(val) >= 0;
          if (isCorrect) {
            level2State.selectedGeometry = val;
            // Spec: 1 pt max for geometry, only awarded on first attempt
            var pts = level2State.geometryAttempts === 1 ? 1 : 0;
            level2State.geometryScore = pts;
            level2State.level2Score += pts;
            level2State.geometryDone = true;
            if (window.AudioManager) window.AudioManager.play("correct");
          } else if (level2State.geometryAttempts >= 3) {
            level2State.selectedGeometry = correctList[0];
            level2State.geometryScore = 0;
            level2State.geometryDone = true;
            if (window.AudioManager) window.AudioManager.play("wrong");
          } else {
            if (window.AudioManager) window.AudioManager.play("wrong");
          }
          updateScoreBar();
          renderStep2();
        });
      });
    }

    bindNav({
      onBack: function () { renderStep(3); },
      onNext: function () { renderStep(5); },
    });
  }

  // ── Step 3: 3D Build (6 pts) ────────────────────────────

  var inventoryLigands = [];

  // Q4 picture-pick state (lazy init)
  if (!("pictureAnswer" in level2State)) {
    level2State.pictureAnswer = null;
    level2State.pictureScore = 0;
    level2State.pictureAttempts = 0;
    level2State.pictureDone = false;
  }

  // Six geometry reference images (cropped from LEVEL_2_GEOMETRY_SHAPE)
  var GEOMETRY_PICS = [
    { id: "trigonal-planar",     label: "Trigonal planar",      cn: 3, image: "/assets/geometry/trigonal-planar.png" },
    { id: "tetrahedral",         label: "Tetrahedral",          cn: 4, image: "/assets/geometry/tetrahedral.png" },
    { id: "square-planar",       label: "Square planar",        cn: 4, image: "/assets/geometry/square-planar.png" },
    { id: "trigonal-bipyramidal",label: "Trigonal bipyramidal", cn: 5, image: "/assets/geometry/trigonal-bipyramidal.png" },
    { id: "square-pyramidal",    label: "Square pyramidal",     cn: 5, image: "/assets/geometry/square-pyramidal.png" },
    { id: "octahedral",          label: "Octahedral",           cn: 6, image: "/assets/geometry/octahedral.png" },
  ];

  function renderStep5_Q4_picture() {
    saveLevel2State();
    var c = $("step-container");
    var bc = $("builder-container");
    if (bc) bc.classList.add("hidden"); // hide the 3D canvas during picture pick

    var cn = calcCN();
    var done = level2State.pictureDone;
    var chosen = level2State.pictureAnswer;

    var html = headingBanner(
      "Q4 — Pick the matching geometry",
      "First, pick the complex name that matches your CN = <strong class=\"text-amber-300\">" + cn + "</strong>. Attempt " + Math.min(level2State.pictureAttempts + (done ? 0 : 1), 3) + " / 3 &middot; 1st = 3 pts &middot; 2nd = 2 pts &middot; 3rd = 1 pt",
      "3 PTS"
    );

    // Wording-only options per Hazim spec (matches renderStep2). Order
    // is shuffled once per session and persisted on level2State so a
    // wrong-attempt re-render keeps the layout stable.
    if (!Array.isArray(level2State.pictureOrder) || level2State.pictureOrder.length !== GEOMETRY_PICS.length) {
      level2State.pictureOrder = GEOMETRY_PICS.slice().sort(function () { return Math.random() - 0.5; });
    }

    var picColors = ["red", "yellow", "green", "purple", "teal", "pink"];
    html += '<div class="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">';
    level2State.pictureOrder.forEach(function (g, idx) {
      var isCorrect = g.cn === cn;
      var state = "idle";
      if (done) {
        if (g.id === chosen && isCorrect) state = "correct";
        else if (g.id === chosen && !isCorrect) state = "wrong";
        else if (isCorrect) state = "idle"; // surface the correct one
        else state = "faded";
      } else if (g.id === chosen) {
        state = "selected";
      }
      var cls = "geo-pic-btn l2-kahoot-btn l2-kahoot-btn--" + picColors[idx % picColors.length];
      html += '<button class="' + cls + '" data-state="' + state + '" data-val="' + g.id + '"' + (done ? ' disabled' : '') + '>';
      html += '<span>' + g.label + '</span>';
      html += '</button>';
    });
    html += '</div>';

    if (done) {
      var pts = level2State.pictureScore;
      var chosenPic = GEOMETRY_PICS.find(function (g) { return g.id === chosen; });
      var pickedRight = !!(chosenPic && chosenPic.cn === cn);
      if (pickedRight) {
        var ptsTxt = pts > 0 ? ' +' + pts + ' point' + (pts > 1 ? 's' : '') : '';
        html += '<div class="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm text-center font-semibold mb-3">You are correct!' + ptsTxt + '</div>';
      } else {
        var correctLabel = GEOMETRY_PICS.filter(function (g) { return g.cn === cn; }).map(function (g) { return g.label; }).join(' / ');
        html += '<div class="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center mb-3">You are wrong. The correct answer was <strong>' + correctLabel + '</strong>.</div>';
      }
    } else if (level2State.pictureAttempts > 0) {
      html += '<div class="p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-700 text-sm text-center mb-3">Try again &mdash; attempt ' + level2State.pictureAttempts + ' / 3</div>';
    }

    html += navButtons({ back: true, next: true, nextDisabled: !done && !chosen, nextLabel: done ? "Next: Build in 3D →" : "Submit" });
    c.innerHTML = html;

    document.querySelectorAll(".geo-pic-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (done) return;
        level2State.pictureAnswer = this.getAttribute("data-val");
        renderStep5_Q4_picture();
      });
    });

    bindNav({
      onBack: function () { renderStep(4); },
      onNext: function () {
        if (done) {
          // Lock in the chosen geometry for the 3D build phase
          var picked = GEOMETRY_PICS.find(function (g) { return g.id === level2State.pictureAnswer; });
          if (picked) level2State.selectedGeometry = picked.label;
          // Re-enter step 5 so renderStep3's 3D-build branch runs
          renderStep(5);
          return;
        }
        if (!level2State.pictureAnswer) return;

        level2State.pictureAttempts++;
        var picked = GEOMETRY_PICS.find(function (g) { return g.id === level2State.pictureAnswer; });
        var right = picked && picked.cn === calcCN();
        if (right) {
          level2State.pictureScore = Math.max(0, 4 - level2State.pictureAttempts); // 3, 2, 1
          level2State.pictureDone = true;
          level2State.level2Score += level2State.pictureScore;
          updateScoreBar();
          if (window.AudioManager) window.AudioManager.play("correct");
          renderStep5_Q4_picture();
        } else if (level2State.pictureAttempts >= 3) {
          level2State.pictureScore = 0;
          level2State.pictureDone = true;
          updateScoreBar();
          if (window.AudioManager) window.AudioManager.play("wrong");
          renderStep5_Q4_picture();
        } else {
          if (window.AudioManager) window.AudioManager.play("wrong");
          renderStep5_Q4_picture();
        }
      },
    });
  }

  function renderStep3() {
    saveLevel2State();
    // Q4 gate — if the picture hasn't been picked yet, show that phase first.
    if (!level2State.pictureDone) {
      renderStep5_Q4_picture();
      return;
    }

    var c = $("step-container");
    c.innerHTML = headingBanner(
      "Q5 — Build your complex in 3D",
      "Geometry: <strong class=\"text-amber-300\">" + (level2State.selectedGeometry || "—") + "</strong>. Drag ligands from the inventory onto the empty slots. Attempt " + (level2State.buildAttempts + 1) + " / 3 &middot; click a placed ball to remove it.",
      "5 PTS"
    );

    var bc = $("builder-container");
    if (bc) bc.classList.remove("hidden");

    if (!window.BoneBuilder) return;
    if (!window._boneBuilderInitialized) {
      window.BoneBuilder.init("three-canvas");
      window._boneBuilderInitialized = true;
    }

    var metalName = level2State.selectedMetal ? level2State.selectedMetal.name : null;
    window.BoneBuilder.buildBone(level2State.selectedGeometry, undefined, metalName);

    // Populate the HUD overlay above the 3D canvas: chemistry notation
    // on the left, charge-of-complex pill on the right.
    updateBuilderHud();

    // Step 3 inventory = only ligands selected in Step 1 (if any), else all
    var sourceLigands = getSelectedLigands();
    if (sourceLigands.length === 0) sourceLigands = playerLigands;
    inventoryLigands = sourceLigands.map(function (lig, idx) {
      var chem = LIGAND_CHEMISTRY[lig.id] || LIGAND_CHEMISTRY[(lig.id || '').toLowerCase()];
      return {
        _idx: idx,
        id: lig.id,
        name: lig.name,
        sphere: chem ? chem.sphere : "red",
        bond: chem ? chem.bond : "?",
        denticity: chem ? chem.denticity : 1,
        charge: chem ? chem.charge : 0,
        placed: false,
      };
    });

    renderInventory();
    updateSlotCounter();

    window.BoneBuilder.onPlace(function (ligand, slotIndex) {
      for (var i = 0; i < inventoryLigands.length; i++) {
        if (inventoryLigands[i]._idx === ligand._idx && !inventoryLigands[i].placed) {
          inventoryLigands[i].placed = true;
          break;
        }
      }
      renderInventory();
      updateSlotCounter();
    });

    window.BoneBuilder.onRemove(function (ligand, slotIndex) {
      for (var i = 0; i < inventoryLigands.length; i++) {
        if (inventoryLigands[i]._idx === ligand._idx) {
          inventoryLigands[i].placed = false;
          break;
        }
      }
      renderInventory();
      updateSlotCounter();
    });

    var resetBtn = $("btn-reset-3d");
    if (resetBtn) {
      resetBtn.onclick = function () {
        window.BoneBuilder.resetSlots();
        inventoryLigands.forEach(function (l) { l.placed = false; });
        renderInventory();
        updateSlotCounter();
      };
    }

    var submitBtn = $("btn-submit-3d");
    if (submitBtn) {
      submitBtn.onclick = function () { handleBuildSubmit(); };
    }
  }

  function renderInventory() {
    var inv = $("ligand-inventory");
    if (!inv) return;
    var html = '';
    inventoryLigands.forEach(function (lig) {
      if (lig.placed) return;
      var color = SPHERE_COLORS_CSS[lig.sphere] || '#9CA3AF';
      html += '<div class="lig-drag-card flex flex-col items-center gap-1 p-2 rounded-lg border-2 border-gray-200 bg-white cursor-grab hover:border-[#4187a0] hover:shadow-md transition select-none" draggable="true" data-idx="' + lig._idx + '">';
      html += '<div class="w-8 h-8 rounded-full shadow-inner" style="background-color:' + color + '"></div>';
      html += '<span class="text-xs font-bold text-gray-700">' + lig.name + '</span>';
      html += '</div>';
    });
    if (html === '') html = '<p class="text-gray-400 text-sm">All ligands placed!</p>';
    inv.innerHTML = html;

    document.querySelectorAll(".lig-drag-card").forEach(function (card) {
      card.addEventListener("dragstart", function (e) {
        var idx = parseInt(this.getAttribute("data-idx"), 10);
        var lig = inventoryLigands.find(function (l) { return l._idx === idx; });
        if (lig) window.BoneBuilder.setDraggedLigand(lig);
        e.dataTransfer.setData("text/plain", idx);
        this.style.opacity = "0.4";
      });
      card.addEventListener("dragend", function () {
        this.style.opacity = "1";
        window.BoneBuilder.clearDraggedLigand();
      });
      card.addEventListener("touchstart", function (e) {
        var idx = parseInt(this.getAttribute("data-idx"), 10);
        var lig = inventoryLigands.find(function (l) { return l._idx === idx; });
        if (lig) window.BoneBuilder.setDraggedLigand(lig);
      });
    });
  }

  function updateSlotCounter() {
    var filled = $("slots-filled");
    var total = $("slots-total");
    var submitBtn = $("btn-submit-3d");
    if (filled) filled.textContent = window.BoneBuilder.getFilledCount();
    if (total) total.textContent = window.BoneBuilder.getTotalSlots();
    if (submitBtn) {
      var allFilled = window.BoneBuilder.getFilledCount() === window.BoneBuilder.getTotalSlots();
      submitBtn.disabled = !allFilled;
      submitBtn.className = allFilled
        ? 'px-4 py-2 rounded-lg bg-[#4187a0] text-white font-semibold text-sm hover:bg-[#357a91]'
        : 'px-4 py-2 rounded-lg bg-gray-300 text-gray-500 font-semibold text-sm cursor-not-allowed';
    }
  }

  function validateBuild() {
    // With bidentate auto-pair, each chelating ligand fills 2 slots from
    // a single placement. Skip the partner entry (carries _paired marker)
    // when summing denticity so we don't double-count.
    var placed = window.BoneBuilder.getPlacedLigands();
    var totalDent = 0;
    placed.forEach(function (lig) {
      if (lig && lig._paired !== undefined) return; // partner slot
      var chem = LIGAND_CHEMISTRY[lig.id] || LIGAND_CHEMISTRY[(lig.id || '').toLowerCase()];
      if (chem) totalDent += chem.denticity; else totalDent += 1;
    });
    var expectedSlots = window.BoneBuilder.getTotalSlots();
    var allSlotsFilled = window.BoneBuilder.getFilledCount() === expectedSlots;
    return allSlotsFilled && totalDent === expectedSlots;
  }

  function handleBuildSubmit() {
    level2State.buildAttempts++;
    var valid = validateBuild();
    var placed = window.BoneBuilder.getPlacedLigands();

    if (valid) {
      var pts = level2State.buildAttempts === 1 ? 5 : (level2State.buildAttempts === 2 ? 3 : 1);
      level2State.buildScore = pts;
      level2State.level2Score += pts;
      level2State.buildDone = true;
      updateScoreBar();

      // Play "complex built" SFX
      if (window.AudioManager) window.AudioManager.play('complex-built');

      var checkIcon = '<svg class="w-14 h-14 mx-auto mb-3 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>';
      var c = $("step-container");
      c.innerHTML = '<div class="text-center py-8">'
        + checkIcon
        + '<h2 class="text-xl font-bold text-green-700 mb-2">Complex Built Successfully!</h2>'
        + '<p class="text-gray-600 mb-6">+' + pts + ' points (attempt ' + level2State.buildAttempts + '/3)</p>'
        + navButtons({ back: false, next: true, nextLabel: "See Results" })
        + '</div>';
      bindNav({ onNext: function () { renderResults(); } });
    } else if (level2State.buildAttempts >= 3) {
      level2State.buildScore = 0;
      level2State.buildDone = true;
      updateScoreBar();

      var xIcon = '<svg class="w-14 h-14 mx-auto mb-3 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>';
      var c = $("step-container");
      c.innerHTML = '<div class="text-center py-8">'
        + xIcon
        + '<h2 class="text-xl font-bold text-red-700 mb-2">No attempts remaining</h2>'
        + '<p class="text-gray-600 mb-6">0 points for assembly</p>'
        + navButtons({ back: false, next: true, nextLabel: "See Results" })
        + '</div>';
      bindNav({ onNext: function () { renderResults(); } });
    } else {
      var c = $("step-container");
      c.innerHTML = '<div class="text-center py-4">'
        + '<h2 class="text-lg font-bold text-orange-700 mb-2">You are wrong. Try again.</h2>'
        + '<p class="text-sm text-gray-600 mb-4">Attempts used: ' + level2State.buildAttempts + '/3</p>'
        + '<button id="btn-retry" class="px-6 py-2 rounded-lg bg-[#4187a0] text-white font-semibold hover:bg-[#357a91]">Retry</button>'
        + '</div>';
      $("btn-retry").addEventListener("click", function () {
        window.BoneBuilder.resetSlots();
        inventoryLigands.forEach(function (l) { l.placed = false; });
        renderStep3();
      });
    }
  }

  // ── Step 4: Name the Complex (2 pts) ────────────────────

  function generateIUPACName() {
    var metal = level2State.selectedMetal;
    var placed = window.BoneBuilder ? window.BoneBuilder.getPlacedLigands() : [];

    var ligCounts = {};  // iupac-name → { count, isComplex }
    placed.forEach(function (lig) {
      if (lig && lig._paired !== undefined) return; // bidentate partner — already counted by primary
      var iupac = LIGAND_IUPAC[lig.id] || lig.name;
      if (!ligCounts[iupac]) ligCounts[iupac] = { count: 0, isComplex: !!COMPLEX_LIGAND_IDS[lig.id] };
      ligCounts[iupac].count++;
    });

    var parts = [];
    Object.keys(ligCounts).sort().forEach(function (name) {
      var info = ligCounts[name];
      if (info.isComplex && info.count > 1) {
        parts.push((COMPLEX_PREFIX[info.count] || '') + '(' + name + ')');
      } else {
        parts.push((NUMBER_PREFIX[info.count] || '') + name);
      }
    });

    var metalBase = metal.id.replace(/[0-9]/g, '');
    var metalNames = { co: "cobalt", cr: "chromium", fe: "iron", cu: "copper", ni: "nickel", zn: "zinc" };
    var metalName = metalNames[metalBase] || metalBase;

    var totalCharge = metal.charge;
    placed.forEach(function (lig) {
      if (lig && lig._paired !== undefined) return; // bidentate partner
      var chem = LIGAND_CHEMISTRY[lig.id] || LIGAND_CHEMISTRY[(lig.id || '').toLowerCase()];
      if (chem) totalCharge += chem.charge;
    });

    var romanNumerals = { 1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI" };
    var roman = romanNumerals[metal.charge] || metal.charge;

    var complexName;
    if (totalCharge < 0) {
      var ateNames = { co: "cobaltate", cr: "chromate", fe: "ferrate", cu: "cuprate", ni: "nickelate", zn: "zincate" };
      complexName = parts.join('') + (ateNames[metalBase] || metalName + 'ate') + '(' + roman + ')';
    } else {
      complexName = parts.join('') + metalName + '(' + roman + ')';
    }

    return complexName;
  }

  function generateDistractors(correct) {
    var candidates = [];
    var metals = ["cobalt", "chromium", "iron", "copper", "nickel", "zinc"];
    var prefixes = ["di", "tri", "tetra", "penta", "hexa"];

    // Strategy 1: wrong metal
    var wrongMetal = metals.find(function (m) { return correct.indexOf(m) === -1 && correct.indexOf(m + 'ate') === -1; }) || "manganese";
    candidates.push(correct.replace(/cobalt|chromium|iron|copper|nickel|zinc|cobaltate|chromate|ferrate|cuprate|nickelate|zincate/i, wrongMetal));

    // Strategy 2: wrong prefix
    candidates.push(correct.replace(/di|tri|tetra|penta|hexa/, function (m) {
      var idx = prefixes.indexOf(m);
      return prefixes[(idx + 1) % prefixes.length];
    }));

    // Strategy 3: wrong oxidation state
    candidates.push(correct.replace(/\(I+V?\)/, function (m) {
      return m === "(III)" ? "(II)" : "(III)";
    }));

    // Strategy 4: second wrong metal (fallback)
    var wrongMetal2 = metals.find(function (m) { return m !== wrongMetal && correct.indexOf(m) === -1 && correct.indexOf(m + 'ate') === -1; }) || "titanium";
    candidates.push(correct.replace(/cobalt|chromium|iron|copper|nickel|zinc|cobaltate|chromate|ferrate|cuprate|nickelate|zincate/i, wrongMetal2));

    // Strategy 5: swap prefix direction
    candidates.push(correct.replace(/di|tri|tetra|penta|hexa/, function (m) {
      var idx = prefixes.indexOf(m);
      return prefixes[(idx + 2) % prefixes.length];
    }));

    // Deduplicate and remove any that match correct answer
    var unique = [];
    candidates.forEach(function (d) {
      if (d !== correct && unique.indexOf(d) === -1) unique.push(d);
    });

    return unique.slice(0, 3);
  }

  function renderStep4() {
    var bc = $("builder-container");
    if (bc) bc.classList.add("hidden");

    var c = $("step-container");
    var correct = generateIUPACName();

    // Cache shuffled options so they don't move on re-render
    if (!level2State._namingOptions) {
      var distractors = generateDistractors(correct);
      var options = [correct].concat(distractors);
      for (var i = options.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = options[i]; options[i] = options[j]; options[j] = tmp;
      }
      level2State._namingOptions = options;
      level2State._namingCorrect = correct;
    }

    var options = level2State._namingOptions;

    var done = level2State.namingDone;

    var html = '<h2 class="text-xl font-bold text-gray-800 mb-1">Step 4: Name Your Complex <span class="text-sm font-normal text-gray-400">(2 pts)</span></h2>';
    html += '<p class="text-gray-500 text-sm mb-6">Select the correct IUPAC name for the complex you built.</p>';

    html += '<div class="space-y-3">';
    options.forEach(function (opt, i) {
      var letter = String.fromCharCode(65 + i);
      var cls = 'w-full p-4 rounded-lg text-left border-2 transition font-medium ';
      if (done) {
        if (opt === correct) cls += 'border-green-500 bg-green-50 text-green-700 ';
        else if (opt === level2State.namingAnswer && opt !== correct) cls += 'border-red-500 bg-red-50 text-red-700 ';
        else cls += 'border-gray-200 text-gray-400 ';
        cls += 'cursor-default ';
      } else {
        cls += 'border-gray-200 hover:border-[#4187a0] cursor-pointer ';
      }
      html += '<button class="name-btn ' + cls + '" data-val="' + opt + '"' + (done ? ' disabled' : '') + '>' + letter + '. ' + opt + '</button>';
    });
    html += '</div>';

    if (done) {
      var pickedRight = level2State.namingAnswer === correct;
      if (pickedRight) {
        var ptsTxt = level2State.namingScore > 0 ? ' +' + level2State.namingScore + ' point' + (level2State.namingScore > 1 ? 's' : '') : '';
        html += '<div class="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm text-center font-semibold">You are correct!' + ptsTxt + '</div>';
      } else {
        html += '<div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">You are wrong. The answer is <strong>' + correct + '</strong></div>';
      }
    }

    html += navButtons({ back: false, next: true, nextDisabled: !done, nextLabel: "See Results" });
    c.innerHTML = html;

    if (!done) {
      document.querySelectorAll(".name-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var val = this.getAttribute("data-val");
          level2State.namingAnswer = val;
          level2State.namingDone = true;
          if (val === correct) {
            level2State.namingScore = 2;
            level2State.level2Score += 2;
          }
          updateScoreBar();
          renderStep4();
        });
      });
    }

    bindNav({ onNext: function () { renderResults(); } });
  }

  // ── Results ─────────────────────────────────────────────

  function renderResults() {
    updateStepIndicator(6);
    var bc = $("builder-container"); if (bc) bc.classList.add("hidden");
    var c = $("step-container");
    var l1 = 0;
    if (gameState && gameState.playerPoints) l1 = gameState.playerPoints[level2State.playerId] || 0;
    var l2 = level2State.level2Score;
    var grand = l1 + l2;

    var trophyIcon = '<svg class="w-16 h-16 mx-auto mb-3 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>';
    var html = '<div class="text-center">';
    html += trophyIcon;
    html += '<h2 class="text-2xl font-bold text-gray-800 mb-2">Level 2 Complete!</h2>';
    html += '<p class="text-gray-500 mb-6">' + level2State.playerName + ', here is your score breakdown.</p>';

    html += '<div class="bg-gray-50 rounded-lg p-6 text-left max-w-sm mx-auto">';
    html += '<table class="w-full text-sm"><tbody>';
    html += '<tr class="border-b border-gray-200"><td class="py-2 text-gray-600">Level 1 Points</td><td class="py-2 text-right font-bold">' + l1 + '</td></tr>';
    html += '<tr class="border-b border-gray-200"><td class="py-2 text-gray-600">Step 1: Choose metal &amp; ligands</td><td class="py-2 text-right font-bold">' + (level2State.setupScore || 0) + ' / 2</td></tr>';
    html += '<tr class="border-b border-gray-200"><td class="py-2 text-gray-600">Step 2: Predict type</td><td class="py-2 text-right font-bold">' + (level2State.typeScore || 0) + ' / 2</td></tr>';
    html += '<tr class="border-b border-gray-200"><td class="py-2 text-gray-600">Step 3: Coordination number</td><td class="py-2 text-right font-bold">' + (level2State.cnScore || 0) + ' / 1</td></tr>';
    html += '<tr class="border-b border-gray-200"><td class="py-2 text-gray-600">Step 4: Geometry</td><td class="py-2 text-right font-bold">' + (level2State.geometryScore || 0) + ' / 1</td></tr>';
    html += '<tr class="border-b border-gray-200"><td class="py-2 text-gray-600">Step 5: 3D build</td><td class="py-2 text-right font-bold">' + (level2State.buildScore || 0) + ' / 6</td></tr>';
    html += '<tr class="text-lg"><td class="pt-3 font-bold text-gray-800">Grand Total</td><td class="pt-3 text-right font-bold text-[#4187a0]">' + grand + '</td></tr>';
    html += '</tbody></table></div>';

    html += '<button id="btn-show-podium" class="inline-block mt-8 px-8 py-3 rounded-lg bg-[#4187a0] text-white font-bold hover:bg-[#357a91] transition">Show Podium</button>';
    html += '</div>';

    c.innerHTML = html;
    updateScoreBar();

    // Save this player's final totals so multi-player Level 2 can
    // aggregate across turns. If more players are still due, the
    // button says "Pass device to next player" instead of "Show Podium".
    persistLevel2Finish(level2State.playerId, level2State.playerName, grand);

    var btn = $("btn-show-podium");
    if (btn) btn.onclick = function () { openFinalPodiumOrNext(); };

    // Auto-open podium after a beat if everyone's done
    setTimeout(openFinalPodiumOrNext, 800);
  }

  /**
   * Write the finishing player's grand total into sessionStorage under
   * a shared `level2-finals` map. Persists across page reloads so the
   * podium can show every player once the last one finishes.
   */
  function persistLevel2Finish(playerId, playerName, grandTotal) {
    var finals = {};
    try { finals = JSON.parse(sessionStorage.getItem("level2-finals") || "{}"); } catch (e) {}
    finals[playerId] = {
      playerId: Number(playerId),
      playerName: playerName,
      score: grandTotal,
      finishedAt: Date.now(),
    };
    sessionStorage.setItem("level2-finals", JSON.stringify(finals));
    // Player has finished — drop the in-progress snapshot so a fresh
    // start (or device hand-off) doesn't resume into a finished game.
    clearLevel2State();
  }

  /**
   * Count how many active players are expected, compare with finals.
   * If all finished → open podium. Otherwise prompt for the next.
   */
  function openFinalPodiumOrNext() {
    var finals = {};
    try { finals = JSON.parse(sessionStorage.getItem("level2-finals") || "{}"); } catch (e) {}
    var expected = getExpectedActivePlayers();
    var entries = Object.values(finals);

    if (entries.length >= expected.length) {
      if (window.LevelTwoPodium && typeof window.LevelTwoPodium.show === "function") {
        window.LevelTwoPodium.show(entries);
      }
    } else {
      var remaining = expected.filter(function (pid) { return !finals[pid]; });
      alert("Pass the device to " + playerNameFor(remaining[0]) + " to finish Level 2.");
    }
  }

  function getExpectedActivePlayers() {
    try {
      if (window.TurnManager && typeof window.TurnManager.getActivePlayers === "function") {
        var ap = window.TurnManager.getActivePlayers();
        if (Array.isArray(ap) && ap.length > 0) return ap;
      }
    } catch (e) {}
    var opt = sessionStorage.getItem("game-option");
    if (opt === "solo") return [1];
    if (opt === "one-vs-one") return [1, 4];
    if (opt === "one-vs-two") return [1, 2, 3];
    if (opt === "one-vs-three") return [1, 2, 3, 4];
    return [1];
  }

  function playerNameFor(playerId) {
    var opt = sessionStorage.getItem("game-option") || "one-vs-one";
    return sessionStorage.getItem(opt + "-player-" + playerId + "-name")
        || sessionStorage.getItem("solo-player-name")
        || ("Player " + playerId);
  }

  // ── Boot ────────────────────────────────────────────────

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
