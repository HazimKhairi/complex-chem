/* ============================================================
   Level 2 — Build Your Complex  (level-2-game.js)
   Complete wizard logic for Complex-Chem Quest
   ============================================================ */

(function () {
  "use strict";

  // ── Chemistry Data ──────────────────────────────────────────

  const LIGAND_CHEMISTRY = {
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

  const CENTRAL_METALS = [
    { name: "Co\u00B3\u207A", id: "co3", charge: 3 },
    { name: "Cr\u00B3\u207A", id: "cr3", charge: 3 },
    { name: "Fe\u00B3\u207A", id: "fe3", charge: 3 },
    { name: "Cu\u00B2\u207A", id: "cu2", charge: 2 },
    { name: "Ni\u00B2\u207A", id: "ni2", charge: 2 },
    { name: "Zn\u00B2\u207A", id: "zn2", charge: 2 },
  ];

  const GEOMETRY_MAP = {
    3: ["Trigonal planar"],
    4: ["Tetrahedral", "Square planar"],
    5: ["Trigonal bipyramidal", "Square pyramidal"],
    6: ["Octahedral"],
  };

  const ALL_GEOMETRIES = [
    "Trigonal planar",
    "Tetrahedral",
    "Square planar",
    "Trigonal bipyramidal",
    "Square pyramidal",
    "Octahedral",
  ];

  const SPHERE_COLORS = {
    red: "#EF4444",
    blue: "#3B82F6",
    orange: "#F97316",
    green: "#10B981",
  };

  // ── Game State ──────────────────────────────────────────────

  let gameState = null;
  let gameOption = "one-vs-one";
  let playerLigands = [];

  let level2State = {
    playerId: null,
    playerName: "",
    selectedMetal: null,
    selectedLigands: [],
    coordinationNumber: 0,
    totalCharge: 0,
    q1Answer: null,
    q1Correct: false,
    q2Answer: null,
    q2Correct: false,
    q3Answer: null,
    q3Correct: false,
    q4Attempts: 0,
    q4PickScore: 0,
    level2Score: 0,
  };

  let currentStep = 1;

  // ── Initialisation ──────────────────────────────────────────

  function init() {
    try {
      gameState = JSON.parse(sessionStorage.getItem("game-state"));
    } catch (e) {
      window.location.href = "/pass-and-play";
      return;
    }
    if (!gameState) { window.location.href = "/pass-and-play"; return; }

    gameOption = sessionStorage.getItem("game-option") || "one-vs-one";

    // Find first player with ligands
    var pl = gameState.playerLigands || {};
    for (var id in pl) {
      if (pl[id] && pl[id].length > 0) {
        level2State.playerId = id;
        playerLigands = pl[id];
        break;
      }
    }

    if (!level2State.playerId) {
      // fallback – use player 1
      level2State.playerId = "1";
      playerLigands = [];
    }

    // Resolve player name
    var pid = level2State.playerId;
    var nameKey = gameOption + "-player-" + pid + "-name";
    level2State.playerName = sessionStorage.getItem(nameKey) || ("Player " + pid);

    // Update header
    var info = document.getElementById("player-info");
    if (info) info.textContent = level2State.playerName + " — " + playerLigands.length + " ligand(s) collected";

    updateScoreBar();
    renderStep(1);
  }

  // ── Helpers ─────────────────────────────────────────────────

  function $(id) { return document.getElementById(id); }

  function updateStepIndicator(step) {
    var dots = document.querySelectorAll(".step-dot");
    var lines = document.querySelectorAll(".step-line");
    dots.forEach(function (dot, i) {
      var n = i + 1;
      dot.classList.remove("active", "done");
      if (n < step) dot.classList.add("done");
      else if (n === step) dot.classList.add("active");
    });
    lines.forEach(function (line, i) {
      line.classList.remove("done");
      if (i + 1 < step) line.classList.add("done");
    });
  }

  function updateScoreBar() {
    var l1 = 0;
    if (gameState && gameState.playerPoints) {
      l1 = gameState.playerPoints[level2State.playerId] || 0;
    }
    var l2 = level2State.level2Score;
    var el1 = $("l1-score"); if (el1) el1.textContent = l1;
    var el2 = $("l2-score"); if (el2) el2.textContent = l2;
    var et  = $("total-score"); if (et) et.textContent = l1 + l2;
  }

  function navButtons(opts) {
    var html = '<div class="flex justify-between mt-8">';
    if (opts.back) {
      html += '<button id="btn-back" class="px-6 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition font-semibold">Back</button>';
    } else {
      html += '<div></div>';
    }
    if (opts.next) {
      var disabled = opts.nextDisabled ? ' disabled' : '';
      var cls = opts.nextDisabled
        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
        : 'bg-[#4187a0] text-white hover:bg-[#357a91]';
      var label = opts.nextLabel || 'Next';
      html += '<button id="btn-next" class="px-6 py-2 rounded-lg font-semibold transition ' + cls + '"' + disabled + '>' + label + '</button>';
    }
    html += '</div>';
    return html;
  }

  function bindNav(opts) {
    var back = $("btn-back");
    var next = $("btn-next");
    if (back && opts.onBack) back.addEventListener("click", opts.onBack);
    if (next && opts.onNext) next.addEventListener("click", opts.onNext);
  }

  function enableNext() {
    var btn = $("btn-next");
    if (!btn) return;
    btn.disabled = false;
    btn.className = "px-6 py-2 rounded-lg font-semibold transition bg-[#4187a0] text-white hover:bg-[#357a91]";
  }

  function disableNext() {
    var btn = $("btn-next");
    if (!btn) return;
    btn.disabled = true;
    btn.className = "px-6 py-2 rounded-lg font-semibold transition bg-gray-300 text-gray-500 cursor-not-allowed";
  }

  function renderStep(step) {
    currentStep = step;
    updateStepIndicator(step);
    switch (step) {
      case 1: renderStep1(); break;
      case 2: renderStep2(); break;
      case 3: renderStep3(); break;
      case 4: renderStep4(); break;
      case 5: renderStep5(); break;
      case 6: renderStep6(); break;
      default: renderResults(); break;
    }
  }

  // ── Step 1: Choose Central Metal ────────────────────────────

  function renderStep1() {
    var container = $("step-container");
    var html = '<h2 class="text-xl font-bold text-gray-800 mb-1">Step 1: Choose Your Central Metal Ion</h2>';
    html += '<p class="text-gray-500 text-sm mb-6">Select one metal ion to be the centre of your complex.</p>';
    html += '<div class="grid grid-cols-3 gap-4">';
    CENTRAL_METALS.forEach(function (m) {
      var selected = level2State.selectedMetal && level2State.selectedMetal.id === m.id;
      var border = selected ? 'border-[#4187a0] ring-2 ring-[#4187a0]/30' : 'border-gray-200 hover:border-[#4187a0]/50';
      html += '<button class="metal-card p-4 rounded-xl border-2 ' + border + ' text-center transition cursor-pointer" data-metal="' + m.id + '">';
      html += '<span class="text-2xl font-bold text-gray-800 block">' + m.name + '</span>';
      html += '<span class="text-xs text-gray-500">Charge: +' + m.charge + '</span>';
      html += '</button>';
    });
    html += '</div>';
    html += navButtons({ back: false, next: true, nextDisabled: !level2State.selectedMetal });
    container.innerHTML = html;

    // Bind metal cards
    document.querySelectorAll(".metal-card").forEach(function (card) {
      card.addEventListener("click", function () {
        var mid = this.getAttribute("data-metal");
        level2State.selectedMetal = CENTRAL_METALS.find(function (m) { return m.id === mid; });
        renderStep1(); // re-render to show selection
      });
    });

    bindNav({ onNext: function () { renderStep(2); } });
  }

  // ── Step 2: Select Ligands ──────────────────────────────────

  function renderStep2() {
    var container = $("step-container");
    var html = '<h2 class="text-xl font-bold text-gray-800 mb-1">Step 2: Select Your Ligands</h2>';
    html += '<p class="text-gray-500 text-sm mb-2">Choose ligands from your collection. Coordination Number (CN) must be 3-6.</p>';

    // CN counter
    var cn = calcCN();
    var cnColor = cn > 6 ? 'text-red-500' : (cn >= 3 ? 'text-green-600' : 'text-gray-600');
    html += '<div class="mb-4 p-3 bg-gray-50 rounded-lg flex items-center justify-between">';
    html += '<span class="text-sm font-semibold text-gray-700">Coordination Number:</span>';
    html += '<span class="text-2xl font-bold ' + cnColor + '" id="cn-display">' + cn + '</span>';
    html += '</div>';

    if (cn > 6) {
      html += '<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">Invalid selection. The coordination number cannot exceed 6. Please try again.</div>';
    }

    // Ligand cards
    html += '<div class="grid grid-cols-2 sm:grid-cols-3 gap-3">';
    playerLigands.forEach(function (lig, idx) {
      var chem = LIGAND_CHEMISTRY[lig.id] || LIGAND_CHEMISTRY[lig.id.toLowerCase()] || null;
      var isSelected = level2State.selectedLigands.some(function (s) { return s._idx === idx; });
      var border = isSelected ? 'border-[#4187a0] ring-2 ring-[#4187a0]/30 bg-blue-50' : 'border-gray-200 hover:border-gray-400';
      var sphereColor = chem ? (SPHERE_COLORS[chem.sphere] || '#9CA3AF') : '#9CA3AF';
      var dentLabel = chem ? chem.type : 'Unknown';
      var dentVal = chem ? chem.denticity : 1;

      html += '<button class="lig-card p-3 rounded-xl border-2 ' + border + ' text-center transition cursor-pointer flex flex-col items-center gap-1" data-idx="' + idx + '">';
      html += '<div class="w-10 h-10 rounded-full flex items-center justify-center" style="background-color:' + sphereColor + '"></div>';
      html += '<span class="text-sm font-bold text-gray-800">' + lig.name + '</span>';
      html += '<span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">' + dentLabel + ' (' + dentVal + ')</span>';
      html += '</button>';
    });
    html += '</div>';

    var valid = cn >= 3 && cn <= 6;
    html += navButtons({ back: true, next: true, nextDisabled: !valid });
    container.innerHTML = html;

    // Bind ligand cards
    document.querySelectorAll(".lig-card").forEach(function (card) {
      card.addEventListener("click", function () {
        var idx = parseInt(this.getAttribute("data-idx"), 10);
        toggleLigand(idx);
      });
    });

    bindNav({
      onBack: function () { renderStep(1); },
      onNext: function () {
        var cn = calcCN();
        if (cn < 3 || cn > 6) return;
        level2State.coordinationNumber = cn;
        // Calc total charge
        var metalCharge = level2State.selectedMetal.charge;
        var ligCharge = 0;
        level2State.selectedLigands.forEach(function (s) {
          var chem = LIGAND_CHEMISTRY[s.id] || LIGAND_CHEMISTRY[s.id.toLowerCase()];
          if (chem) ligCharge += chem.charge;
        });
        level2State.totalCharge = metalCharge + ligCharge;
        renderStep(3);
      },
    });
  }

  function calcCN() {
    var total = 0;
    level2State.selectedLigands.forEach(function (s) {
      var chem = LIGAND_CHEMISTRY[s.id] || LIGAND_CHEMISTRY[s.id.toLowerCase()];
      if (chem) total += chem.denticity;
      else total += 1;
    });
    return total;
  }

  function toggleLigand(idx) {
    var exists = level2State.selectedLigands.findIndex(function (s) { return s._idx === idx; });
    if (exists >= 0) {
      level2State.selectedLigands.splice(exists, 1);
    } else {
      var lig = playerLigands[idx];
      level2State.selectedLigands.push({ id: lig.id, name: lig.name, _idx: idx });
    }
    renderStep2();
  }

  // ── Step 3: Q1 — Predict Type of Complex (2 pts) ───────────

  function renderStep3() {
    var container = $("step-container");
    var html = '<h2 class="text-xl font-bold text-gray-800 mb-1">Question 1: Predict the Type of Complex <span class="text-sm font-normal text-gray-400">(2 pts)</span></h2>';
    html += '<p class="text-gray-500 text-sm mb-4">Based on the charges, determine if this complex is neutral, anionic, or cationic.</p>';

    // Charge table
    html += '<div class="bg-gray-50 rounded-lg p-4 mb-6 text-sm">';
    html += '<table class="w-full">';
    html += '<thead><tr class="text-left text-gray-500 border-b"><th class="pb-2">Species</th><th class="pb-2 text-right">Charge</th></tr></thead>';
    html += '<tbody>';
    html += '<tr class="border-b border-gray-100"><td class="py-1.5 font-semibold">' + level2State.selectedMetal.name + ' (metal)</td><td class="py-1.5 text-right font-bold">+' + level2State.selectedMetal.charge + '</td></tr>';
    level2State.selectedLigands.forEach(function (s) {
      var chem = LIGAND_CHEMISTRY[s.id] || LIGAND_CHEMISTRY[s.id.toLowerCase()];
      var ch = chem ? chem.charge : 0;
      var display = ch === 0 ? '0' : (ch > 0 ? '+' + ch : String(ch));
      html += '<tr class="border-b border-gray-100"><td class="py-1.5">' + s.name + ' (ligand)</td><td class="py-1.5 text-right">' + display + '</td></tr>';
    });
    html += '<tr class="font-bold"><td class="pt-2">Total Charge</td><td class="pt-2 text-right">' + (level2State.totalCharge > 0 ? '+' : '') + level2State.totalCharge + '</td></tr>';
    html += '</tbody></table></div>';

    // Answer buttons
    var answered = level2State.q1Answer !== null;
    var correct = level2State.totalCharge === 0 ? "Neutral" : (level2State.totalCharge < 0 ? "Anionic" : "Cationic");
    var options = ["Neutral", "Anionic", "Cationic"];

    html += '<div class="flex gap-3 justify-center flex-wrap" id="q1-options">';
    options.forEach(function (opt) {
      var cls = 'px-6 py-3 rounded-lg font-semibold text-sm border-2 transition ';
      if (answered) {
        if (opt === correct) cls += 'border-green-500 bg-green-50 text-green-700 ';
        else if (opt === level2State.q1Answer && opt !== correct) cls += 'border-red-500 bg-red-50 text-red-700 ';
        else cls += 'border-gray-200 text-gray-400 ';
        cls += 'cursor-default ';
      } else {
        cls += 'border-gray-200 hover:border-[#4187a0] cursor-pointer ';
      }
      html += '<button class="q1-btn ' + cls + '" data-val="' + opt + '"' + (answered ? ' disabled' : '') + '>' + opt + '</button>';
    });
    html += '</div>';

    // Feedback
    if (answered) {
      if (level2State.q1Correct) {
        html += '<div class="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm text-center font-semibold">Correct! +2 points</div>';
      } else {
        html += '<div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">Incorrect. The answer is <strong>' + correct + '</strong> (total charge = ' + level2State.totalCharge + ').</div>';
      }
    }

    html += navButtons({ back: true, next: true, nextDisabled: !answered });
    container.innerHTML = html;

    // Bind
    if (!answered) {
      document.querySelectorAll(".q1-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var val = this.getAttribute("data-val");
          level2State.q1Answer = val;
          level2State.q1Correct = (val === correct);
          if (level2State.q1Correct) level2State.level2Score += 2;
          updateScoreBar();
          renderStep3();
        });
      });
    }

    bindNav({
      onBack: function () { renderStep(2); },
      onNext: function () { renderStep(4); },
    });
  }

  // ── Step 4: Q2 — Predict Coordination Number (1 pt) ────────

  function renderStep4() {
    var container = $("step-container");
    var html = '<h2 class="text-xl font-bold text-gray-800 mb-1">Question 2: Predict the Coordination Number <span class="text-sm font-normal text-gray-400">(1 pt)</span></h2>';
    html += '<p class="text-gray-500 text-sm mb-4">Based on the ligands and their denticity, what is the CN?</p>';

    // Denticity table
    html += '<div class="bg-gray-50 rounded-lg p-4 mb-6 text-sm">';
    html += '<table class="w-full">';
    html += '<thead><tr class="text-left text-gray-500 border-b"><th class="pb-2">Ligand</th><th class="pb-2 text-center">Type</th><th class="pb-2 text-right">Denticity</th></tr></thead>';
    html += '<tbody>';
    var totalDent = 0;
    level2State.selectedLigands.forEach(function (s) {
      var chem = LIGAND_CHEMISTRY[s.id] || LIGAND_CHEMISTRY[s.id.toLowerCase()];
      var d = chem ? chem.denticity : 1;
      var t = chem ? chem.type : "Unknown";
      totalDent += d;
      html += '<tr class="border-b border-gray-100"><td class="py-1.5">' + s.name + '</td><td class="py-1.5 text-center text-gray-500">' + t + '</td><td class="py-1.5 text-right font-bold">' + d + '</td></tr>';
    });
    html += '<tr class="font-bold"><td class="pt-2">Total</td><td></td><td class="pt-2 text-right">' + totalDent + '</td></tr>';
    html += '</tbody></table></div>';

    var answered = level2State.q2Answer !== null;
    var correctCN = level2State.coordinationNumber;
    var options = [3, 4, 5, 6];

    html += '<div class="flex gap-3 justify-center" id="q2-options">';
    options.forEach(function (opt) {
      var cls = 'w-16 h-16 rounded-lg font-bold text-lg border-2 transition ';
      if (answered) {
        if (opt === correctCN) cls += 'border-green-500 bg-green-50 text-green-700 ';
        else if (opt === level2State.q2Answer && opt !== correctCN) cls += 'border-red-500 bg-red-50 text-red-700 ';
        else cls += 'border-gray-200 text-gray-400 ';
        cls += 'cursor-default ';
      } else {
        cls += 'border-gray-200 hover:border-[#4187a0] cursor-pointer ';
      }
      html += '<button class="q2-btn ' + cls + '" data-val="' + opt + '"' + (answered ? ' disabled' : '') + '>' + opt + '</button>';
    });
    html += '</div>';

    if (answered) {
      if (level2State.q2Correct) {
        html += '<div class="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm text-center font-semibold">Correct! +1 point</div>';
      } else {
        html += '<div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">Incorrect. The CN is <strong>' + correctCN + '</strong>.</div>';
      }
    }

    html += navButtons({ back: true, next: true, nextDisabled: !answered });
    container.innerHTML = html;

    if (!answered) {
      document.querySelectorAll(".q2-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var val = parseInt(this.getAttribute("data-val"), 10);
          level2State.q2Answer = val;
          level2State.q2Correct = (val === correctCN);
          if (level2State.q2Correct) level2State.level2Score += 1;
          updateScoreBar();
          renderStep4();
        });
      });
    }

    bindNav({
      onBack: function () { renderStep(3); },
      onNext: function () { renderStep(5); },
    });
  }

  // ── Step 5: Q3 — State Possible Geometry (1 pt) ────────────

  function renderStep5() {
    var container = $("step-container");
    var cn = level2State.coordinationNumber;
    var html = '<h2 class="text-xl font-bold text-gray-800 mb-1">Question 3: State the Possible Geometry <span class="text-sm font-normal text-gray-400">(1 pt)</span></h2>';
    html += '<p class="text-gray-500 text-sm mb-4">Based on CN = <strong>' + cn + '</strong>, select the possible geometry.</p>';

    var answered = level2State.q3Answer !== null;
    var correctList = GEOMETRY_MAP[cn] || [];

    html += '<div class="grid grid-cols-2 sm:grid-cols-3 gap-3" id="q3-options">';
    ALL_GEOMETRIES.forEach(function (geo) {
      var isCorrect = correctList.indexOf(geo) >= 0;
      var cls = 'p-3 rounded-lg font-semibold text-sm border-2 transition text-center ';
      if (answered) {
        if (isCorrect) cls += 'border-green-500 bg-green-50 text-green-700 ';
        else if (geo === level2State.q3Answer && !isCorrect) cls += 'border-red-500 bg-red-50 text-red-700 ';
        else cls += 'border-gray-200 text-gray-400 ';
        cls += 'cursor-default ';
      } else {
        cls += 'border-gray-200 hover:border-[#4187a0] cursor-pointer ';
      }
      html += '<button class="q3-btn ' + cls + '" data-val="' + geo + '"' + (answered ? ' disabled' : '') + '>' + geo + '</button>';
    });
    html += '</div>';

    if (answered) {
      if (level2State.q3Correct) {
        html += '<div class="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm text-center font-semibold">Correct! +1 point</div>';
      } else {
        html += '<div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">Incorrect. Possible geometries for CN ' + cn + ': <strong>' + correctList.join(", ") + '</strong>.</div>';
      }
    }

    html += navButtons({ back: true, next: true, nextDisabled: !answered });
    container.innerHTML = html;

    if (!answered) {
      document.querySelectorAll(".q3-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var val = this.getAttribute("data-val");
          level2State.q3Answer = val;
          level2State.q3Correct = correctList.indexOf(val) >= 0;
          if (level2State.q3Correct) level2State.level2Score += 1;
          updateScoreBar();
          renderStep5();
        });
      });
    }

    bindNav({
      onBack: function () { renderStep(4); },
      onNext: function () { renderStep(6); },
    });
  }

  // ── Step 6: Q4 — Form Complex Structure (up to 6 pts) ──────

  var q4DisabledPicks = [];
  var q4Finished = false;

  function renderStep6() {
    var container = $("step-container");
    var cn = level2State.coordinationNumber;
    var correctList = GEOMETRY_MAP[cn] || [];

    var html = '<h2 class="text-xl font-bold text-gray-800 mb-1">Question 4: Form the Complex Structure <span class="text-sm font-normal text-gray-400">(up to 6 pts)</span></h2>';
    html += '<p class="text-gray-500 text-sm mb-2">Pick the correct geometry for your complex. You have 3 attempts.</p>';
    html += '<p class="text-sm text-gray-600 mb-4">Attempts used: <strong>' + level2State.q4Attempts + ' / 3</strong></p>';

    // Geometry images: CN 3-4 → 1.png, CN 5-6 → 2.png
    var imgFile = (cn <= 4) ? "1.png" : "2.png";

    html += '<div class="flex justify-center mb-6"><img src="/images/geometry/' + imgFile + '" alt="Geometry reference" class="max-h-48 rounded-lg shadow-sm" /></div>';

    html += '<div class="grid grid-cols-2 sm:grid-cols-3 gap-3" id="q4-options">';
    ALL_GEOMETRIES.forEach(function (geo) {
      var isCorrect = correctList.indexOf(geo) >= 0;
      var isDisabled = q4DisabledPicks.indexOf(geo) >= 0;
      var cls = 'p-4 rounded-lg font-semibold text-sm border-2 transition text-center ';

      if (q4Finished && isCorrect) {
        cls += 'border-green-500 bg-green-50 text-green-700 cursor-default ';
      } else if (isDisabled) {
        cls += 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed ';
      } else if (q4Finished) {
        cls += 'border-gray-200 text-gray-400 cursor-default ';
      } else {
        cls += 'border-gray-200 hover:border-[#4187a0] cursor-pointer ';
      }
      html += '<button class="q4-btn ' + cls + '" data-val="' + geo + '"' + ((isDisabled || q4Finished) ? ' disabled' : '') + '>' + geo + '</button>';
    });
    html += '</div>';

    // Feedback
    if (q4Finished) {
      var pts = level2State.q4PickScore;
      if (pts > 0) {
        html += '<div class="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm text-center font-semibold">Correct! +' + pts + ' point' + (pts > 1 ? 's' : '') + '</div>';
      } else {
        html += '<div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">No attempts remaining. The correct answer: <strong>' + correctList.join(", ") + '</strong>.</div>';
      }
      html += navButtons({ back: true, next: true, nextLabel: "See Results" });
    } else {
      html += navButtons({ back: true, next: false });
    }

    container.innerHTML = html;

    if (!q4Finished) {
      document.querySelectorAll(".q4-btn").forEach(function (btn) {
        if (btn.disabled) return;
        btn.addEventListener("click", function () {
          var val = this.getAttribute("data-val");
          var isCorrect = correctList.indexOf(val) >= 0;
          level2State.q4Attempts++;

          if (isCorrect) {
            // Score: attempt 1 = 3, 2 = 2, 3 = 1
            var pts = 4 - level2State.q4Attempts; // 3, 2, 1
            level2State.q4PickScore = pts;
            level2State.level2Score += pts;
            q4Finished = true;
          } else {
            q4DisabledPicks.push(val);
            if (level2State.q4Attempts >= 3) {
              level2State.q4PickScore = 0;
              q4Finished = true;
            }
          }
          updateScoreBar();
          renderStep6();
        });
      });
    }

    bindNav({
      onBack: function () { renderStep(5); },
      onNext: function () { renderResults(); },
    });
  }

  // ── Results Screen ──────────────────────────────────────────

  function renderResults() {
    updateStepIndicator(7); // all done
    var container = $("step-container");
    var l1 = 0;
    if (gameState && gameState.playerPoints) {
      l1 = gameState.playerPoints[level2State.playerId] || 0;
    }
    var l2 = level2State.level2Score;
    var grand = l1 + l2;

    var html = '<div class="text-center">';
    html += '<div class="text-6xl mb-4">&#127942;</div>';
    html += '<h2 class="text-2xl font-bold text-gray-800 mb-2">Level 2 Complete!</h2>';
    html += '<p class="text-gray-500 mb-6">' + level2State.playerName + ', here is your score breakdown.</p>';

    html += '<div class="bg-gray-50 rounded-lg p-6 text-left max-w-sm mx-auto">';
    html += '<table class="w-full text-sm">';
    html += '<tbody>';
    html += '<tr class="border-b border-gray-200"><td class="py-2 text-gray-600">Level 1 Points</td><td class="py-2 text-right font-bold">' + l1 + '</td></tr>';
    html += '<tr class="border-b border-gray-200"><td class="py-2 text-gray-600">Q1: Type of Complex</td><td class="py-2 text-right font-bold">' + (level2State.q1Correct ? 2 : 0) + ' / 2</td></tr>';
    html += '<tr class="border-b border-gray-200"><td class="py-2 text-gray-600">Q2: Coordination Number</td><td class="py-2 text-right font-bold">' + (level2State.q2Correct ? 1 : 0) + ' / 1</td></tr>';
    html += '<tr class="border-b border-gray-200"><td class="py-2 text-gray-600">Q3: Geometry</td><td class="py-2 text-right font-bold">' + (level2State.q3Correct ? 1 : 0) + ' / 1</td></tr>';
    html += '<tr class="border-b border-gray-200"><td class="py-2 text-gray-600">Q4: Complex Structure</td><td class="py-2 text-right font-bold">' + level2State.q4PickScore + ' / 6</td></tr>';
    html += '<tr class="text-lg"><td class="pt-3 font-bold text-gray-800">Grand Total</td><td class="pt-3 text-right font-bold text-[#4187a0]">' + grand + '</td></tr>';
    html += '</tbody></table></div>';

    html += '<a href="/" class="inline-block mt-8 px-8 py-3 rounded-lg bg-[#4187a0] text-white font-semibold hover:bg-[#357a91] transition">Back to Menu</a>';
    html += '</div>';

    container.innerHTML = html;
    updateScoreBar();
  }

  // ── Boot ────────────────────────────────────────────────────

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
