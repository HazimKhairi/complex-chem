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

  // ── Step 1: Choose Metal ────────────────────────────────

  function renderStep1() {
    var c = $("step-container");
    var html = '<h2 class="text-xl font-bold text-gray-800 mb-1">Step 1: Choose Your Central Metal Ion</h2>';
    html += '<p class="text-gray-500 text-sm mb-6">Select one metal ion to be the centre of your complex.</p>';
    html += '<div class="grid grid-cols-3 gap-4">';
    CENTRAL_METALS.forEach(function (m) {
      var sel = level2State.selectedMetal && level2State.selectedMetal.id === m.id;
      var border = sel ? 'border-[#4187a0] ring-2 ring-[#4187a0]/30' : 'border-gray-200 hover:border-[#4187a0]/50';
      html += '<button class="metal-card p-4 rounded-xl border-2 ' + border + ' text-center transition cursor-pointer" data-metal="' + m.id + '">';
      html += '<span class="text-2xl font-bold text-gray-800 block">' + m.name + '</span>';
      html += '<span class="text-xs text-gray-500">Charge: +' + m.charge + '</span></button>';
    });
    html += '</div>';
    html += navButtons({ back: false, next: true, nextDisabled: !level2State.selectedMetal });
    c.innerHTML = html;

    document.querySelectorAll(".metal-card").forEach(function (card) {
      card.addEventListener("click", function () {
        var mid = this.getAttribute("data-metal");
        level2State.selectedMetal = CENTRAL_METALS.find(function (m) { return m.id === mid; });
        renderStep1();
      });
    });
    bindNav({ onNext: function () { renderStep(2); } });
  }

  // ── Step 2: Pick Geometry (2 pts) ───────────────────────

  function calcCN() {
    var total = 0;
    playerLigands.forEach(function (lig) {
      var chem = LIGAND_CHEMISTRY[lig.id] || LIGAND_CHEMISTRY[(lig.id || '').toLowerCase()];
      if (chem) total += chem.denticity; else total += 1;
    });
    return total;
  }

  function renderStep2() {
    var c = $("step-container");
    var cn = calcCN();
    var correctList = GEOMETRY_MAP[cn] || [];

    var html = '<h2 class="text-xl font-bold text-gray-800 mb-1">Step 2: Choose the Geometry <span class="text-sm font-normal text-gray-400">(2 pts)</span></h2>';
    html += '<p class="text-gray-500 text-sm mb-2">Based on your ' + playerLigands.length + ' ligands (CN = ' + cn + '), pick the matching geometry.</p>';

    html += '<div class="bg-gray-50 rounded-lg p-3 mb-4 text-sm">';
    html += '<div class="flex flex-wrap gap-2">';
    playerLigands.forEach(function (lig) {
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

    inventoryLigands = playerLigands.map(function (lig, idx) {
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

  function handleBuildSubmit() {
    level2State.buildAttempts++;
    var placed = window.BoneBuilder.getPlacedLigands();
    var expectedSlots = window.BoneBuilder.getTotalSlots();
    var valid = (placed.length === expectedSlots);

    if (valid) {
      var pts = level2State.buildAttempts === 1 ? 6 : (level2State.buildAttempts === 2 ? 4 : 2);
      level2State.buildScore = pts;
      level2State.level2Score += pts;
      level2State.buildDone = true;
      updateScoreBar();

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
    var distractors = [];
    var metals = ["cobalt", "chromium", "iron", "copper", "nickel", "zinc"];
    var prefixes = ["di", "tri", "tetra", "hexa"];

    var wrongMetal = metals.find(function (m) { return correct.indexOf(m) === -1 && correct.indexOf(m + 'ate') === -1; }) || "manganese";
    distractors.push(correct.replace(/cobalt|chromium|iron|copper|nickel|zinc|cobaltate|chromate|ferrate|cuprate|nickelate|zincate/i, wrongMetal));

    distractors.push(correct.replace(/di|tri|tetra|penta|hexa/, function (m) {
      var idx = prefixes.indexOf(m);
      return prefixes[(idx + 1) % prefixes.length];
    }));

    distractors.push(correct.replace(/\(I+V?\)/, function (m) {
      return m === "(III)" ? "(II)" : "(III)";
    }));

    return distractors.filter(function (d) { return d !== correct; }).slice(0, 3);
  }

  function renderStep4() {
    var bc = $("builder-container");
    if (bc) bc.classList.add("hidden");

    var c = $("step-container");
    var correct = generateIUPACName();
    var distractors = generateDistractors(correct);

    var options = [correct].concat(distractors);
    for (var i = options.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = options[i]; options[i] = options[j]; options[j] = tmp;
    }

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
