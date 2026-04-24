/*
 * solo-patch.js
 *
 * Loaded AFTER one-vs-one.js when sessionStorage "game-option" === "solo".
 * Patches the one-vs-one infrastructure so a single human player can play
 * alone: hides other players, keeps turn on the chosen horse, skips the
 * second-player dice transfer.
 *
 * Runs immediately on load — one-vs-one.js has already set initial x and
 * hidden the "opposite pair" by now.
 */

(function () {
  if (sessionStorage.getItem("solo-mode") !== "true") return;

  var soloHorse = sessionStorage.getItem("solo-horse") || "red";
  var soloName = sessionStorage.getItem("solo-player-name") || "Player 1";

  // Color → player number (matches game-board.astro layout)
  var horseToPlayer = { red: 1, blue: 2, yellow: 3, green: 4 };
  var soloPlayer = horseToPlayer[soloHorse] || 1;

  // Mark solo mode globally for any listener
  window.SOLO_MODE = true;
  window.SOLO_PLAYER = soloPlayer;
  window.SOLO_HORSE = soloHorse;

  // --- Align global x with chosen player ------------------------------------
  // one-vs-one.js has just set x based on horse-1 (red→1, blue→2).
  // For green/yellow we need to override to 4/3 respectively.
  try {
    window.x = soloPlayer;
  } catch (e) {}

  // --- Hide all player areas except the solo player --------------------------
  function hideOthers() {
    for (var p = 1; p <= 4; p++) {
      if (p === soloPlayer) continue;
      var area = document.getElementById("player-" + p + "-area");
      if (area) area.style.opacity = 0;
      // Hide the player card row (name, dice, arrow)
      var card = document.getElementById("player-" + p);
      if (card) card.style.opacity = 0;
      // Hide any ligand box tied to that player
      var ligandBox = document.getElementById("ligand-display-" + p);
      if (ligandBox) {
        var parent = ligandBox.closest("[data-player-ligand-box]") || ligandBox.parentElement;
        if (parent) parent.style.opacity = 0;
      }
      // Remove their horses from the board
      var homeCorner = document.getElementById("player-" + p);
      if (homeCorner) {
        var imgs = homeCorner.querySelectorAll("table img");
        imgs.forEach(function (img) {
          img.remove();
        });
      }
    }

    // Make sure the solo player's area IS visible (one-vs-one.js may have hidden it)
    var soloArea = document.getElementById("player-" + soloPlayer + "-area");
    if (soloArea) soloArea.style.opacity = 1;
    var soloCard = document.getElementById("player-" + soloPlayer);
    if (soloCard) soloCard.style.opacity = 1;

    // Set solo player's name
    var nameEl = document.querySelector("#player-" + soloPlayer + " > p");
    if (nameEl) nameEl.textContent = soloName;
    var nameSpan = document.getElementById("player-" + soloPlayer + "-name");
    if (nameSpan) nameSpan.textContent = soloName;

    // Point the dice arrow at solo player, reset others
    for (var q = 1; q <= 4; q++) {
      var arrow = document.getElementById("player-" + q + "-dice-arrow");
      if (arrow) {
        if (q === soloPlayer) {
          arrow.setAttribute("src", "gifs/arrow1.gif");
        } else {
          arrow.setAttribute("src", "");
        }
      }
      var dice = document.getElementById("player-" + q + "-dice");
      if (dice && q !== soloPlayer) {
        dice.setAttribute("src", "dice/dice-rest.png");
      }
    }
  }

  // Run now and once after DOM settles (covers both pre-DOM and post-DOM loads)
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", hideOthers);
  } else {
    hideOthers();
  }
  setTimeout(hideOthers, 100);
  setTimeout(hideOthers, 500);

  // --- Override transferDiceCode to keep turn with the solo player -----------
  // The original swaps x between two players; in solo we only need to
  // reset dice/flags and leave x alone.
  function soloTransferDiceCode() {
    try {
      if (typeof playerDice !== "undefined" && playerDice) {
        var d1 = document.getElementById(playerDice);
        if (d1) d1.setAttribute("src", "dice/dice-rest.png");
      }
    } catch (e) {}

    var diceEl = document.getElementById("player-" + window.x + "-dice");
    if (diceEl) diceEl.setAttribute("src", "dice/dice-rest.png");

    var arrowEl = document.getElementById("player-" + window.x + "-dice-arrow");
    if (arrowEl) arrowEl.setAttribute("src", "gifs/arrow1.gif");

    // Reset dice-roll gating flags used throughout one-vs-one.js
    try {
      window.y = 1;
      window.d = 0;
      window.z = 1;
    } catch (e) {}

    // Re-apply identity for movement helpers
    if (typeof window.identifyPlayerInfo === "function") {
      try {
        window.identifyPlayerInfo();
      } catch (e) {}
    }
  }

  // Wait for one-vs-one.js to register the global, then replace it
  function installOverride() {
    if (typeof window.transferDiceCode !== "function") {
      return setTimeout(installOverride, 50);
    }
    window.transferDiceCode = soloTransferDiceCode;
    console.log("[solo-patch] transferDiceCode override installed — solo player:", soloPlayer);
  }
  installOverride();

  // Keep the win-checker / turn-manager aware: override turn-manager's
  // active players to contain only the solo player so it won't try to
  // advance to a hidden player.
  function patchTurnManager() {
    if (!window.TurnManager || typeof window.TurnManager !== "object") {
      return setTimeout(patchTurnManager, 50);
    }
    try {
      if (typeof window.TurnManager.setActivePlayers === "function") {
        window.TurnManager.setActivePlayers([soloPlayer]);
      }
      if (typeof window.TurnManager.setCurrentPlayer === "function") {
        window.TurnManager.setCurrentPlayer(soloPlayer);
      }
    } catch (e) {
      console.warn("[solo-patch] TurnManager patch failed", e);
    }
  }
  patchTurnManager();
})();
