/* ============================================================
   Level 2 — Build Your Complex  (level-2-game.js)
   4-step wizard: Metal → Geometry → 3D Build → Name
   ============================================================ */

(function () {
  "use strict";

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

  // ── Init ────────────────────────────────────────────────

  function init() {
    try {
      gameState = JSON.parse(sessionStorage.getItem("game-state"));
    } catch (e) {
      window.location.href = "/pass-and-play"; return;
    }
    if (!gameState) { window.location.href = "/pass-and-play"; return; }

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

    updateScoreBar();
    renderStep(1);
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
  function renderCollectedLigandsStrip() {
    var strip = $("collected-ligands-strip");
    var list = $("collected-ligands-list");
    var count = $("cl-count");
    if (!strip || !list) return;

    if (!playerLigands || playerLigands.length === 0) {
      strip.classList.add("hidden");
      return;
    }

    // Group by id
    var byId = {};
    playerLigands.forEach(function (lig) {
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
      var typeLabel = r.type === 'Bidentate' ? 'Bi' : 'Mono';
      return ''
        + '<button type="button" class="ligand-strip-pill flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 hover:bg-white hover:border-[#4187a0] hover:shadow-sm transition" data-ligand-id="' + k + '" title="' + r.name + ' — click to view card">'
        +   '<span class="inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-[10px] font-black shadow" style="background:' + bg + '">' + r.bond + '</span>'
        +   '<span class="text-sm font-semibold text-gray-800">' + r.name + '</span>'
        +   (r.count > 1 ? '<span class="text-xs font-bold text-gray-500">&times;' + r.count + '</span>' : '')
        +   '<span class="text-[10px] uppercase tracking-wide text-gray-400">' + typeLabel + '</span>'
        + '</button>';
    }).join('');

    list.innerHTML = html;
    if (count) count.textContent = String(playerLigands.length);
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
      +       '<div class="w-full h-full bg-no-repeat" style="background-image:url(\'' + imgPath + '\'); background-position:0% center; background-size:200%;"></div>'
      +       '<div class="absolute bottom-2 right-2 px-3 py-1 bg-black/70 text-white text-xs rounded-full font-semibold pointer-events-none">Click to flip</div>'
      +     '</div>'
      +     '<div class="absolute inset-0 rounded-2xl border-4 overflow-hidden bg-white shadow-2xl" style="border-color:' + color + '; backface-visibility:hidden; transform:rotateY(180deg);">'
      +       '<div class="w-full h-full bg-no-repeat" style="background-image:url(\'' + imgPath + '\'); background-position:100% center; background-size:200%;"></div>'
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
    var html = '<div class="flex justify-between mt-8">';
    if (opts.back) {
      html += '<button id="btn-back" class="px-6 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition font-semibold">Back</button>';
    } else { html += '<div></div>'; }
    if (opts.next) {
      var dis = opts.nextDisabled ? ' disabled' : '';
      var cls = opts.nextDisabled
        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
        : 'bg-[#4187a0] text-white hover:bg-[#357a91]';
      var label = opts.nextLabel || 'Next';
      html += '<button id="btn-next" class="px-6 py-2 rounded-lg font-semibold transition ' + cls + '"' + dis + '>' + label + '</button>';
    }
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
    updateStepIndicator(step);
    renderCollectedLigandsStrip();
    var bc = $("builder-container");
    // 3D builder only shown on step 5 (was step 4)
    if (bc) bc.classList.toggle("hidden", step !== 5);
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
    var c = $("step-container");
    var selectedIdxs = level2State.selectedLigandIdxs || [];
    var selCN = calcCNForIndices(selectedIdxs);
    var validCN = selCN >= 3 && selCN <= 6;
    var canAdvance = !!level2State.selectedMetal && selectedIdxs.length > 0 && validCN;

    var html = '<h2 class="text-xl font-bold text-gray-800 mb-1">Step 1: Build Your Complex</h2>';
    html += '<p class="text-gray-500 text-sm mb-4">Pick one central metal, then choose ligands so the total coordination number (CN) is 3, 4, 5, or 6.</p>';

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
      html += '<button class="ligand-pill p-3 rounded-full border-2 font-semibold text-base ' + border + ' transition cursor-pointer" data-ligand-idx="' + idx + '">';
      html += lig.name + ' <span class="text-xs opacity-70">(d=' + d + ')</span>';
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

  function renderStep2_Q1_type() {
    var c = $("step-container");
    var charge = computeTotalCharge();
    var correct = classifyComplex(charge.total);
    var done = level2State.typeDone;
    var chosen = level2State.typeAnswer;

    var html = '<h2 class="text-xl font-bold text-gray-800 mb-1">1. Predict the type of complex <span class="text-sm font-normal text-gray-400">(2 pts)</span></h2>';
    html += '<p class="text-gray-500 text-sm mb-3">Based on the metal charge and your chosen ligands, is the complex neutral, an anion, or a cation?</p>';

    // Per latest spec: keep Ligand + Charge columns (no X across all
    // rows). Number-of-ligands and contribution columns stay removed
    // — students compute the total themselves from this minimal data.
    html += '<div class="overflow-x-auto mb-3 rounded-lg border border-gray-200">';
    html += '<table class="w-full text-sm">';
    html += '<thead class="bg-gray-50 text-gray-700"><tr>';
    html += '<th class="text-left px-3 py-2 font-semibold">Ligand</th>';
    html += '<th class="text-center px-3 py-2 font-semibold">Charge</th>';
    html += '</tr></thead><tbody>';
    function fmtCharge(c) {
      if (c > 0) return '+' + c;
      return String(c);
    }
    charge.rows.forEach(function (r) {
      var label = r.count > 1 ? (r.name + ' &times; ' + r.count) : r.name;
      html += '<tr class="border-t border-gray-100">';
      html += '<td class="px-3 py-2 font-medium text-gray-800">' + label + '</td>';
      html += '<td class="text-center px-3 py-2">' + fmtCharge(r.charge) + '</td>';
      html += '</tr>';
    });
    // Metal row
    html += '<tr class="border-t border-gray-100 bg-blue-50">';
    html += '<td class="px-3 py-2 font-medium text-gray-800">Metal: ' + (level2State.selectedMetal ? level2State.selectedMetal.name : "—") + '</td>';
    html += '<td class="text-center px-3 py-2 font-semibold">' + fmtCharge(charge.metalCharge) + '</td>';
    html += '</tr>';
    html += '</tbody></table></div>';


    // 3-option answer
    var options = [
      { id: "neutral", label: "Neutral", hint: "Total = 0" },
      { id: "anion",   label: "Anion",   hint: "Total < 0" },
      { id: "cation",  label: "Cation",  hint: "Total > 0" },
    ];
    html += '<div class="grid grid-cols-3 gap-3 mb-3">';
    options.forEach(function (opt) {
      var cls = 'p-3 rounded-lg font-semibold text-sm border-2 transition text-center ';
      if (done) {
        if (opt.id === correct) cls += 'border-green-500 bg-green-50 text-green-700 ';
        else if (opt.id === chosen) cls += 'border-red-500 bg-red-50 text-red-700 ';
        else cls += 'border-gray-200 text-gray-400 ';
        cls += 'cursor-default ';
      } else {
        if (opt.id === chosen) cls += 'border-[#4187a0] bg-[#4187a0]/10 text-[#4187a0] ';
        else cls += 'border-gray-200 hover:border-[#4187a0] cursor-pointer ';
      }
      html += '<button class="type-opt ' + cls + '" data-val="' + opt.id + '"' + (done ? ' disabled' : '') + '>';
      html += '<div>' + opt.label + '</div>';
      html += '<div class="text-[11px] font-normal opacity-70 mt-1">' + opt.hint + '</div>';
      html += '</button>';
    });
    html += '</div>';

    if (done) {
      var pts = level2State.typeScore;
      if (pts > 0) {
        html += '<div class="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm text-center font-semibold mb-3">Correct! +' + pts + ' point' + (pts > 1 ? 's' : '') + '</div>';
      } else {
        html += '<div class="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center mb-3">Not quite. The correct answer was <strong>' + correct + '</strong>.</div>';
      }
    } else if (level2State.typeAttempts > 0) {
      html += '<div class="p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-700 text-sm text-center mb-3">Try again. Attempt ' + level2State.typeAttempts + '/2</div>';
    }

    html += navButtons({ back: true, next: true, nextDisabled: !done && !chosen, nextLabel: done ? "Next: Geometry" : "Submit" });
    c.innerHTML = html;

    document.querySelectorAll(".type-opt").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (done) return;
        level2State.typeAnswer = this.getAttribute("data-val");
        renderStep2_Q1_type();
      });
    });

    bindNav({
      onBack: function () { renderStep(1); },
      onNext: function () {
        if (done) { renderStep(3); return; }
        if (!level2State.typeAnswer) return;

        level2State.typeAttempts++;
        var isRight = level2State.typeAnswer === correct;
        if (isRight) {
          level2State.typeScore = level2State.typeAttempts === 1 ? 2 : 1;
          level2State.typeDone = true;
          level2State.level2Score += level2State.typeScore;
          updateScoreBar();
          if (window.AudioManager) window.AudioManager.play("correct");
          renderStep2_Q1_type();
        } else if (level2State.typeAttempts >= 2) {
          level2State.typeScore = 0;
          level2State.typeDone = true;
          updateScoreBar();
          if (window.AudioManager) window.AudioManager.play("wrong");
          renderStep2_Q1_type();
        } else {
          if (window.AudioManager) window.AudioManager.play("wrong");
          renderStep2_Q1_type();
        }
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

  // Info bubble content keyed by topic. Clicking the "i" pill opens
  // an overlay with the matching text (spec: three coloured speech
  // bubbles from the mock).
  var INFO_BUBBLES = {
    cn: {
      title: "Coordination Number",
      body: "The number of ligand donor atoms surrounding the central metal.",
    },
    denticity: {
      title: "Denticity",
      body: "The number of donor atoms in a ligand that can bind to the central metal ion.<br><br><strong>Monodentate (1)</strong> → 1 donor atom<br><strong>Bidentate (2)</strong> → 2 donor atoms",
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

    var html = '<div class="flex items-center justify-between mb-1">';
    html += '<h2 class="text-xl font-bold text-gray-800">2. Predict the coordination number <span class="text-sm font-normal text-gray-400">(3, 4, 5 or 6)</span></h2>';
    html += '<button type="button" class="px-3 py-1 rounded-full bg-[#4187a0] text-white text-xs font-bold hover:bg-[#357a91]" onclick="window.__l2InfoBubble(\'cn\')">What is CN?</button>';
    html += '</div>';
    html += '<p class="text-gray-500 text-sm mb-4">Sum the bonding positions each ligand takes up. Tap the info pills for help.</p>';

    // Per latest spec: keep Ligand + Type of denticity + Denticity (d)
    // + No. of ligand(s) (n). The "No. of coordination sites (d × n)"
    // column is X'd out — students multiply themselves and sum to a CN.
    html += '<div class="overflow-x-auto mb-3 rounded-lg border border-gray-200">';
    html += '<table class="w-full text-sm">';
    html += '<thead class="bg-[#4187a0] text-white"><tr>';
    html += '<th class="text-left px-3 py-2 font-semibold">Ligand(s)</th>';
    html += '<th class="px-3 py-2 font-semibold">';
    html += 'Type of denticity ';
    html += '<button type="button" class="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-white text-xs font-bold hover:bg-white/30" onclick="window.__l2InfoBubble(\'denticity\')">i</button>';
    html += '</th>';
    html += '<th class="text-center px-3 py-2 font-semibold">Denticity, d</th>';
    html += '<th class="text-center px-3 py-2 font-semibold">No. of ligand(s), n</th>';
    html += '</tr></thead><tbody>';
    rows.forEach(function (r) {
      html += '<tr class="border-t border-gray-100">';
      html += '<td class="px-3 py-2 font-medium text-gray-800">' + r.name + '</td>';
      html += '<td class="text-center px-3 py-2">' + r.type.toLowerCase() + '</td>';
      html += '<td class="text-center px-3 py-2">' + r.denticity + '</td>';
      html += '<td class="text-center px-3 py-2">' + r.count + '</td>';
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
      if (pts > 0) {
        html += '<div class="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm text-center font-semibold mb-3">Correct! CN = ' + cn + ' (+' + pts + ' pt' + (pts > 1 ? 's' : '') + ')</div>';
      } else {
        html += '<div class="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center mb-3">Not quite. The correct CN was <strong>' + cn + '</strong>.</div>';
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
        renderStep3_Q2_cn();
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
    var c = $("step-container");
    var cn = calcCN();
    var correctList = GEOMETRY_MAP[cn] || [];
    var displayLigands = getSelectedLigands();
    if (displayLigands.length === 0) displayLigands = playerLigands;

    var html = '<h2 class="text-xl font-bold text-gray-800 mb-1">3. State the possible complex geometry <span class="text-sm font-normal text-gray-400">(2 pts)</span></h2>';
    html += '<p class="text-gray-500 text-sm mb-3">Pick the geometry that matches your coordination number from the six options below.</p>';

    // CN → Geometry reference table per spec (6 rows across 4 CN values)
    html += '<div class="overflow-x-auto mb-4 rounded-lg border border-gray-200">';
    html += '<table class="w-full text-sm">';
    html += '<thead class="bg-[#4187a0] text-white"><tr>';
    html += '<th class="text-left px-3 py-2 font-semibold w-32">Coordination no.</th>';
    html += '<th class="text-left px-3 py-2 font-semibold text-red-100">Geometry</th>';
    html += '</tr></thead><tbody>';
    // Reference table only — no row highlighted, the player has to
    // work out their own CN before picking the geometry.
    [3, 4, 5, 6].forEach(function (n) {
      var geos = GEOMETRY_MAP[n] || [];
      html += '<tr class="border-t border-gray-100">';
      html += '<td class="px-3 py-2 align-top">' + n + '</td>';
      html += '<td class="px-3 py-2 text-red-600">' + geos.map(function (g) { return '<div>' + g + '</div>'; }).join('') + '</td>';
      html += '</tr>';
    });
    html += '</tbody></table></div>';

    var done = level2State.geometryDone;
    html += '<div class="grid grid-cols-2 sm:grid-cols-3 gap-3">';
    ALL_GEOMETRIES.forEach(function (geo) {
      var meta = GEOMETRY_META[geo] || {};
      var isCorrect = correctList.indexOf(geo) >= 0;
      var cls = 'geo-btn group relative rounded-xl border-2 transition-all overflow-hidden bg-white text-center flex flex-col items-center';
      if (done) {
        if (isCorrect) cls += ' border-green-500 ring-2 ring-green-200 shadow-md';
        else if (geo === level2State.selectedGeometry && !isCorrect) cls += ' border-red-500 bg-red-50';
        else cls += ' border-gray-200 opacity-60';
        cls += ' cursor-default';
      } else {
        cls += ' border-gray-200 hover:border-[#4187a0] hover:shadow-lg hover:-translate-y-0.5 cursor-pointer';
      }
      html += '<button class="' + cls + '" data-val="' + geo + '"' + (done ? ' disabled' : '') + '>';
      html +=   '<div class="w-full aspect-square bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-2">';
      html +=     '<img src="' + meta.img + '" alt="' + geo + '" class="max-w-full max-h-full object-contain transition-transform group-hover:scale-110" loading="lazy" />';
      html +=   '</div>';
      html +=   '<div class="w-full px-2 py-2 text-xs sm:text-sm font-semibold text-gray-800 leading-tight">' + geo + '</div>';
      html += '</button>';
    });
    html += '</div>';

    if (done) {
      var pts = level2State.geometryScore;
      if (pts > 0) {
        html += '<div class="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm text-center font-semibold">Correct! +' + pts + ' point' + (pts > 1 ? 's' : '') + '</div>';
      } else {
        html += '<div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">The correct geometry: <strong>' + correctList.join(", ") + '</strong></div>';
      }
    } else if (level2State.geometryAttempts > 0) {
      html += '<div class="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-700 text-sm text-center">Not quite! Try again. Attempts: ' + level2State.geometryAttempts + '/3</div>';
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
          } else if (level2State.geometryAttempts >= 3) {
            level2State.selectedGeometry = correctList[0];
            level2State.geometryScore = 0;
            level2State.geometryDone = true;
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
    var c = $("step-container");
    var bc = $("builder-container");
    if (bc) bc.classList.add("hidden"); // hide the 3D canvas during picture pick

    var cn = calcCN();
    var done = level2State.pictureDone;
    var chosen = level2State.pictureAnswer;

    var html = '<h2 class="text-xl font-bold text-gray-800 mb-1">4. Drag and drop the appropriate tools to form your complex structure <span class="text-sm font-normal text-gray-400">(3 pts)</span></h2>';
    html += '<p class="text-gray-500 text-sm mb-2">First, pick the complex picture that matches your coordination number. Your CN = <strong class="text-[#4187a0]">' + cn + '</strong>.</p>';
    html += '<p class="text-xs text-gray-500 mb-4">Attempt ' + Math.min(level2State.pictureAttempts + (done ? 0 : 1), 3) + ' / 3 &nbsp; | &nbsp; 1st = 3 pts · 2nd = 2 pts · 3rd = 1 pt</p>';

    // Grid of 6 options
    html += '<div class="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">';
    GEOMETRY_PICS.forEach(function (g) {
      var isCorrect = g.cn === cn;
      var cls = 'geo-pic-btn relative p-2 rounded-xl border-2 bg-white transition text-center ';
      if (done) {
        if (g.id === chosen && isCorrect) cls += 'border-green-500 ring-2 ring-green-500/30 ';
        else if (g.id === chosen && !isCorrect) cls += 'border-red-500 ring-2 ring-red-500/30 ';
        else if (isCorrect) cls += 'border-green-300 ';
        else cls += 'border-gray-200 opacity-60 ';
        cls += 'cursor-default ';
      } else {
        if (g.id === chosen) cls += 'border-[#4187a0] ring-2 ring-[#4187a0]/30 ';
        else cls += 'border-gray-200 hover:border-[#4187a0] cursor-pointer hover:scale-105 ';
      }
      html += '<button class="' + cls + '" data-val="' + g.id + '"' + (done ? ' disabled' : '') + '>';
      html += '<img src="' + g.image + '" alt="' + g.label + '" class="w-full h-auto object-contain mb-1" />';
      html += '<div class="text-xs font-semibold text-gray-800">' + g.label + '</div>';
      html += '<div class="text-[10px] text-gray-500">CN = ' + g.cn + '</div>';
      html += '</button>';
    });
    html += '</div>';

    if (done) {
      var pts = level2State.pictureScore;
      if (pts > 0) {
        html += '<div class="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm text-center font-semibold mb-3">Correct! +' + pts + ' point' + (pts > 1 ? 's' : '') + '</div>';
      } else {
        var correctLabel = GEOMETRY_PICS.filter(function (g) { return g.cn === cn; }).map(function (g) { return g.label; }).join(' / ');
        html += '<div class="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center mb-3">The correct answer was <strong>' + correctLabel + '</strong>.</div>';
      }
    } else if (level2State.pictureAttempts > 0) {
      html += '<div class="p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-700 text-sm text-center mb-3">Not quite. Try again — attempt ' + level2State.pictureAttempts + ' / 3</div>';
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
    // Q4 gate — if the picture hasn't been picked yet, show that phase first.
    if (!level2State.pictureDone) {
      renderStep5_Q4_picture();
      return;
    }

    var c = $("step-container");
    c.innerHTML = '<h2 class="text-xl font-bold text-gray-800 mb-1">4. Build your complex in 3D <span class="text-sm font-normal text-gray-400">(5 pts — 1 per correctly placed ligand)</span></h2>'
      + '<p class="text-gray-500 text-sm mb-2">Geometry: <strong class="text-[#4187a0]">' + (level2State.selectedGeometry || "—") + '</strong>. Drag ligands from the inventory onto the empty slots.</p>'
      + '<p class="text-sm text-gray-600">Attempt: <strong>' + (level2State.buildAttempts + 1) + '</strong> / 3 &nbsp; | &nbsp; Click a placed ball to remove it.</p>';

    var bc = $("builder-container");
    if (bc) bc.classList.remove("hidden");

    if (!window.BoneBuilder) return;
    if (!window._boneBuilderInitialized) {
      window.BoneBuilder.init("three-canvas");
      window._boneBuilderInitialized = true;
    }

    window.BoneBuilder.buildBone(level2State.selectedGeometry);

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
    // Check that placed ligands produce correct CN for the chosen geometry
    var placed = window.BoneBuilder.getPlacedLigands();
    var totalDent = 0;
    placed.forEach(function (lig) {
      var chem = LIGAND_CHEMISTRY[lig.id] || LIGAND_CHEMISTRY[(lig.id || '').toLowerCase()];
      if (chem) totalDent += chem.denticity; else totalDent += 1;
    });
    var expectedSlots = window.BoneBuilder.getTotalSlots();
    // Valid if all slots filled AND total denticity matches slot count
    return placed.length === expectedSlots && totalDent === expectedSlots;
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
        + '<p class="text-gray-600 mb-2">+' + pts + ' points (attempt ' + level2State.buildAttempts + '/3)</p>'
        + '<p class="text-sm text-gray-500 mb-6">Your complex: [' + level2State.selectedMetal.name + '] with ' + placed.length + ' ligands</p>'
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
        + '<h2 class="text-lg font-bold text-orange-700 mb-2">Not quite right! Try again.</h2>'
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
      if (level2State.namingScore > 0) {
        html += '<div class="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm text-center font-semibold">Correct! +2 points</div>';
      } else {
        html += '<div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">Incorrect. The answer is <strong>' + correct + '</strong></div>';
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
