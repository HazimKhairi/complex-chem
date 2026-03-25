/**
 * GameRoom Durable Object
 * Manages game state and WebSocket connections for a single game room
 */

export interface GameState {
  roomId: string;
  players: {
    [playerId: string]: {
      id: string;
      name: string;
      color: string;
      position: number;
      ligands: any[];
      points: number;
      isActive: boolean;
    };
  };
  currentTurn: string; // Player ID
  turnOrder: string[];
  gamePhase: 'waiting' | 'level1' | 'level2' | 'finished';
  collectedLigandIds: string[];
  startedAt?: number;
  finishedAt?: number;
}

interface WebSocketMessage {
  type: string;
  payload: any;
  playerId?: string;
  timestamp: number;
}

export class GameRoom implements DurableObject {
  private state: DurableObjectState;
  private sessions: Map<WebSocket, string>; // WebSocket -> playerId
  private gameState: GameState;

  constructor(state: DurableObjectState, env: any) {
    this.state = state;
    this.sessions = new Map();

    // Initialize default game state
    this.gameState = {
      roomId: '',
      players: {},
      currentTurn: '',
      turnOrder: [],
      gamePhase: 'waiting',
      collectedLigandIds: []
    };
  }

  async fetch(request: Request): Promise<Response> {
    // Handle WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      await this.handleSession(server, request);

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }

    // Handle HTTP requests (state queries, etc.)
    const url = new URL(request.url);

    if (url.pathname === '/state') {
      return new Response(JSON.stringify(this.gameState), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not found', { status: 404 });
  }

  async handleSession(webSocket: WebSocket, request: Request): Promise<void> {
    // Accept the WebSocket connection
    webSocket.accept();

    // Extract player info from query params or headers
    const url = new URL(request.url);
    const playerId = url.searchParams.get('playerId') || crypto.randomUUID();
    const playerName = url.searchParams.get('playerName') || `Player ${playerId.slice(0, 4)}`;
    const playerColor = url.searchParams.get('color') || 'red';

    // Store session
    this.sessions.set(webSocket, playerId);

    // Load game state from storage if not loaded
    if (!this.gameState.roomId) {
      const stored = await this.state.storage.get<GameState>('gameState');
      if (stored) {
        this.gameState = stored;
      } else {
        this.gameState.roomId = this.state.id.toString();
      }
    }

    // Add player if not exists
    if (!this.gameState.players[playerId]) {
      this.gameState.players[playerId] = {
        id: playerId,
        name: playerName,
        color: playerColor,
        position: 0,
        ligands: [],
        points: 0,
        isActive: true,
      };
      this.gameState.turnOrder.push(playerId);

      // Set first player as current turn
      if (!this.gameState.currentTurn) {
        this.gameState.currentTurn = playerId;
      }

      await this.saveState();
    }

    // Send initial state to new player
    this.send(webSocket, {
      type: 'INIT',
      payload: {
        playerId,
        gameState: this.gameState,
      },
      timestamp: Date.now(),
    });

    // Broadcast player joined
    this.broadcast({
      type: 'PLAYER_JOINED',
      payload: { playerId, playerName },
      timestamp: Date.now(),
    });

    // Handle incoming messages
    webSocket.addEventListener('message', async (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data as string);
        await this.handleMessage(webSocket, message);
      } catch (error) {
        console.error('Error handling message:', error);
        this.send(webSocket, {
          type: 'ERROR',
          payload: { message: 'Invalid message format' },
          timestamp: Date.now(),
        });
      }
    });

