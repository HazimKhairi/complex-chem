# WebSocket Setup Guide

## Architecture Overview

**Stack**: Astro 5.5.5 + Cloudflare Durable Objects + WebSocket

```
┌─────────────────┐
│  Browser Client │
│  (wsClient.js)  │
└────────┬────────┘
         │ WebSocket
         ↓
┌─────────────────────┐
│ Cloudflare Worker   │
│ (Astro SSR Endpoint)│
└────────┬────────────┘
         │
         ↓
┌─────────────────────────┐
│ Durable Object (GameRoom)│
│ - Game state persistence│
│ - Player synchronization│
│ - Event broadcasting    │
└─────────────────────────┘
```

---

## Files Created

### 1. **wrangler.toml** (Cloudflare config)
- Defines Durable Object binding `GAME_ROOM`
- Production routes configuration
- Compatibility date

### 2. **src/durable-objects/GameRoom.ts** (Backend)
- Manages game room state
- Handles WebSocket connections
- Broadcasts events to all players
- Persists state to Durable Object storage

### 3. **public/scripts/websocket-client.js** (Frontend)
- WebSocket client singleton (`window.wsClient`)
- Auto-reconnect with exponential backoff
- Event-driven architecture
- Message queue for offline mode

### 4. **src/pages/api/ws/game/[roomId].ts** (API endpoint)
- WebSocket upgrade handler
- Routes connections to Durable Objects

### 5. **Updated game-mechanics.js**
- Integrated with WebSocket client
- Falls back to sessionStorage if offline
- Syncs ligand collection, questions, fate cards

---

## Installation

### 1. Install Wrangler CLI
```bash
npm install -g wrangler
# or
pnpm add -g wrangler
```

### 2. Login to Cloudflare
```bash
wrangler login
```

### 3. Install Dependencies
```bash
npm install
```

---

## Development

### Option 1: Local Development (Astro dev server)
```bash
npm run dev
```
**Note**: WebSocket will NOT work in dev mode. Use Option 2 for testing WebSocket.

### Option 2: Cloudflare Dev (with Durable Objects)
```bash
# Terminal 1: Build Astro
npm run build

# Terminal 2: Run Wrangler dev server
npm run dev:wrangler
```

Now visit: `http://localhost:8788`

---

## Usage

### Client-Side Integration

**Step 1**: Include WebSocket client in your page
```html
<script src="/scripts/websocket-client.js"></script>
<script src="/scripts/game-mechanics.js"></script>
```

**Step 2**: Connect to game room
```javascript
// Get room ID (from URL or generate)
const roomId = new URLSearchParams(window.location.search).get('room') || 'default-room';
const playerName = 'Hazim';
const playerColor = 'red';

// Connect
window.wsClient.connect(roomId, playerName, playerColor);

// Listen for connection
window.wsClient.on('connected', () => {
  console.log('Connected to game!');
});

// Listen for game state
window.wsClient.on('init', (gameState) => {
  console.log('Initial state:', gameState);
});
```

**Step 3**: Send game actions
```javascript
// Roll dice
window.wsClient.rollDice();

// Move piece
window.wsClient.movePiece(15);

// Collect ligand (integrated in game-mechanics.js)
window.GameMechanics.collectLigand(1, 'H2O');

// Next turn
window.wsClient.nextTurn();
```

**Step 4**: Listen to events
```javascript
// Dice rolled
window.wsClient.on('diceRolled', ({ playerId, value }) => {
  console.log(`Player ${playerId} rolled ${value}`);
});

// Ligand collected
window.wsClient.on('ligandCollected', ({ playerId, ligand }) => {
  console.log(`Player ${playerId} collected ${ligand.name}`);
});

// Turn changed
window.wsClient.on('turnChanged', ({ currentTurn }) => {
  console.log(`Now it's ${currentTurn}'s turn`);
});
```

---

## Events Reference

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `DICE_ROLL` | `{}` | Roll dice for current player |
| `MOVE_PIECE` | `{ newPosition: number }` | Move piece to position |
| `COLLECT_LIGAND` | `{ ligandId, ligandData }` | Collect ligand |
| `ANSWER_QUESTION` | `{ isCorrect, points }` | Answer question |
| `DRAW_FATE` | `{ fateCard }` | Draw fate card |
| `NEXT_TURN` | `{}` | End turn, pass to next player |
| `START_GAME` | `{}` | Start game |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `INIT` | `{ playerId, gameState }` | Initial state on connect |
| `PLAYER_JOINED` | `{ playerId, playerName }` | New player joined |
| `PLAYER_LEFT` | `{ playerId }` | Player disconnected |
| `DICE_ROLLED` | `{ playerId, value }` | Dice result |
| `PIECE_MOVED` | `{ playerId, position }` | Piece moved |
| `LIGAND_COLLECTED` | `{ playerId, ligand }` | Ligand collected |
| `QUESTION_ANSWERED` | `{ playerId, isCorrect, points }` | Question answered |
| `FATE_DRAWN` | `{ playerId, fateCard }` | Fate card drawn |
| `TURN_CHANGED` | `{ currentTurn }` | Turn changed |
| `GAME_STARTED` | `{ startedAt }` | Game started |

---

## Deployment

### Deploy to Cloudflare Pages
```bash
npm run deploy
```

### Environment Variables (optional)
Create `.dev.vars` for local development:
```
# Add any secret keys here
```

---

## Testing

### Test WebSocket Connection
```javascript
// In browser console
window.wsClient.connect('test-room', 'TestPlayer', 'red');

// Wait for connection
window.wsClient.on('connected', () => {
  console.log('✅ Connected!');

  // Test dice roll
  window.wsClient.rollDice();
});

// Listen for dice roll
window.wsClient.on('diceRolled', (data) => {
  console.log('🎲 Rolled:', data.value);
});
```

### Test Game Mechanics
```javascript
// Collect ligand (synced via WebSocket)
window.GameMechanics.collectLigand(1);

// Check if synced
window.wsClient.on('ligandCollected', (data) => {
  console.log('✅ Ligand synced:', data.ligand.name);
});
```

---

## Troubleshooting

### WebSocket not connecting?
1. Check you're using `npm run dev:wrangler` (not `npm run dev`)
2. Verify port 8788 is accessible
3. Check browser console for errors

### Durable Object not found?
1. Ensure `wrangler.toml` has correct binding
2. Run `wrangler pages dev` with `--binding` flag
3. Check Cloudflare dashboard for DO creation

### State not syncing?
1. Check `window.wsClient.isConnected` is `true`
2. Verify messages in Network tab (WS filter)
3. Check server logs in wrangler terminal

---

## Next Steps

1. ✅ WebSocket infrastructure complete
2. ⏭️ Add player avatars with real-time updates
3. ⏭️ Implement turn timer
4. ⏭️ Add chat feature
5. ⏭️ Implement spectator mode
6. ⏭️ Add game replay functionality

---

## Production Checklist

- [ ] Set up custom domain in Cloudflare Pages
- [ ] Configure CORS headers
- [ ] Add rate limiting
- [ ] Implement authentication (optional)
- [ ] Set up monitoring/analytics
- [ ] Test with 4 concurrent players
- [ ] Load test Durable Objects
- [ ] Implement graceful degradation (offline mode)

---

## Resources

- [Cloudflare Durable Objects Docs](https://developers.cloudflare.com/durable-objects/)
- [Astro Cloudflare Adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
