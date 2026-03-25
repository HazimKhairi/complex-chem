# WebSocket Integration Example

## Quick Start (Copy-Paste Ready)

### 1. Add to your Astro page layout

```astro
---
// src/layouts/GameLayout.astro
import WebSocketConnector from '../components/websocket-connector.astro';

const roomId = Astro.url.searchParams.get('room') || 'default-room';
const playerName = Astro.url.searchParams.get('player') || 'Guest';
const playerColor = Astro.url.searchParams.get('color') || 'red';
---

<!DOCTYPE html>
<html>
<head>
  <title>Complex Chem Quest</title>
</head>
<body>
  <!-- Include WebSocket client -->
  <script src="/scripts/websocket-client.js"></script>
  <script src="/scripts/game-mechanics.js"></script>

  <!-- Auto-connect to game room -->
  <WebSocketConnector
    roomId={roomId}
    playerName={playerName}
    playerColor={playerColor}
    autoConnect={true}
  />

  <!-- Your game UI -->
  <slot />
</body>
</html>
```

### 2. Access game state in any component

```astro
---
// src/components/PlayerInventory.astro
---

<div id="player-inventory">
  <h3>Your Ligands</h3>
  <div id="ligand-list"></div>
</div>

<script>
  // Listen for game state updates
  window.addEventListener('game-state-loaded', (event) => {
    const gameState = event.detail;
    const playerId = window.wsClient.playerId;

    // Find your player data
    const player = Object.values(gameState.players).find(
      p => p.id === playerId
    );

    if (player) {
      displayLigands(player.ligands);
    }
  });

  // Listen for new ligand collections
  window.wsClient.on('ligandCollected', ({ playerId, ligand }) => {
    if (playerId === window.wsClient.playerId) {
      addLigandToDisplay(ligand);
    }
  });

  function displayLigands(ligands) {
    const list = document.getElementById('ligand-list');
    list.innerHTML = ligands.map(l => `
      <div class="ligand-card">
        <h4>${l.name}</h4>
        <p>${l.formula}</p>
      </div>
    `).join('');
  }

  function addLigandToDisplay(ligand) {
    const list = document.getElementById('ligand-list');
    const card = document.createElement('div');
    card.className = 'ligand-card';
    card.innerHTML = `
      <h4>${ligand.name}</h4>
      <p>${ligand.formula}</p>
    `;
    list.appendChild(card);
  }
</script>
```

### 3. Dice roll button

```astro
<button id="roll-dice-btn" class="btn btn-primary">
  🎲 Roll Dice
</button>

<script>
  const btn = document.getElementById('roll-dice-btn');

  btn.addEventListener('click', () => {
    // Check if it's your turn
    window.wsClient.on('init', (gameState) => {
      const isYourTurn = gameState.currentTurn === window.wsClient.playerId;

      if (!isYourTurn) {
        alert('Not your turn!');
        return;
      }

      // Roll dice
      window.wsClient.rollDice();

      // Disable button until result
      btn.disabled = true;
    });
  });

  // Listen for dice result
  window.wsClient.on('diceRolled', ({ playerId, value }) => {
    console.log(`🎲 ${playerId} rolled ${value}`);

    // Show dice animation
    alert(`You rolled ${value}!`);

    // Re-enable button
    btn.disabled = false;
  });
</script>
```

### 4. Turn indicator

```astro
<div id="turn-indicator" class="fixed top-4 left-4 bg-white p-4 rounded shadow">
  <p class="text-sm text-gray-600">Current Turn:</p>
  <p id="current-player" class="text-xl font-bold">Waiting...</p>
</div>

<script>
  const playerEl = document.getElementById('current-player');

  // Listen for turn changes
  window.wsClient.on('turnChanged', ({ currentTurn }) => {
    const isYourTurn = currentTurn === window.wsClient.playerId;

    if (isYourTurn) {
      playerEl.textContent = 'YOUR TURN!';
      playerEl.className = 'text-xl font-bold text-green-600';
    } else {
      playerEl.textContent = currentTurn;
      playerEl.className = 'text-xl font-bold text-gray-600';
    }
  });

  // Initial state
  window.wsClient.on('init', (gameState) => {
    const isYourTurn = gameState.currentTurn === window.wsClient.playerId;
    playerEl.textContent = isYourTurn ? 'YOUR TURN!' : gameState.currentTurn;
  });
</script>
```

### 5. Player list (real-time)

```astro
<div id="player-list" class="bg-white p-4 rounded shadow">
  <h3 class="font-bold mb-2">Players</h3>
  <ul id="players"></ul>
</div>

<script>
  const playersEl = document.getElementById('players');

  function renderPlayers(players) {
    playersEl.innerHTML = Object.values(players).map(player => `
      <li class="flex items-center gap-2 py-2">
        <div class="w-3 h-3 rounded-full bg-${player.color}-500"></div>
        <span>${player.name}</span>
        <span class="text-sm text-gray-500">${player.points} pts</span>
        ${!player.isActive ? '<span class="text-xs text-red-500">(Offline)</span>' : ''}
      </li>
    `).join('');
  }

  // Initial load
  window.wsClient.on('init', (gameState) => {
    renderPlayers(gameState.players);
  });

  // Player joined
  window.wsClient.on('playerJoined', ({ playerId, playerName }) => {
    console.log(`${playerName} joined!`);
    // Re-fetch state or update manually
  });

  // Player left
  window.wsClient.on('playerLeft', ({ playerId }) => {
    console.log(`${playerId} left`);
    // Re-fetch state or update manually
  });
</script>
```

---

## Complete Integration Example