    // Handle disconnection
    webSocket.addEventListener('close', () => {
      this.sessions.delete(webSocket);

      // Mark player as inactive
      if (this.gameState.players[playerId]) {
        this.gameState.players[playerId].isActive = false;
        this.saveState();
      }

      this.broadcast({
        type: 'PLAYER_LEFT',
        payload: { playerId },
        timestamp: Date.now(),
      });
    });
  }

  async handleMessage(webSocket: WebSocket, message: WebSocketMessage): Promise<void> {
    const playerId = this.sessions.get(webSocket);
    if (!playerId) return;

    switch (message.type) {
      case 'DICE_ROLL':
        await this.handleDiceRoll(playerId, message.payload);
        break;

      case 'MOVE_PIECE':
        await this.handleMovePiece(playerId, message.payload);
        break;

      case 'COLLECT_LIGAND':
        await this.handleCollectLigand(playerId, message.payload);
        break;

      case 'ANSWER_QUESTION':
        await this.handleAnswerQuestion(playerId, message.payload);
        break;

      case 'DRAW_FATE':
        await this.handleDrawFate(playerId, message.payload);
        break;

      case 'NEXT_TURN':
        await this.handleNextTurn(playerId);
        break;

      case 'START_GAME':
        await this.handleStartGame(playerId);
        break;

      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  async handleDiceRoll(playerId: string, payload: any): Promise<void> {
    // Validate it's player's turn
    if (this.gameState.currentTurn !== playerId) {
      return;
    }

    const diceValue = Math.floor(Math.random() * 6) + 1;

    this.broadcast({
      type: 'DICE_ROLLED',
      payload: { playerId, value: diceValue },
      timestamp: Date.now(),
    });
  }

  async handleMovePiece(playerId: string, payload: { newPosition: number }): Promise<void> {
    const player = this.gameState.players[playerId];
    if (!player) return;

    player.position = payload.newPosition;
    await this.saveState();

    this.broadcast({
      type: 'PIECE_MOVED',
      payload: { playerId, position: payload.newPosition },
      timestamp: Date.now(),
    });
  }

  async handleCollectLigand(playerId: string, payload: { ligandId: string; ligandData: any }): Promise<void> {
    const player = this.gameState.players[playerId];
    if (!player) return;

    // Add ligand to player inventory
    player.ligands.push(payload.ligandData);
    this.gameState.collectedLigandIds.push(payload.ligandId);
    await this.saveState();

    this.broadcast({
      type: 'LIGAND_COLLECTED',
      payload: { playerId, ligand: payload.ligandData },
      timestamp: Date.now(),
    });
  }

  async handleAnswerQuestion(playerId: string, payload: { isCorrect: boolean; points: number }): Promise<void> {
    const player = this.gameState.players[playerId];
    if (!player) return;

    if (payload.isCorrect) {
      player.points += payload.points;
      await this.saveState();
    }

    this.broadcast({
      type: 'QUESTION_ANSWERED',
      payload: { playerId, isCorrect: payload.isCorrect, points: payload.points, totalPoints: player.points },
      timestamp: Date.now(),
    });
  }

  async handleDrawFate(playerId: string, payload: { fateCard: any }): Promise<void> {
    const player = this.gameState.players[playerId];
    if (!player) return;

    // Apply fate effects
    if (payload.fateCard.effect === 'points') {
      player.points += payload.fateCard.points || 0;
      await this.saveState();
    }

    this.broadcast({
      type: 'FATE_DRAWN',
      payload: { playerId, fateCard: payload.fateCard },
      timestamp: Date.now(),
    });
  }

  async handleNextTurn(playerId: string): Promise<void> {
    // Find next player in turn order
    const currentIndex = this.gameState.turnOrder.indexOf(this.gameState.currentTurn);
    const nextIndex = (currentIndex + 1) % this.gameState.turnOrder.length;
    const nextPlayerId = this.gameState.turnOrder[nextIndex];

    this.gameState.currentTurn = nextPlayerId;
    await this.saveState();

    this.broadcast({
      type: 'TURN_CHANGED',
      payload: { currentTurn: nextPlayerId },
      timestamp: Date.now(),
    });
  }

  async handleStartGame(playerId: string): Promise<void> {
    this.gameState.gamePhase = 'level1';
    this.gameState.startedAt = Date.now();
    await this.saveState();

    this.broadcast({
      type: 'GAME_STARTED',
      payload: { startedAt: this.gameState.startedAt },
      timestamp: Date.now(),
    });
  }

  private send(webSocket: WebSocket, message: WebSocketMessage): void {
    try {
      webSocket.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  private broadcast(message: WebSocketMessage, except?: WebSocket): void {
    const messageStr = JSON.stringify(message);

    for (const [ws] of this.sessions) {
      if (ws !== except) {
        try {
          ws.send(messageStr);
        } catch (error) {
          console.error('Error broadcasting:', error);
        }
      }
    }
  }

  private async saveState(): Promise<void> {
    await this.state.storage.put('gameState', this.gameState);
  }
}
