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

  // Minimum coordination number permitted by the chemistry spec.
  // GEOMETRY_MAP only covers CN 3..6 — anything below 3 has no valid
  // geometry, so a player whose inventory can't reach 3 cannot build
  // any complex and is eliminated from Level 2 at entry.
  var MIN_CN = 3;

  /**
   * Max coordination number a player could possibly reach from their
   * inventory. Sum of denticity × count across every ligand they hold.
   * Returns 0 for an empty / null inventory.
   */
  function computeMaxCN(ligands) {
    if (!Array.isArray(ligands) || ligands.length === 0) return 0;
    var total = 0;
    for (var i = 0; i < ligands.length; i++) {
      var lig = ligands[i] || {};
      var key = String(lig.id || "").toLowerCase();
      var chem = LIGAND_CHEMISTRY[key];
      var d = chem && Number(chem.denticity) > 0 ? Number(chem.denticity) : 1;
      total += d;
    }
    return total;
  }

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

  // Set true by renderStep() on real step navigation. The per-step GSAP
  // entrance timeline checks + clears it so in-step interaction
  // re-renders (chip taps) don't replay the whole-stage entrance — that
  // replay was what made every tap look like a page refresh
  // (Hazim 2026-06-17: "lepas tekan tap dia macam refresh page").
  var _pendingEntrance = false;

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
        msg = "Bidentate ligand needs 2 empty slots side by side. Remove a ligand to make room, then place it again.";
      } else if (reason === "slots-full") {
        msg = "All slots are full. Click a placed ligand to remove it if you want to swap.";
      }
      showLevel2Toast(msg, "error");
      if (window.AudioManager) window.AudioManager.play("wrong");
      // Client 2026-06-18: "dah letak tapi still follow cursor" — a
      // rejected placement used to leave the ligand armed, so the ghost
      // kept chasing the pointer with no way to drop it. Disarm so the
      // player can free a slot and re-pick cleanly.
      setArmedLigand(null);
      if (window.BoneBuilder) window.BoneBuilder.clearDraggedLigand();
    });

    gameOption = sessionStorage.getItem("game-option") || "one-vs-one";

    // Pick the next active player who STILL needs to play Level 2.
    // Hazim 2026-05-11 bug: after P1 finished and the page reloaded
    // for the pass-device handoff, init was re-selecting P1 (the
    // first player with ligands) — so P2 could never start. Skip
    // anyone already in level2-finals.
    var alreadyFinished = {};
    try {
      var finalsRaw = sessionStorage.getItem("level2-finals");
      if (finalsRaw) {
        var finals = JSON.parse(finalsRaw) || {};
        Object.keys(finals).forEach(function (k) { alreadyFinished[String(k)] = true; });
      }
    } catch (e) {}

    var pl = gameState.playerLigands || {};
    // Walk the active-player list in order so P1→P2→P3→P4 progression
    // is deterministic. Skip players who already submitted a Level 2
    // result (they appear in level2-finals).
    var activeList;
    try {
      if (window.TurnManager && typeof window.TurnManager.getActivePlayers === "function") {
        activeList = window.TurnManager.getActivePlayers();
      }
    } catch (e) {}
    if (!Array.isArray(activeList) || activeList.length === 0) {
      var opt = sessionStorage.getItem("game-option");
      activeList = (opt === "solo") ? [1]
        : (opt === "one-vs-one")   ? [1, 2]
        : (opt === "one-vs-two")   ? [1, 2, 3]
        : (opt === "one-vs-three") ? [1, 2, 3, 4]
        : Object.keys(pl).map(Number);
    }

    for (var ai = 0; ai < activeList.length; ai++) {
      var pid = String(activeList[ai]);
      if (alreadyFinished[pid]) continue;
      if (pl[pid] && pl[pid].length > 0) {
        level2State.playerId = pid;
        playerLigands = pl[pid];
        break;
      }
    }
    // Fall back to the legacy "first with ligands" search if nothing
    // matched (e.g. simulation mode that doesn't populate TurnManager).
    if (!level2State.playerId) {
      for (var fid in pl) {
        if (alreadyFinished[fid]) continue;
        if (pl[fid] && pl[fid].length > 0) {
          level2State.playerId = fid;
          playerLigands = pl[fid];
          break;
        }
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

    // Eligibility gate. Players whose inventory can't reach the minimum
    // coordination number (MIN_CN = 3) cannot build any complex \u2014 they
    // are eliminated from Level 2 with their Level 1 points only.
    // Covers both 0-ligand and "max-CN < 3" cases (e.g. 1\u00d7 monodentate).
    var maxCN = computeMaxCN(playerLigands);
    if (maxCN < MIN_CN) {
      _handleIneligibleAndAdvance(maxCN);
      return;
    }

    var resumed = restoreLevel2State();
    updateScoreBar();
    renderStep(resumed ? (currentStep || 1) : 1);
    if (resumed) showResumeToast();
  }

  /**
   * Player can't reach CN >= 3 from their inventory. Record their
   * Level 1 score as final, render an explanation panel, then route
   * to the next eligible player (or the podium if none remain).
   */
  function _handleIneligibleAndAdvance(maxCN) {
    var l1 = 0;
    if (gameState && gameState.playerPoints) {
      l1 = Number(gameState.playerPoints[level2State.playerId]) || 0;
    }
    level2State.level2Score = 0;
    persistLevel2Finish(level2State.playerId, level2State.playerName, l1);
    updateScoreBar();
    // Suppress the learning-outcomes intro modal — an eliminated player
    // never reaches the wizard, so the intro adds noise behind our
    // elimination modal.
    var intro = document.getElementById("level2-intro-modal");
    if (intro) { intro.classList.add("hidden"); intro.classList.remove("flex"); }
    _renderIneligiblePanel(maxCN, l1);
    _showIneligibleModal(level2State.playerName, playerLigands.length, maxCN);
  }

  /**
   * In-page panel that stays visible behind the modal \u2014 same slot as
   * the wizard so the score bar + indicators stay consistent.
   */
  function _renderIneligiblePanel(maxCN, l1Points) {
    var c = $("step-container"); if (!c) return;
    var bc = $("builder-container"); if (bc) bc.classList.add("hidden");
    var name = String(level2State.playerName || "").replace(/[<>&]/g, "");
    var html = '<div class="text-center py-10 px-6 max-w-lg mx-auto">'
      + '<svg class="w-14 h-14 mx-auto mb-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4"/><path d="M12 17h.01"/><circle cx="12" cy="12" r="10"/></svg>'
      + '<h2 class="text-2xl font-bold text-gray-800 mb-2">' + name + ' &mdash; Eliminated from Level 2</h2>'
      + '<p class="text-gray-600 mb-4">Inventory can only reach <strong>CN = ' + maxCN + '</strong>. The minimum required to build any complex is <strong>CN = ' + MIN_CN + '</strong>.</p>'
      + '<div class="bg-gray-50 rounded-lg p-4 text-left max-w-xs mx-auto mb-6">'
      +   '<div class="flex items-center justify-between text-sm py-1"><span class="text-gray-600">Level 1 Points</span><span class="font-bold">' + l1Points + '</span></div>'
      +   '<div class="flex items-center justify-between text-sm py-1"><span class="text-gray-600">Level 2 Points</span><span class="font-bold">0</span></div>'
      +   '<div class="flex items-center justify-between text-base py-2 border-t border-gray-200 mt-1"><span class="font-bold text-gray-800">Final Total</span><span class="font-bold text-[#4187a0]">' + l1Points + '</span></div>'
      + '</div>'
      + '</div>';
    c.innerHTML = html;
  }

  /**
   * Modal explaining the elimination + Continue button that advances
   * to the next eligible player or the podium. Mirrors the look of
   * `_showPassDeviceModal` so the wizard's visual language stays
   * consistent.
   */
  function _showIneligibleModal(playerName, ligandCount, maxCN) {
    if (document.getElementById("l2-ineligible-modal")) return;
    var safe = String(playerName || "").replace(/[<>&]/g, "");
    var overlay = document.createElement("div");
    overlay.id = "l2-ineligible-modal";
    overlay.style.cssText = "position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;background:rgba(15,23,42,0.55);backdrop-filter:blur(4px);padding:24px;";
    overlay.innerHTML =
      '<div style="background:#fff;border-radius:24px;padding:32px;max-width:460px;width:100%;text-align:center;box-shadow:0 24px 60px rgba(0,0,0,0.35);border:4px solid #f59e0b;font-family:Fredoka,system-ui,sans-serif;">' +
        '<svg style="width:56px;height:56px;margin:0 auto 8px;color:#f59e0b;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4"/><path d="M12 17h.01"/><circle cx="12" cy="12" r="10"/></svg>' +
        '<h2 style="font-size:1.5rem;font-weight:800;color:#0f172a;margin-bottom:6px;">Not enough ligands</h2>' +
        '<p style="color:#475569;font-size:0.95rem;margin-bottom:14px;"><strong style="color:#0f172a;">' + safe + '</strong> collected only ' + ligandCount + ' ligand' + (ligandCount === 1 ? '' : 's') + ' in Level 1 (max CN = ' + maxCN + ').</p>' +
        '<p style="color:#475569;font-size:0.9rem;margin-bottom:8px;">A valid complex needs at least <strong>CN = ' + MIN_CN + '</strong>. ' + safe + ' is eliminated from Level 2 with their Level 1 score only.</p>' +
        '<p style="color:#64748b;font-size:0.8rem;margin-bottom:22px;">Next: pass the device to the next player, or view the final podium if everyone is done.</p>' +
        '<button id="l2-ineligible-ok" style="background:#4187a0;color:#fff;font-weight:700;font-size:1rem;padding:12px 32px;border-radius:14px;border:none;cursor:pointer;box-shadow:0 4px 0 #357a91;">Continue</button>' +
      '</div>';
    document.body.appendChild(overlay);
    var btn = document.getElementById("l2-ineligible-ok");
    if (btn) {
      btn.addEventListener("click", function () {
        overlay.remove();
        openFinalPodiumOrNext();
      });
    }
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
   * Confetti rain — spawns 60 colored pieces falling from above the
   * viewport. Auto-removes after the longest animation finishes.
   * Hazim 2026-05-11 spec: every correct answer should feel meriah
   * with confetti + cheer, like a Kahoot podium.
   */
  function triggerConfettiRain() {
    var palette = ["#fde047", "#f97316", "#22c55e", "#3b82f6", "#ec4899", "#a855f7", "#06b6d4", "#ef4444"];
    var container = document.createElement("div");
    container.className = "l2-confetti-rain";
    container.setAttribute("aria-hidden", "true");
    var pieces = 60;
    var maxDur = 0;
    for (var i = 0; i < pieces; i++) {
      var piece = document.createElement("div");
      piece.className = "l2-confetti-piece";
      var color = palette[i % palette.length];
      var left = Math.random() * 100;            // 0..100 % across viewport
      var dur = 2.4 + Math.random() * 2.0;       // 2.4–4.4 s
      var delay = Math.random() * 1.0;           // 0–1 s stagger
      var sway = 0.7 + Math.random() * 1.0;      // 0.7–1.7 s sway period
      var w = 7 + Math.floor(Math.random() * 8); // 7–14 px wide
      var h = 10 + Math.floor(Math.random() * 10); // 10–19 px tall
      // Mix in a few circles for texture variety.
      var radius = (i % 5 === 0) ? "50%" : "2px";
      piece.style.cssText =
        "left:" + left + "%;" +
        "background:" + color + ";" +
        "width:" + w + "px;" +
        "height:" + h + "px;" +
        "border-radius:" + radius + ";" +
        "animation-duration:" + dur + "s, " + sway + "s;" +
        "animation-delay:" + delay + "s, 0s;";
      container.appendChild(piece);
      if (dur + delay > maxDur) maxDur = dur + delay;
    }
    document.body.appendChild(container);
    setTimeout(function () {
      if (container.parentNode) container.parentNode.removeChild(container);
    }, (maxDur + 0.4) * 1000);
  }

  /**
   * Bouncy toast — shown after a correct answer before the next step
   * renders. When points > 0 shows "+N pts"; when points === 0 shows a
   * "Correct!" celebration toast (Hazim spec: every correct answer gets
   * the same gold-spark feedback, even if 0 points were awarded).
   * Pass `points = -1` to suppress entirely (e.g., wrong answer flow).
   */
  function showPointsToast(points, label) {
    if (window.AudioManager) {
      window.AudioManager.play("correct");
      // Layer the synthesised crowd cheer on top of the per-question
      // "correct" chime so the celebration feels meriah (Hazim spec).
      window.AudioManager.play("cheer");
    }
    if (points === -1) return;
    // Confetti rain falls during the toast lifetime (3.4 s).
    triggerConfettiRain();
    var el = document.createElement("div");
    el.className = "l2-points-toast";
    var starSvg = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">'
      + '<path d="M12 1l2.6 7.2L22 10l-6 4.6L17.6 22 12 18l-5.6 4 1.6-7.4L2 10l7.4-1.8z"/>'
      + '</svg>';
    var pointsHtml = points > 0
      ? '<span class="l2-points-toast-num">+' + points + ' pts</span>'
      : '<span class="l2-points-toast-num l2-points-toast-num--small">Correct!</span>';
    el.innerHTML = ''
      + '<div class="l2-points-toast-inner">'
      +   '<span class="l2-toast-spark l2-toast-spark--tl">' + starSvg + '</span>'
      +   '<span class="l2-toast-spark l2-toast-spark--t">'  + starSvg + '</span>'
      +   '<span class="l2-toast-spark l2-toast-spark--tr">' + starSvg + '</span>'
      +   '<span class="l2-toast-spark l2-toast-spark--bl">' + starSvg + '</span>'
      +   '<span class="l2-toast-spark l2-toast-spark--br">' + starSvg + '</span>'
      +   '<span class="l2-toast-spark l2-toast-spark--l">'  + starSvg + '</span>'
      +   '<span class="l2-toast-spark l2-toast-spark--r">'  + starSvg + '</span>'
      +   '<span class="l2-points-toast-label">' + (label || "You earned") + '</span>'
      +   pointsHtml
      + '</div>';
    document.body.appendChild(el);
    // Lifetime extended 2.1 s → 3.4 s (Hazim 2026-05-10: he reported
    // "tkde markh popup" — the audit confirmed the toast WAS firing,
    // but the previous 2.1 s window was too brief for a classroom
    // audience to register at projection distance). 3.4 s gives the
    // teacher's eye time to find it after the answer click.
    setTimeout(function () { el.classList.add("l2-points-toast-fade"); }, 2700);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 3400);
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
    var imgFile = chem.image || '1.png';
    var frontPath = '/assets/ligand-cards/front/' + imgFile;
    var backPath  = '/assets/ligand-cards/back/'  + imgFile;
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
      +   '<div id="ligand-card-flip" class="relative w-full" style="aspect-ratio:7/10; transform-style:preserve-3d; transition:transform 600ms cubic-bezier(.2,.7,.2,1); cursor:pointer;">'
      +     '<div class="absolute inset-0 rounded-2xl border-4 overflow-hidden bg-white shadow-2xl" style="border-color:' + color + '; backface-visibility:hidden;">'
      +       '<div class="w-full h-full bg-no-repeat bg-contain bg-center" style="background-image:url(\'' + frontPath + '\');"></div>'
      +       '<div class="absolute bottom-2 right-2 px-3 py-1 bg-black/70 text-white text-xs rounded-full font-semibold pointer-events-none">Click to flip</div>'
      +     '</div>'
      +     '<div class="absolute inset-0 rounded-2xl border-4 overflow-hidden bg-white shadow-2xl" style="border-color:' + color + '; backface-visibility:hidden; transform:rotateY(180deg);">'
      +       '<div class="w-full h-full bg-no-repeat bg-contain bg-center" style="background-image:url(\'' + backPath + '\');"></div>'
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

  // PAKAR 1 round 3 — combo system. Every tile drop bumps the combo,
  // floats a "+N COMBO xK" sparkle from the chip, and increments a
  // persistent badge in the heading banner. Combo never validates
  // correctness (that would leak answers) — it rewards the act of
  // dropping a tile so Level 2 reads as a game, not a quiz. Combo
  // breaks if the player navigates between steps.
  function bumpComboAndFloat(originEl) {
    // Note: the pick sound plays at the end of this fn (see the
    // AudioManager.play below) — Hazim 2026-06-17 "tekan nombor keluar
    // bunyi pun dah okay".
    level2State._comboCount = (level2State._comboCount || 0) + 1;
    var c = level2State._comboCount;
    var points = c * 25;
    var hud = document.getElementById("l2-combo-hud");
    if (hud) {
      var countEl = hud.querySelector(".l2-combo-count");
      var mult    = hud.querySelector(".l2-combo-mult");
      if (countEl) countEl.textContent = c;
      if (mult)    mult.textContent = "x" + c;
      // GSAP elastic pop — feels chunkier than the CSS keyframe pop.
      if (window.gsap) {
        gsap.fromTo(hud,
          { scale: 1, rotate: 0 },
          { scale: 1.22, rotate: -3, duration: 0.18, ease: "back.out(3)",
            yoyo: true, repeat: 1, transformOrigin: "50% 50%" });
      } else {
        hud.classList.remove("l2-combo-pop");
        void hud.offsetWidth;
        hud.classList.add("l2-combo-pop");
      }
    }
    if (originEl && originEl.getBoundingClientRect) {
      var rect = originEl.getBoundingClientRect();
      var floatEl = document.createElement("div");
      floatEl.className = "l2-combo-float";
      floatEl.innerHTML = '<span class="l2-combo-float-pts">+' + points + '</span>' +
                          '<span class="l2-combo-float-mult">COMBO x' + c + '</span>';
      floatEl.style.left = (rect.left + rect.width / 2) + "px";
      floatEl.style.top  = (rect.top - 6) + "px";
      document.body.appendChild(floatEl);
      if (window.gsap) {
        // Disable CSS animation so GSAP owns the motion.
        floatEl.style.animation = "none";
        var tl = gsap.timeline({ onComplete: function () {
          if (floatEl.parentNode) floatEl.parentNode.removeChild(floatEl);
        }});
        tl.fromTo(floatEl,
            { y: -10, scale: 0.55, opacity: 0 },
            { y: -55, scale: 1.18, opacity: 1, duration: 0.32, ease: "back.out(2.6)" })
          .to(floatEl,
            { y: -150, scale: 0.95, opacity: 0, duration: 0.7, ease: "power2.in" });
      } else {
        setTimeout(function () { if (floatEl.parentNode) floatEl.parentNode.removeChild(floatEl); }, 1100);
      }
    }
    try {
      if (window.AudioManager) window.AudioManager.play(c >= 3 ? "complex-built" : "ligand");
    } catch (e) {}
  }
  function breakCombo() {
    level2State._comboCount = 0;
    var hud = document.getElementById("l2-combo-hud");
    if (hud) {
      var countEl = hud.querySelector(".l2-combo-count");
      var mult    = hud.querySelector(".l2-combo-mult");
      if (countEl) countEl.textContent = 0;
      if (mult)    mult.textContent = "x0";
    }
  }

  function bindNav(opts) {
    var back = $("btn-back"), next = $("btn-next");
    if (back && opts.onBack) back.addEventListener("click", opts.onBack);
    if (next && opts.onNext) next.addEventListener("click", opts.onNext);
  }

  function renderStep(step) {
    currentStep = step;
    // Real navigation → allow the entrance animation to play once.
    _pendingEntrance = true;
    // Reset combo on step change so each phase starts fresh.
    level2State._comboCount = 0;
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
      "Q1 — Build Your Complex",
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

    // Hazim spec — chemistry rule: charges (⁻, ²⁻, +1, etc.) NEVER
    // appear inside the brackets / parentheses. Only the ligand name.
    // The complex's overall charge sits at the end of the bracket.
    // So strip every super/subscripted charge digit + sign from each
    // ligand label before wrapping in parentheses. Example:
    //   Cl⁻   → Cl
    //   Ox²⁻  → Ox
    //   acac⁻ → acac
    function stripLigandCharge(name) {
      // Strip ONLY the trailing charge (optional super-digits + sign).
      // Chemical subscripts in the middle of a ligand name (like NH₃,
      // H₂O, CO₃) MUST stay — those are formula subscripts, not the
      // ligand's overall charge. Both ² (U+00B2) and ³ (U+00B3) live
      // outside the U+2070-U+2079 super-digit range, so they have to
      // be listed literally in the char class.
      return String(name || "").replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]*[⁺⁻]+$/, "").trim();
    }
    var rows = summariseSelectedLigands();
    var lParts = rows.map(function (r) {
      var clean = stripLigandCharge(r.name);
      if (r.count <= 1) return "(" + clean + ")";
      // Repeated ligand → wrap once + subscript count, e.g. (bipy)₂.
      return "(" + clean + ")" + numToSubscript(r.count);
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

  /**
   * HTML version of the formula with `<span class="nb">…</span><wbr>`
   * segments around each ligand group. Each group becomes a non-
   * breaking unit, and `<wbr>` between groups gives the wrap algorithm
   * a safe break point. With CSS `word-break: keep-all`, lines now
   * break ONLY between bracket groups — never mid-token. Hazim
   * 2026-05-10 spec: long formulas with many ligands must stay
   * readable.
   */
  function formatComplexFormulaHtml() {
    if (!level2State.selectedMetal) return "";
    var metalRaw = level2State.selectedMetal.name || "";
    var metalSym = metalRaw.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]/g, "").trim() || metalRaw;
    function stripLigandCharge(name) {
      return String(name || "").replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]*[⁺⁻]+$/, "").trim();
    }
    function escapeHtml(s) {
      return String(s).replace(/[&<>"']/g, function (c) {
        return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
      });
    }
    // Hazim 2026-05-11 follow-up: "taknak double line, nak inline je".
    // Concatenate everything into a single non-breaking span — no
    // <wbr>, no per-group nb wrappers — so the formula stays on ONE
    // line. The fitFormulaSingleLine ResizeObserver shrinks the font
    // when the line gets too long for the pill width.
    var rows = summariseSelectedLigands();
    var text = "[" + metalSym;
    rows.forEach(function (r) {
      var clean = stripLigandCharge(r.name);
      text += r.count <= 1 ? "(" + clean + ")" : "(" + clean + ")" + numToSubscript(r.count);
    });
    var charge = computeTotalCharge().total;
    var chargeStr = "";
    if (charge !== 0) {
      var abs = Math.abs(charge);
      var num = abs > 1 ? numToSuperscript(abs) : "";
      chargeStr = num + (charge > 0 ? "⁺" : "⁻");
    }
    text += "]" + chargeStr;
    return escapeHtml(text);
  }

  /**
   * Final-fit shrink — ResizeObserver-driven, fires when the formula
   * pill or its container is resized. Walks font-size down 0.5 px at
   * a time until the rendered text fits both inline and block
   * dimensions. Caps at 12 px so it never disappears.
   */
  function fitFormulaToBox(el) {
    if (!el) return;
    el.style.fontSize = ""; // reset to CSS clamp() base
    var box = el.parentElement;
    if (!box) return;
    var size = parseFloat(getComputedStyle(el).fontSize);
    var safety = 60; // cap iterations
    while (safety-- > 0 && size > 12 &&
      (el.scrollWidth > box.clientWidth || el.scrollHeight > box.clientHeight)) {
      size -= 0.5;
      el.style.fontSize = size + "px";
    }
  }
  var __formulaResizeObserver = null;
  function ensureFormulaFitObserver() {
    if (__formulaResizeObserver) return;
    var box = document.querySelector(".l2-formula-box");
    if (!box) return;
    __formulaResizeObserver = new ResizeObserver(function () {
      fitFormulaToBox(box.querySelector(".l2-formula"));
    });
    __formulaResizeObserver.observe(box);
  }

  /**
   * Single-line shrink-to-fit. Hazim 2026-05-11 follow-up: "taknak
   * double line, nak inline je". Reset to the CSS clamp() base, then
   * step font-size down 0.5 px at a time until the rendered text
   * fits on a single line (capped at 12 px floor). Short formulas
   * stay big; long formulas auto-shrink just enough to fit inline.
   */
  function fitFormulaSingleLine(el) {
    if (!el) return;
    el.style.fontSize = ""; // reset to CSS clamp() base
    var size = parseFloat(getComputedStyle(el).fontSize);
    var safety = 80;
    while (safety-- > 0 && size > 12 && el.scrollWidth > el.clientWidth) {
      size -= 0.5;
      el.style.fontSize = size + "px";
    }
  }
  var __formulaResizeObserver2 = null;
  function ensureFormulaInlineFitObserver() {
    if (__formulaResizeObserver2) return;
    var el = document.getElementById("builder-formula");
    if (!el) return;
    __formulaResizeObserver2 = new ResizeObserver(function () {
      fitFormulaSingleLine(el);
    });
    __formulaResizeObserver2.observe(el);
  }

  function updateBuilderHud() {
    var formula = $("builder-formula");
    if (formula) {
      formula.innerHTML = formatComplexFormulaHtml();
      ensureFormulaInlineFitObserver();
      fitFormulaSingleLine(formula);
    }
    // Hazim 2026-05-11: the standalone CHARGE pill was removed —
    // the formula already renders the charge at the bracket close.
    var pill = $("builder-charge-pill");
    if (pill) pill.classList.add("hidden");

    // Hazim 2026-05-11 follow-up: chemistry-notation brackets around
    // the 3D scene with the charge as a superscript on the top-right
    // (mimicking [Co(NH₃)₃(H₂O)₃]³⁺ rendered around the model).
    // Update the superscript text + sign data attribute so the CSS
    // can colour it red (cation) / blue (anion) / green (neutral).
    var bracketCharge = $("l2-bracket-charge");
    if (bracketCharge) {
      var charge = computeTotalCharge().total;
      var label;
      var sign;
      if (charge === 0) {
        label = "0";
        sign = "neutral";
      } else if (charge > 0) {
        label = (charge === 1 ? "" : String(charge)) + "+";
        sign = "positive";
      } else {
        label = (charge === -1 ? "" : String(Math.abs(charge))) + "−";
        sign = "negative";
      }
      bracketCharge.textContent = label;
      bracketCharge.dataset.sign = sign;
      bracketCharge.classList.remove("hidden");
    }
  }

  function renderStep2_Q1_type() {
    saveLevel2State();
    var c = $("step-container");
    var charge = computeTotalCharge();
    var correct = classifyComplex(charge.total);
    var done = level2State.typeDone;
    var chosen = level2State.typeAnswer;

    var html = headingBanner("Q2 — Predict the type of complex", "Calculate the charges and decide whether the complex is cation, anion, or neutral.", "2 PTS");

    // Client 2026-06-18: "buang pop up markah yg ade tulis bonus" — the
    // COMBO HUD + floating "+N COMBO" sparkle read as fake bonus marks on
    // what is an exam question. Removed. Chip taps keep the pick sound.

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
    // Hazim spec — count chips capped at [1][2] (Q2 + Q3 alike).
    var countOpts        = ['1', '2'];
    // Hazim 2026-05-11: previously missing −5 / +5 in Q2 chip row.
    // Full integer range from −6 → +6 so every realistic charge
    // contribution (e.g. 5× Cl⁻ = −5 or +5 metal-ish edge cases)
    // has a chip pick.
    var contribOpts      = ['−6', '−5', '−4', '−3', '−2', '−1', '0', '+1', '+2', '+3', '+4', '+5', '+6'];

    // Inline number chips, always visible (Hazim 2026-06-17: "buang
    // pill, nombor terus nampak"). Tap a chip → it selects + plays a
    // sound, no full-stage re-animation. Reverts the PAKAR 1 tile-slot
    // + dial reactor which forced a tap-to-arm → spin → drop dance and
    // re-rendered the whole stage at each step (looked like a refresh).
    function pickerChips(field, key, opts, currentValue, expectedValue) {
      var sel = currentValue != null ? currentValue : '';
      var chipBase = 'q1-' + field + '-chip text-sm font-black px-2.5 py-1.5 rounded-md border-2 transition select-none ';
      var out = '<div class="flex flex-wrap justify-center gap-1">';
      opts.forEach(function (o) {
        var isPicked = sel === o;
        var cls = chipBase;
        if (done) {
          var isWrongPick = isPicked && expectedValue != null && String(o) !== String(expectedValue);
          if (isWrongPick) {
            cls += 'border-red-500 bg-red-50 text-red-700 ring-2 ring-red-300 cursor-default ';
          } else if (isPicked) {
            cls += 'border-[#4187a0] bg-[#4187a0]/10 text-[#4187a0] cursor-default ';
          } else {
            cls += 'border-gray-200 text-gray-300 cursor-default ';
          }
        } else {
          cls += isPicked ? 'border-[#4187a0] bg-[#4187a0]/10 text-[#4187a0] '
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

    // Metal row — Hazim spec: drop the Charge column chips for the
    // metal (no need to pick metal charge twice). Keep only the
    // Charge Contribution chip — that's the value that matters for
    // computing Charge of Complex.
    var expMetalCharge = level2State.selectedMetal ? level2State.selectedMetal.charge : 0;
    var expMetalChargeStr = fmtSignedCharge(expMetalCharge);
    html += '<tr class="border-t border-gray-100 bg-blue-50">';
    html += '<td class="px-3 py-2 font-medium text-gray-800">Metal: ' + (level2State.selectedMetal ? level2State.selectedMetal.name : "—") + '</td>';
    html += '<td class="text-center px-3 py-2 text-gray-300">—</td>';
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
      var workingRight = (
        String(level2State.q1TotalLigandChargeInput || '') === expTotalLigandStr &&
        String(level2State.q1ComplexChargeInput || '')     === expComplexChargeStr
      );
      var workingMark = workingRight ? 1 : 0;
      var typeMark = pickedRight ? 1 : 0;
      var breakdown = ''
        + '<div class="flex items-center justify-center gap-3 text-xs mt-1">'
        +   '<span class="px-2 py-0.5 rounded-full ' + (workingRight ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500') + ' font-bold">Working: +' + workingMark + '</span>'
        +   '<span class="px-2 py-0.5 rounded-full ' + (pickedRight  ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500') + ' font-bold">Answer: +' + typeMark + '</span>'
        + '</div>';
      if (pickedRight) {
        html += '<div class="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm text-center font-semibold mb-3">You are correct! +' + pts + ' point' + (pts === 1 ? '' : 's') + breakdown + '</div>';
      } else {
        html += '<div class="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center mb-3">You are wrong. The correct answer was <strong>' + correct + '</strong>.' + breakdown + '</div>';
      }
    } else if (level2State.typeAttempts > 0) {
      html += '<div class="p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-700 text-sm text-center mb-3">Try again. Attempt ' + level2State.typeAttempts + '/3 — wrong picks have been eliminated.</div>';
    }

    html += navButtons({ back: true, next: true, nextDisabled: !done && !chosen, nextLabel: done ? "Next: Geometry" : "Submit" });
    c.innerHTML = html;

    // GSAP entrance — stage Q1 in (combo HUD, table rows, answer
    // buttons) only on real navigation into the step. Gated by
    // _pendingEntrance so chip taps (which re-render the whole stage)
    // don't replay the entrance — that replay read as a page refresh
    // (Hazim 2026-06-17).
    if (window.gsap && _pendingEntrance) {
      _pendingEntrance = false;
      var tlEntrance = gsap.timeline({ defaults: { ease: "back.out(1.8)" } });
      var rows = c.querySelectorAll("table tbody tr");
      if (rows.length) tlEntrance.from(rows,
        { y: 14, opacity: 0, duration: 0.32, stagger: 0.06 }, 0.05);
      var kBtns = c.querySelectorAll(".l2-kahoot-btn");
      if (kBtns.length) tlEntrance.from(kBtns,
        { y: 18, scale: 0.85, opacity: 0, duration: 0.32, stagger: 0.07 }, 0.42);
    }

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
        if (window.AudioManager) window.AudioManager.play("ligand");
        saveLevel2State();
        renderStep2_Q1_type();
      });
    });

    // Working-out totals — single chip per row.
    document.querySelectorAll(".q1-totLigand-chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        if (done) return;
        level2State.q1TotalLigandChargeInput = chip.getAttribute("data-val");
        if (window.AudioManager) window.AudioManager.play("ligand");
        saveLevel2State();
        renderStep2_Q1_type();
      });
    });
    document.querySelectorAll(".q1-complex-chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        if (done) return;
        level2State.q1ComplexChargeInput = chip.getAttribute("data-val");
        if (window.AudioManager) window.AudioManager.play("ligand");
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
          // Hazim spec — Q2 scoring split:
          //   1 mark if both working-out totals (Total of ligand
          //   charge AND Charge of Complex) match the expected.
          //   1 mark for clicking the right type.
          // Working-out score is awarded once on the first correct
          // submission; type score requires getting the right option.
          var workingMark = (
            String(level2State.q1TotalLigandChargeInput || '') === expTotalLigandStr &&
            String(level2State.q1ComplexChargeInput || '')     === expComplexChargeStr
          ) ? 1 : 0;
          var typeMark = 1; // they picked correct type — credit it.
          level2State.typeScore = workingMark + typeMark;
          level2State.typeDone = true;
          level2State.level2Score += level2State.typeScore;
          updateScoreBar();
          // Client 2026-06-18: no score popup on Q2 — inline green banner
          // already reports the marks. Quiet chime only.
          if (window.AudioManager) window.AudioManager.play("correct");
        } else if (level2State.typeAttempts >= 3) {
          // Out of attempts — type mark zero, but still grant the
          // working-out mark if those chips were correct.
          var workingMark2 = (
            String(level2State.q1TotalLigandChargeInput || '') === expTotalLigandStr &&
            String(level2State.q1ComplexChargeInput || '')     === expComplexChargeStr
          ) ? 1 : 0;
          level2State.typeScore = workingMark2;
          level2State.typeDone = true;
          level2State.level2Score += level2State.typeScore;
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

    var html = headingBanner("Q3 — Predict the coordination number", "Sum the donor atoms across all ligands. CN can be 3, 4, 5, or 6.", "1 PT");

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
    // Hazim spec — n column capped at [1][2] (matches Q2 chips).
    var countOpts = ['1', '2'];

    function q2Chips(cls, key, opts, sel, expectedVal) {
      // Inline chips, always visible (Hazim 2026-06-17: "buang pill,
      // nombor terus nampak"). Reverts the PAKAR 1 "Tap to pick"
      // progressive reveal — that pill needed two full re-renders per
      // pick (expand → collapse), which looked like a page refresh.
      var chipBase = cls + ' text-sm font-black px-2.5 py-1.5 rounded-md border-2 transition select-none ';

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


    // 4-option answer — same kahoot button pattern as Q2 so the
    // selected/correct/wrong states use the gold-ring + check-badge
    // styling. Players need to clearly see which option is chosen
    // before submitting (Hazim spec "tk nampak player tgh pilih mana").
    // Wrong picks get pushed to cnEliminated and rendered as the
    // grayed "WRONG" stamp from the kahoot eliminated state — Hazim
    // 2026-05-11 spec ("yg salah ptutnyee akan disabled").
    if (!Array.isArray(level2State.cnEliminated)) level2State.cnEliminated = [];
    var cnEliminated = level2State.cnEliminated;
    var opts = [3, 4, 5, 6];
    var cnColors = ['teal', 'green', 'yellow', 'pink'];
    html += '<div class="grid grid-cols-4 gap-3 mb-3">';
    opts.forEach(function (n, i) {
      var isEliminated = cnEliminated.indexOf(n) !== -1;
      var state = "idle";
      var disabled = done || isEliminated;
      if (done) {
        if (n === cn) state = "correct";
        else if (n === chosen) state = "wrong";
        else state = "faded";
      } else if (isEliminated) {
        state = "eliminated";
      } else if (n === chosen) {
        state = "selected";
      }
      var cls = "cn-opt l2-kahoot-btn l2-kahoot-btn--" + cnColors[i % cnColors.length];
      html += '<button class="' + cls + '" data-state="' + state + '" data-val="' + n + '"' + (disabled ? ' disabled' : '') + '>' + n + '</button>';
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
      html += '<div class="p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-700 text-sm text-center mb-3">Try again. Attempt ' + level2State.cnAttempts + '/3</div>';
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
        if (window.AudioManager) window.AudioManager.play("ligand");
        saveLevel2State();
        renderStep3_Q2_cn();
      });
    });
    document.querySelectorAll(".q2-dent-chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        if (done) return;
        level2State.q2DenticityInputs[this.getAttribute("data-key")] = this.getAttribute("data-val");
        if (window.AudioManager) window.AudioManager.play("ligand");
        saveLevel2State();
        renderStep3_Q2_cn();
      });
    });
    document.querySelectorAll(".q2-count-chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        if (done) return;
        level2State.q2CountInputs[this.getAttribute("data-key")] = this.getAttribute("data-val");
        if (window.AudioManager) window.AudioManager.play("ligand");
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
        // Defensive: don't double-count an already-eliminated pick.
        if (cnEliminated.indexOf(level2State.cnAnswer) !== -1) return;

        level2State.cnAttempts++;
        var right = level2State.cnAnswer === cn;
        if (right) {
          // Hazim 2026-05-13 spec: every correct CN earns the full 1pt
          // regardless of attempt count. Earlier "1st attempt only"
          // rule made 2nd/3rd-attempt correct answers feel like the
          // score wasn't saved (toast showed "Correct!" with no +pts
          // because cnScore was 0).
          level2State.cnScore = 1;
          level2State.cnDone = true;
          level2State.level2Score += level2State.cnScore;
          updateScoreBar();
          // Client 2026-06-18: Q3 — no score popup, inline banner reports it.
          if (window.AudioManager) window.AudioManager.play("correct");
          renderStep3_Q2_cn();
        } else if (level2State.cnAttempts >= 3) {
          level2State.cnScore = 0;
          level2State.cnDone = true;
          updateScoreBar();
          if (window.AudioManager) window.AudioManager.play("wrong");
          renderStep3_Q2_cn();
        } else {
          // Wrong but attempts left — eliminate the pick + clear
          // selection so the player must choose another (Hazim
          // 2026-05-11: "yg salah ptutnyee akan disabled").
          if (cnEliminated.indexOf(level2State.cnAnswer) === -1) {
            cnEliminated.push(level2State.cnAnswer);
          }
          level2State.cnAnswer = null;
          if (window.AudioManager) window.AudioManager.play("wrong");
          saveLevel2State();
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

    var html = headingBanner("Q4 — State the possible complex geometry", "Choose the correct geometry for your coordination number.", "1 PT");

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
    // Pending pick — set on click, committed on Submit. Decoupled so
    // players can SEE which option they're about to submit (Hazim spec
    // "tk nampak player tgh pilih yg mana").
    var pending = level2State.geometryPending || null;
    // Research-driven 6-colour palette (Hazim 2026-05-10): replaces the
    // old red/yellow/green/purple/teal/pink array which had two issues:
    // (1) yellow #f59e0b vs the selected-state gold #fde047 outline =
    //     no perceived contrast — selected state was invisible on the
    //     yellow card.
    // (2) Kahoot's brand uses deeper, more saturated hues than the
    //     stock Tailwind 500 series — students read them as more
    //     distinct on a board background.
    // New palette uses deep Kahoot-aligned hues, all 6 distinct under
    // colour-blind simulation, all WCAG ≥4.5:1 with white text.
    var geoColors = ["red", "blue", "green", "orange", "purple", "teal"];
    if (!Array.isArray(level2State.geometryEliminated)) level2State.geometryEliminated = [];
    var geometryEliminated = level2State.geometryEliminated;
    html += '<div class="grid grid-cols-2 sm:grid-cols-3 gap-3">';
    level2State.geometryOrder.forEach(function (geo, idx) {
      var isCorrect = correctList.indexOf(geo) >= 0;
      var isEliminated = geometryEliminated.indexOf(geo) !== -1;
      var state = "idle";
      var disabled = done || isEliminated;
      if (done) {
        if (isCorrect) state = "correct";
        else if (geo === level2State.selectedGeometry && !isCorrect) state = "wrong";
        else state = "faded";
      } else if (isEliminated) {
        state = "eliminated";
      } else if (geo === pending) {
        state = "selected";
      }
      var cls = "geo-btn l2-kahoot-btn l2-kahoot-btn--" + geoColors[idx % geoColors.length];
      html += '<button class="' + cls + '" data-state="' + state + '" data-val="' + geo + '"' + (disabled ? ' disabled' : '') + '>';
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

    html += navButtons({
      back: true,
      next: true,
      nextDisabled: done ? false : !pending,
      nextLabel: done ? "Next: Build in 3D →" : "Submit",
    });
    c.innerHTML = html;

    if (!done) {
      document.querySelectorAll(".geo-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
          if (level2State.geometryDone) return;
          level2State.geometryPending = this.getAttribute("data-val");
          saveLevel2State();
          renderStep2();
        });
      });
    }

    bindNav({
      onBack: function () { renderStep(3); },
      onNext: function () {
        if (done) { renderStep(5); return; }
        if (!level2State.geometryPending) return;
        var val = level2State.geometryPending;
        level2State.geometryAttempts++;
        var isCorrect = correctList.indexOf(val) >= 0;
        if (isCorrect) {
          level2State.selectedGeometry = val;
          // Hazim 2026-05-13: always award the full 1pt on correct, no
          // more "1st attempt only" — see same change on cnScore.
          var pts = 1;
          level2State.geometryScore = pts;
          level2State.level2Score += pts;
          level2State.geometryDone = true;
          // Client 2026-06-18: no score popup on Q4 — quiet chime only.
          if (window.AudioManager) window.AudioManager.play("correct");
        } else if (level2State.geometryAttempts >= 3) {
          level2State.selectedGeometry = correctList[0];
          level2State.geometryScore = 0;
          level2State.geometryDone = true;
          if (window.AudioManager) window.AudioManager.play("wrong");
        } else {
          // Wrong, but attempts left — eliminate the picked option +
          // clear pending so they MUST choose another (Hazim
          // 2026-05-11: "yg salah ptutnyee akan disabled").
          if (geometryEliminated.indexOf(val) === -1) {
            geometryEliminated.push(val);
          }
          level2State.geometryPending = null;
          if (window.AudioManager) window.AudioManager.play("wrong");
        }
        updateScoreBar();
        saveLevel2State();
        renderStep2();
      },
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
    // Hazim 2026-05-11: workspace toggles to lg:grid-cols-2 the moment
    // we enter step 5, but Q4 picture-pick is ALSO step 5 with the
    // builder hidden — that left the image grid in a 50%-width column
    // with a huge empty band on the right. Drop the 2-col grid until
    // the 3D builder actually renders.
    var ws = $("l2-workspace");
    if (ws) {
      ws.classList.remove("lg:grid-cols-2");
      ws.dataset.builderVisible = "false";
    }

    var cn = calcCN();
    var done = level2State.pictureDone;
    var chosen = level2State.pictureAnswer;

    var html = headingBanner(
      "Q4 — Pick the matching geometry",
      "First, pick the complex name that matches your CN = <strong class=\"text-amber-300\">" + cn + "</strong>. Attempt " + Math.min(level2State.pictureAttempts + (done ? 0 : 1), 3) + " / 3 &middot; 1st = 3 pts &middot; 2nd = 2 pts &middot; 3rd = 1 pt",
      "3 PTS"
    );

    // Show all 6 geometry images — Hazim 2026-05-11 reversal
    // ("kenapa ada satu je gambar ni?? patutnye ade banyak"). The
    // earlier CN-only filter was too easy: with CN=3 it left exactly
    // 1 card and the player just clicked the obvious answer. Now
    // every reference geometry is presented, the player has to
    // RECOGNISE which one matches their calculated CN. The order is
    // shuffled once per session and persisted in level2State so the
    // cards don't jump between attempts.
    if (!Array.isArray(level2State.pictureOrder)
        || level2State.pictureOrder.length !== GEOMETRY_PICS.length) {
      level2State.pictureOrder = GEOMETRY_PICS.slice().sort(function () { return Math.random() - 0.5; });
    }

    // Hazim 2026-05-11: was rendering as 3-col, leaving the right
     // half empty. 6-col on large screens spreads the 6 geometry
     // cards across the full width of the step container.
    html += '<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">';
    level2State.pictureOrder.forEach(function (g) {
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
      html += '<button class="geo-pic-btn geo-img-card" data-state="' + state + '" data-val="' + g.id + '"' + (done ? ' disabled' : '') + ' aria-label="' + g.label + '">';
      html += '<img src="' + g.image + '" alt="" loading="lazy" />';
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
          // Lock in the geometry for the 3D build phase. Hazim
          // 2026-05-11 spec: "Q5 keluar gambar yg kita tak tekan" —
          // when the player ran out of attempts on a wrong image
          // pick, this used to overwrite selectedGeometry with that
          // WRONG label (e.g. Octahedral when CN was actually 4),
          // and Q5 then built 6 slots instead of 4. Honour the
          // player's pick only if it matches their CN; otherwise
          // fall back to the Q4-text selectedGeometry (correct) or
          // the first valid geometry for their CN.
          var cn = calcCN();
          var picked = GEOMETRY_PICS.find(function (g) { return g.id === level2State.pictureAnswer; });
          if (picked && picked.cn === cn) {
            level2State.selectedGeometry = picked.label;
          } else {
            var validList = GEOMETRY_MAP[cn] || [];
            if (validList.length > 0) {
              // Preserve Q4-text's choice if it's a valid CN match,
              // else default to the first valid geometry for the CN.
              if (validList.indexOf(level2State.selectedGeometry) === -1) {
                level2State.selectedGeometry = validList[0];
              }
            }
          }
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
          // Client 2026-06-18: no score popup on Q4 — quiet chime only.
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

    // Builder is showing now — re-apply the 2-column workspace so
    // the step-container shares the row with the 3D card.
    var ws = $("l2-workspace");
    if (ws) {
      ws.classList.add("lg:grid-cols-2");
      ws.dataset.builderVisible = "true";
      setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 0);
    }

    // Re-entering the build phase — clear any leftover armed state.
    armedLigandIdx = null;
    var armedRow = $("builder-armed-row");
    if (armedRow) armedRow.classList.add("hidden");

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
      // Clear the armed indicator — the ligand is now in a slot.
      setArmedLigand(null);
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

  // Tracks the ligand index the player has "armed" by clicking
  // (versus dragging). Drag start also updates this so the pill above
  // the inventory always reflects the most-recent intent.
  var armedLigandIdx = null;

  // Cursor-following ghost preview — research-backed (NN/g, Microsoft
  // Visual Feedback Guidelines, Smart Interface Design Patterns):
  // dragging/arming feedback should travel with the cursor into the
  // 3D scene rather than sit isolated below it. Hazim 2026-05-10:
  // "tak nampak player pilih mana".
  function ensureArmGhost() {
    var ghost = document.getElementById("l2-arm-ghost");
    if (ghost) return ghost;
    ghost = document.createElement("div");
    ghost.id = "l2-arm-ghost";
    ghost.setAttribute("aria-hidden", "true");
    document.body.appendChild(ghost);
    document.addEventListener("pointermove", function (e) {
      if (ghost.dataset.on !== "1") return;
      ghost.style.left = e.clientX + "px";
      ghost.style.top  = e.clientY + "px";
    });
    return ghost;
  }

  function setArmedLigand(lig) {
    var row  = $("builder-armed-row");
    var dot  = $("builder-armed-dot");
    var name = $("builder-armed-name");
    var ghost = ensureArmGhost();
    if (!row) return;
    if (!lig) {
      armedLigandIdx = null;
      row.classList.add("hidden");
      document.body.classList.remove("l2-arming");
      ghost.dataset.on = "0";
      // Reset visual armed state on all cards
      document.querySelectorAll(".lig-drag-card").forEach(function (el) {
        el.removeAttribute("data-armed");
      });
      return;
    }
    armedLigandIdx = lig._idx;
    var color = SPHERE_COLORS_CSS[lig.sphere] || '#9CA3AF';
    if (dot)  dot.style.background = color;
    if (name) name.textContent = lig.name;
    row.classList.remove("hidden");
    // Wire the cursor-following ghost preview. Body class flips the
    // cursor to crosshair globally so the player feels they are
    // "carrying" the ligand into the 3D scene.
    document.body.classList.add("l2-arming");
    ghost.dataset.on = "1";
    ghost.style.setProperty("--ghost-color", color);
    ghost.innerHTML =
      '<span class="l2-arm-ghost-dot" style="background:' + color + '"></span>' +
      '<span class="l2-arm-ghost-name">' + (lig.name || "") + '</span>';
    // Visually mark the armed card with the gold ring + check stamp.
    document.querySelectorAll(".lig-drag-card").forEach(function (el) {
      var i = parseInt(el.getAttribute("data-idx"), 10);
      if (i === lig._idx) el.setAttribute("data-armed", "true");
      else el.removeAttribute("data-armed");
    });
  }

  function renderInventory() {
    var inv = $("ligand-inventory");
    if (!inv) return;
    var html = '';
    inventoryLigands.forEach(function (lig) {
      if (lig.placed) return;
      var color = SPHERE_COLORS_CSS[lig.sphere] || '#9CA3AF';
      var isArmed = (lig._idx === armedLigandIdx);
      html += '<div class="lig-drag-card flex flex-col items-center gap-1 p-2 rounded-lg border-2 border-gray-200 bg-white cursor-grab hover:border-[#4187a0] hover:shadow-md transition select-none" draggable="true" data-idx="' + lig._idx + '"' + (isArmed ? ' data-armed="true"' : '') + '>';
      html += '<div class="w-8 h-8 rounded-full shadow-inner" style="background-color:' + color + '"></div>';
      html += '<span class="text-xs font-bold text-gray-700">' + lig.name + '</span>';
      html += '</div>';
    });
    if (html === '') {
      html = '<p class="text-gray-400 text-sm">All ligands placed!</p>';
      // Also clear the armed pill — nothing to pick up.
      setArmedLigand(null);
    }
    inv.innerHTML = html;

    document.querySelectorAll(".lig-drag-card").forEach(function (card) {
      card.addEventListener("click", function () {
        var idx = parseInt(this.getAttribute("data-idx"), 10);
        var lig = inventoryLigands.find(function (l) { return l._idx === idx; });
        if (!lig) return;
        // Toggle: clicking the armed card again disarms it.
        if (armedLigandIdx === idx) {
          setArmedLigand(null);
          window.BoneBuilder.clearDraggedLigand();
        } else {
          setArmedLigand(lig);
          window.BoneBuilder.setDraggedLigand(lig);
        }
      });
      card.addEventListener("dragstart", function (e) {
        var idx = parseInt(this.getAttribute("data-idx"), 10);
        var lig = inventoryLigands.find(function (l) { return l._idx === idx; });
        if (lig) {
          window.BoneBuilder.setDraggedLigand(lig);
          setArmedLigand(lig);
        }
        e.dataTransfer.setData("text/plain", idx);
        this.style.opacity = "0.4";
      });
      card.addEventListener("dragend", function () {
        this.style.opacity = "1";
        // Don't clearDraggedLigand here — placement may still fire.
      });
      card.addEventListener("touchstart", function (e) {
        var idx = parseInt(this.getAttribute("data-idx"), 10);
        var lig = inventoryLigands.find(function (l) { return l._idx === idx; });
        if (lig) {
          window.BoneBuilder.setDraggedLigand(lig);
          setArmedLigand(lig);
        }
      });
    });

    // After the cards are re-injected, sync the armed visual.
    if (armedLigandIdx !== null) {
      var stillThere = inventoryLigands.find(function (l) {
        return l._idx === armedLigandIdx && !l.placed;
      });
      if (!stillThere) setArmedLigand(null);
    }
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
    // Hard guard against re-entry — Hazim 2026-05-11 saw "+1 points
    // (attempt 6/3)" with the score bar climbing past 18 while the
    // demo bot kept hitting Submit. Once buildDone, every subsequent
    // call would re-enter the `if (valid)` branch, do
    // `level2Score += 1`, and re-render the success screen. Now we
    // bail early so attempts are properly capped at 3 and the score
    // can only be awarded once.
    if (level2State.buildDone) {
      console.log('[L2] handleBuildSubmit: already done — ignoring re-submit');
      return;
    }
    level2State.buildAttempts++;
    var valid = validateBuild();
    var placed = window.BoneBuilder.getPlacedLigands();

    if (valid) {
      var pts = level2State.buildAttempts === 1 ? 5 : (level2State.buildAttempts === 2 ? 3 : 1);
      level2State.buildScore = pts;
      level2State.level2Score += pts;
      level2State.buildDone = true;
      updateScoreBar();

      // Play "complex built" SFX + show the gold sparkly toast so
      // the build success uses the same celebratory feedback as the
      // earlier questions (Hazim spec: "untuk point setiap soalan
      // buat je macam Q1 keluar box you earned").
      if (window.AudioManager) window.AudioManager.play('complex-built');
      showPointsToast(pts, "You earned");

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

    // Player-facing Q1..Q5 breakdown. Hazim 2026-05-13: previous
    // table omitted `pictureScore` (Q4 image picker, 3 pts) entirely
    // and used a stale `/6` denominator on the 3D build (max is 5),
    // which made the grand total look like it included unexplained
    // points → reported as "Q4 tk simpan markah".
    //   Q1 (setup)        — setupScore       / 2
    //   Q2 (type)         — typeScore        / 2
    //   Q3 (CN)           — cnScore          / 1
    //   Q4 (geometry)     — geometryScore (text warm-up, 1)
    //                      + pictureScore  (image picker, 3) = / 4
    //   Q5 (3D build)     — buildScore       / 5
    var q4Score = (level2State.geometryScore || 0) + (level2State.pictureScore || 0);
    html += '<div class="bg-gray-50 rounded-lg p-6 text-left max-w-sm mx-auto">';
    html += '<table class="w-full text-sm"><tbody>';
    html += '<tr class="border-b border-gray-200"><td class="py-2 text-gray-600">Level 1 Points</td><td class="py-2 text-right font-bold">' + l1 + '</td></tr>';
    html += '<tr class="border-b border-gray-200"><td class="py-2 text-gray-600">Q1: Choose metal &amp; ligands</td><td class="py-2 text-right font-bold">' + (level2State.setupScore || 0) + ' / 2</td></tr>';
    html += '<tr class="border-b border-gray-200"><td class="py-2 text-gray-600">Q2: Type of complex</td><td class="py-2 text-right font-bold">' + (level2State.typeScore || 0) + ' / 2</td></tr>';
    html += '<tr class="border-b border-gray-200"><td class="py-2 text-gray-600">Q3: Coordination number</td><td class="py-2 text-right font-bold">' + (level2State.cnScore || 0) + ' / 1</td></tr>';
    html += '<tr class="border-b border-gray-200"><td class="py-2 text-gray-600">Q4: Geometry (name + image)</td><td class="py-2 text-right font-bold">' + q4Score + ' / 4</td></tr>';
    html += '<tr class="border-b border-gray-200"><td class="py-2 text-gray-600">Q5: 3D build</td><td class="py-2 text-right font-bold">' + (level2State.buildScore || 0) + ' / 5</td></tr>';
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
      // Last player just finished — open the final podium with the
      // birthday-party confetti + applause finale (handled inside
      // LevelTwoPodium.show). Hazim 2026-05-11 spec: "after semua
      // player dah siap redirect ke page baru terus show result".
      if (window.LevelTwoPodium && typeof window.LevelTwoPodium.show === "function") {
        window.LevelTwoPodium.show(entries);
      }
    } else {
      // Pass-device prompt — replace the native alert() with a styled
      // modal that matches the rest of the wizard.
      var remaining = expected.filter(function (pid) { return !finals[pid]; });
      _showPassDeviceModal(playerNameFor(remaining[0]), remaining.length);
    }
  }

  /**
   * In-page modal asking the current group to pass the device to the
   * next player. Replaces the legacy `alert()` which broke the page's
   * rounded-modal aesthetic.
   */
  function _showPassDeviceModal(nextName, remainingCount) {
    var overlay = document.createElement("div");
    overlay.id = "l2-pass-device-modal";
    overlay.style.cssText = "position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;background:rgba(15,23,42,0.55);backdrop-filter:blur(4px);padding:24px;";
    overlay.innerHTML =
      '<div style="background:#fff;border-radius:24px;padding:32px;max-width:420px;width:100%;text-align:center;box-shadow:0 24px 60px rgba(0,0,0,0.35);border:4px solid #4187a0;font-family:Fredoka,system-ui,sans-serif;">' +
        '<div style="font-size:56px;margin-bottom:8px;line-height:1;">→</div>' +
        '<h2 style="font-size:1.5rem;font-weight:800;color:#0f172a;margin-bottom:6px;">Pass the device</h2>' +
        '<p style="color:#475569;font-size:0.95rem;margin-bottom:18px;">It\'s <strong style="color:#0f172a;">' +
          String(nextName).replace(/[<>&]/g, "") +
          '</strong>\'s turn to play Level 2.</p>' +
        '<p style="color:#64748b;font-size:0.8rem;margin-bottom:22px;">' +
          remainingCount + ' player' + (remainingCount === 1 ? '' : 's') + ' still to go before the final podium.' +
        '</p>' +
        '<button id="l2-pass-device-ok" style="background:#4187a0;color:#fff;font-weight:700;font-size:1rem;padding:12px 32px;border-radius:14px;border:none;cursor:pointer;box-shadow:0 4px 0 #357a91;">Hand it over</button>' +
      '</div>';
    document.body.appendChild(overlay);
    var btn = document.getElementById("l2-pass-device-ok");
    if (btn) {
      btn.addEventListener("click", function () {
        overlay.remove();
        // Wipe every per-player snapshot so the next active player
        // boots into a fresh Q1, not into some other player's
        // half-finished run. (The legacy version only removed
        // "level2-state-1" — broken when handoff went P2 → P3.)
        try {
          for (var i = 1; i <= 4; i++) sessionStorage.removeItem("level2-state-" + i);
        } catch (e) {}
        location.reload();
      });
    }
  }

  function getExpectedActivePlayers() {
    try {
      if (window.TurnManager && typeof window.TurnManager.getActivePlayers === "function") {
        var ap = window.TurnManager.getActivePlayers();
        if (Array.isArray(ap) && ap.length > 0) return ap;
      }
    } catch (e) {}
    // Fallback when TurnManager is missing — match the pass-and-play
    // wizard's slot mapping (per player-color-remap memory):
    //   solo        → [1]
    //   one-vs-one  → [1, 2]   (P1 green + P2 yellow — wizard default)
    //   one-vs-two  → [1, 2, 3]
    //   one-vs-three → [1, 2, 3, 4]
    // Hazim 2026-05-11 audit caught the legacy [1, 4] hard-code for
    // one-vs-one which would have broken the L2 pass-device gate on
    // pass-and-play 1v1.
    var opt = sessionStorage.getItem("game-option");
    if (opt === "solo") return [1];
    if (opt === "one-vs-one") return [1, 2];
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
