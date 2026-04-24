/* ============================================================
   Level 2 — Build Your Complex  (level-2-game.js)
   4-step wizard: Metal → Geometry → 3D Build → Name
   ============================================================ */

(function () {
  "use strict";

  // ── Chemistry Data ───────────────────────────────────────

  var LIGAND_CHEMISTRY = {
    h2o:  { name: "H\u2082O",    charge: 0,  denticity: 1, type: "Monodentate", sphere: "red" },
    nh3:  { name: "NH\u2083",    charge: 0,  denticity: 1, type: "Monodentate", sphere: "blue" },
    py:   { name: "py",          charge: 0,  denticity: 1, type: "Monodentate", sphere: "blue" },
    pph3: { name: "PPh\u2083",   charge: 0,  denticity: 1, type: "Monodentate", sphere: "orange" },
    cn:   { name: "CN\u207B",    charge: -1, denticity: 1, type: "Monodentate", sphere: "blue" },
    o2:   { name: "O\u00B2\u207B", charge: -2, denticity: 1, type: "Monodentate", sphere: "red" },
    cl:   { name: "Cl\u207B",   charge: -1, denticity: 1, type: "Monodentate", sphere: "green" },
    ox:   { name: "Ox\u00B2\u207B",  charge: -2, denticity: 2, type: "Bidentate", sphere: "red" },
    acac: { name: "acac\u207B", charge: -1, denticity: 2, type: "Bidentate",  sphere: "red" },
    co32: { name: "CO\u2083\u00B2\u207B", charge: -2, denticity: 2, type: "Bidentate", sphere: "red" },
    phen: { name: "phen",       charge: 0,  denticity: 2, type: "Bidentate",  sphere: "blue" },
    bipy: { name: "bipy",       charge: 0,  denticity: 2, type: "Bidentate",  sphere: "blue" },
    en:   { name: "en",         charge: 0,  denticity: 2, type: "Bidentate",  sphere: "blue" },
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
    namingAnswer: null,
    namingScore: 0,
    namingDone: false,
    level2Score: 0,
    /** Indices into playerLigands selected by the user in Step 1. */
    selectedLigandIdxs: [],
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

    var nameKey = gameOption + "-player-" + level2State.playerId + "-name";
    level2State.playerName = sessionStorage.getItem(nameKey) || ("Player " + level2State.playerId);

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
    var bc = $("builder-container");
    if (bc) bc.classList.toggle("hidden", step !== 3);
    switch (step) {
      case 1: renderStep1(); break;
      case 2: renderStep2(); break;
      case 3: renderStep3(); break;
      case 4: renderStep4(); break;
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
      renderStep(2);
    } });
  }

  // ── Step 2: Pick Geometry (2 pts) ───────────────────────

  function renderStep2() {
    var c = $("step-container");
    var cn = calcCN();
    var correctList = GEOMETRY_MAP[cn] || [];
    var displayLigands = getSelectedLigands();
    if (displayLigands.length === 0) displayLigands = playerLigands;

    var html = '<h2 class="text-xl font-bold text-gray-800 mb-1">Step 2: Choose the Geometry <span class="text-sm font-normal text-gray-400">(2 pts)</span></h2>';
    html += '<p class="text-gray-500 text-sm mb-2">Based on your ' + displayLigands.length + ' chosen ligands (CN = ' + cn + '), pick the matching geometry.</p>';

    html += '<div class="bg-gray-50 rounded-lg p-3 mb-4 text-sm">';
    html += '<div class="flex flex-wrap gap-2">';
    displayLigands.forEach(function (lig) {
      var chem = LIGAND_CHEMISTRY[lig.id] || LIGAND_CHEMISTRY[(lig.id || '').toLowerCase()];
      var d = chem ? chem.denticity : 1;
      var t = chem ? chem.type : "?";
      html += '<span class="px-2 py-1 bg-white rounded border text-xs">' + lig.name + ' <span class="text-gray-400">(' + t + ', d=' + d + ')</span></span>';
    });
    html += '</div>';
    html += '<p class="mt-2 text-right font-semibold">Total CN = ' + cn + '</p></div>';

    var imgFile = (cn <= 4) ? "1.png" : "2.png";
    html += '<div class="flex justify-center mb-4"><img src="/images/geometry/' + imgFile + '" alt="Geometry reference" class="max-h-40 rounded-lg shadow-sm" /></div>';

    var done = level2State.geometryDone;
    html += '<div class="grid grid-cols-2 sm:grid-cols-3 gap-3">';
    ALL_GEOMETRIES.forEach(function (geo) {
      var isCorrect = correctList.indexOf(geo) >= 0;
      var cls = 'p-3 rounded-lg font-semibold text-sm border-2 transition text-center ';
      if (done) {
        if (isCorrect) cls += 'border-green-500 bg-green-50 text-green-700 ';
        else if (geo === level2State.selectedGeometry && !isCorrect) cls += 'border-red-500 bg-red-50 text-red-700 ';
        else cls += 'border-gray-200 text-gray-400 ';
        cls += 'cursor-default ';
      } else {
        cls += 'border-gray-200 hover:border-[#4187a0] cursor-pointer ';
      }
      html += '<button class="geo-btn ' + cls + '" data-val="' + geo + '"' + (done ? ' disabled' : '') + '>' + geo + '</button>';
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
            var pts = Math.max(0, 3 - level2State.geometryAttempts);
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
      onBack: function () { renderStep(1); },
      onNext: function () { renderStep(3); },
    });
  }

  // ── Step 3: 3D Build (6 pts) ────────────────────────────

  var inventoryLigands = [];

  function renderStep3() {
    var c = $("step-container");
    c.innerHTML = '<h2 class="text-xl font-bold text-gray-800 mb-1">Step 3: Build Your Complex <span class="text-sm font-normal text-gray-400">(6 pts)</span></h2>'
      + '<p class="text-gray-500 text-sm mb-2">Drag ligands from your inventory and drop them onto the empty slots on the 3D model.</p>'
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
      var pts = level2State.buildAttempts === 1 ? 6 : (level2State.buildAttempts === 2 ? 4 : 2);
      level2State.buildScore = pts;
      level2State.level2Score += pts;
      level2State.buildDone = true;
      updateScoreBar();

      // Play "complex built" SFX
      if (window.AudioManager) window.AudioManager.play('complex-built');

      var c = $("step-container");
      c.innerHTML = '<div class="text-center py-8">'
        + '<div class="text-5xl mb-4">&#9989;</div>'
        + '<h2 class="text-xl font-bold text-green-700 mb-2">Complex Built Successfully!</h2>'
        + '<p class="text-gray-600 mb-2">+' + pts + ' points (attempt ' + level2State.buildAttempts + '/3)</p>'
        + '<p class="text-sm text-gray-500 mb-6">Your complex: [' + level2State.selectedMetal.name + '] with ' + placed.length + ' ligands</p>'
        + navButtons({ back: false, next: true, nextLabel: "Next: Name Your Complex" })
        + '</div>';
      bindNav({ onNext: function () { renderStep(4); } });
    } else if (level2State.buildAttempts >= 3) {
      level2State.buildScore = 0;
      level2State.buildDone = true;
      updateScoreBar();

      var c = $("step-container");
      c.innerHTML = '<div class="text-center py-8">'
        + '<div class="text-5xl mb-4">&#128546;</div>'
        + '<h2 class="text-xl font-bold text-red-700 mb-2">No attempts remaining</h2>'
        + '<p class="text-gray-600 mb-6">0 points for assembly</p>'
        + navButtons({ back: false, next: true, nextLabel: "Next: Name Your Complex" })
        + '</div>';
      bindNav({ onNext: function () { renderStep(4); } });
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

    var ligCounts = {};
    placed.forEach(function (lig) {
      var iupac = LIGAND_IUPAC[lig.id] || lig.name;
      ligCounts[iupac] = (ligCounts[iupac] || 0) + 1;
    });

    var parts = [];
    Object.keys(ligCounts).sort().forEach(function (name) {
      var count = ligCounts[name];
      parts.push((NUMBER_PREFIX[count] || '') + name);
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
    updateStepIndicator(5);
    var bc = $("builder-container"); if (bc) bc.classList.add("hidden");
    var c = $("step-container");
    var l1 = 0;
    if (gameState && gameState.playerPoints) l1 = gameState.playerPoints[level2State.playerId] || 0;
    var l2 = level2State.level2Score;
    var grand = l1 + l2;

    var html = '<div class="text-center">';
    html += '<div class="text-6xl mb-4">&#127942;</div>';
    html += '<h2 class="text-2xl font-bold text-gray-800 mb-2">Level 2 Complete!</h2>';
    html += '<p class="text-gray-500 mb-6">' + level2State.playerName + ', here is your score breakdown.</p>';

    html += '<div class="bg-gray-50 rounded-lg p-6 text-left max-w-sm mx-auto">';
    html += '<table class="w-full text-sm"><tbody>';
    html += '<tr class="border-b border-gray-200"><td class="py-2 text-gray-600">Level 1 Points</td><td class="py-2 text-right font-bold">' + l1 + '</td></tr>';
    html += '<tr class="border-b border-gray-200"><td class="py-2 text-gray-600">Step 2: Geometry</td><td class="py-2 text-right font-bold">' + level2State.geometryScore + ' / 2</td></tr>';
    html += '<tr class="border-b border-gray-200"><td class="py-2 text-gray-600">Step 3: Assembly</td><td class="py-2 text-right font-bold">' + level2State.buildScore + ' / 6</td></tr>';
    html += '<tr class="border-b border-gray-200"><td class="py-2 text-gray-600">Step 4: Naming</td><td class="py-2 text-right font-bold">' + level2State.namingScore + ' / 2</td></tr>';
    html += '<tr class="text-lg"><td class="pt-3 font-bold text-gray-800">Grand Total</td><td class="pt-3 text-right font-bold text-[#4187a0]">' + grand + '</td></tr>';
    html += '</tbody></table></div>';

    html += '<a href="/" class="inline-block mt-8 px-8 py-3 rounded-lg bg-[#4187a0] text-white font-semibold hover:bg-[#357a91] transition">Back to Menu</a>';
    html += '</div>';

    c.innerHTML = html;
    updateScoreBar();
  }

  // ── Boot ────────────────────────────────────────────────

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