```astro
---
// src/pages/game.astro
import GameLayout from '../layouts/GameLayout.astro';
---

<GameLayout>
  <div class="game-container">
    <!-- Board -->
    <div id="game-board">
      <!-- Your existing board component -->
    </div>

    <!-- Sidebar -->
    <div id="game-sidebar" class="w-80 bg-white p-4">
      <!-- Turn indicator -->
      <div id="turn-box" class="mb-4 p-4 bg-blue-50 rounded">
        <p class="text-sm">Current Turn:</p>
        <p id="current-turn" class="text-2xl font-bold">-</p>
      </div>

      <!-- Players -->
      <div id="players-box" class="mb-4">
        <h3 class="font-bold mb-2">Players</h3>
        <ul id="player-list"></ul>
      </div>

      <!-- Your inventory -->
      <div id="inventory-box">
        <h3 class="font-bold mb-2">Your Ligands</h3>
        <div id="ligand-display"></div>
      </div>

      <!-- Actions -->
      <div id="actions-box" class="mt-4 space-y-2">
        <button id="roll-btn" class="w-full btn btn-primary">🎲 Roll Dice</button>
        <button id="end-turn-btn" class="w-full btn btn-secondary">End Turn</button>
      </div>
    </div>
  </div>

  <script>
    // Initialize game UI
    function initGameUI() {
      const rollBtn = document.getElementById('roll-btn');
      const endTurnBtn = document.getElementById('end-turn-btn');
      const currentTurnEl = document.getElementById('current-turn');
      const playerListEl = document.getElementById('player-list');
      const ligandDisplayEl = document.getElementById('ligand-display');

      // State
      let myPlayerId = null;
      let gameState = null;

      // Initial state load
      window.wsClient.on('init', (state) => {
        myPlayerId = window.wsClient.playerId;
        gameState = state;

        updateUI();
      });

      // Turn changed
      window.wsClient.on('turnChanged', ({ currentTurn }) => {
        gameState.currentTurn = currentTurn;
        updateUI();
      });

      // Dice rolled
      window.wsClient.on('diceRolled', ({ playerId, value }) => {
        alert(`${playerId === myPlayerId ? 'You' : 'Player'} rolled ${value}!`);
      });

      // Ligand collected
      window.wsClient.on('ligandCollected', ({ playerId, ligand }) => {
        if (playerId === myPlayerId) {
          // Update your display
          const player = gameState.players[playerId];
          player.ligands.push(ligand);
          updateLigands();
        }
      });

      // Roll dice
      rollBtn.addEventListener('click', () => {
        if (gameState.currentTurn !== myPlayerId) {
          alert('Not your turn!');
          return;
        }

        window.wsClient.rollDice();
      });

      // End turn
      endTurnBtn.addEventListener('click', () => {
        if (gameState.currentTurn !== myPlayerId) {
          alert('Not your turn!');
          return;
        }

        window.wsClient.nextTurn();
      });

      // Update UI helper
      function updateUI() {
        // Turn indicator
        const isMyTurn = gameState.currentTurn === myPlayerId;
        currentTurnEl.textContent = isMyTurn ? 'YOUR TURN' : 'Waiting...';
        currentTurnEl.className = isMyTurn ? 'text-2xl font-bold text-green-600' : 'text-2xl font-bold text-gray-500';

        // Enable/disable buttons
        rollBtn.disabled = !isMyTurn;
        endTurnBtn.disabled = !isMyTurn;

        // Player list
        updatePlayers();

        // Ligands
        updateLigands();
      }

      function updatePlayers() {
        playerListEl.innerHTML = Object.values(gameState.players).map(p => `
          <li class="py-2 flex justify-between">
            <span>${p.name} ${p.id === myPlayerId ? '(You)' : ''}</span>
            <span>${p.points} pts</span>
          </li>
        `).join('');
      }

      function updateLigands() {
        const player = gameState.players[myPlayerId];
        if (!player) return;

        ligandDisplayEl.innerHTML = player.ligands.map(l => `
          <div class="bg-green-100 p-2 rounded mb-2">
            <p class="font-bold">${l.name}</p>
            <p class="text-xs">${l.formula}</p>
          </div>
        `).join('');
      }
    }

    // Wait for DOMContentLoaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initGameUI);
    } else {
      initGameUI();
    }
  </script>
</GameLayout>
```

---

## URL Parameters for Testing

Open game with different players:

- **Player 1**: `http://localhost:8788/game?room=test123&player=Hazim&color=red`
- **Player 2**: `http://localhost:8788/game?room=test123&player=Ali&color=blue`
- **Player 3**: `http://localhost:8788/game?room=test123&player=Sara&color=yellow`
- **Player 4**: `http://localhost:8788/game?room=test123&player=Fatimah&color=green`

All players in `room=test123` will see each other and sync in real-time!

---

## Testing Checklist

- [ ] Open 2 browser windows with different player names
- [ ] Both show in player list
- [ ] Player 1 rolls dice → Player 2 sees result
- [ ] Player 1 collects ligand → Player 2 sees update
- [ ] Player 1 ends turn → Player 2's turn activates
- [ ] Close Player 1 → Player 2 sees "Offline" status
- [ ] Reload Player 1 → Reconnects and syncs state

---

## Performance Tips

1. **Batch UI updates**: Don't update DOM on every event, use `requestAnimationFrame()`
2. **Debounce frequent events**: Use debounce for position updates
3. **Lazy load game assets**: Load images/sounds on demand
4. **Optimize re-renders**: Only update changed parts of UI

---

**Done! WebSocket infrastructure fully integrated.** 🚀
