/**
 * WebSocket Client Manager for Complex Chem Quest
 * Handles real-time game synchronization
 */

class WebSocketClient {
  constructor() {
    this.ws = null;
    this.playerId = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000;
    this.listeners = new Map();
    this.messageQueue = [];
    this.isConnected = false;
  }

  /**
   * Connect to WebSocket server
   * @param {string} roomId - Game room ID
   * @param {string} playerName - Player name
   * @param {string} color - Player color (red, blue, yellow, green)
   */
  connect(roomId, playerName, color) {
    // Get player ID from session or generate new one
    this.playerId = sessionStorage.getItem('playerId') || this.generatePlayerId();
    sessionStorage.setItem('playerId', this.playerId);

    // Construct WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/game/${roomId}?playerId=${this.playerId}&playerName=${encodeURIComponent(playerName)}&color=${color}`;

    console.log('Connecting to WebSocket:', wsUrl);

    try {
      this.ws = new WebSocket(wsUrl);
      this.setupEventHandlers();
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.scheduleReconnect(roomId, playerName, color);
    }
  }

  setupEventHandlers() {
    this.ws.addEventListener('open', () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;

      // Flush message queue
      while (this.messageQueue.length > 0) {
        const msg = this.messageQueue.shift();
        this.send(msg.type, msg.payload);
      }

      this.emit('connected');
    });

    this.ws.addEventListener('message', (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('Received:', message);
        this.handleMessage(message);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });

    this.ws.addEventListener('close', (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      this.isConnected = false;
      this.emit('disconnected');

      // Attempt reconnect if not intentional close
      if (event.code !== 1000) {
        this.scheduleReconnect();
      }
    });

    this.ws.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    });
  }

  handleMessage(message) {
    const { type, payload, timestamp } = message;

    switch (type) {
      case 'INIT':
        this.playerId = payload.playerId;
        this.emit('init', payload.gameState);
        break;

      case 'PLAYER_JOINED':
        this.emit('playerJoined', payload);
        break;

      case 'PLAYER_LEFT':
        this.emit('playerLeft', payload);
        break;

      case 'DICE_ROLLED':
        this.emit('diceRolled', payload);
        break;

      case 'PIECE_MOVED':
        this.emit('pieceMoved', payload);
        break;

      case 'LIGAND_COLLECTED':
        this.emit('ligandCollected', payload);
        break;

      case 'QUESTION_ANSWERED':
        this.emit('questionAnswered', payload);
        break;

      case 'FATE_DRAWN':
        this.emit('fateDrawn', payload);
        break;

      case 'TURN_CHANGED':
        this.emit('turnChanged', payload);
        break;

      case 'GAME_STARTED':
        this.emit('gameStarted', payload);
        break;

      case 'ERROR':
        console.error('Server error:', payload);
        this.emit('serverError', payload);
        break;

      default:
        console.warn('Unknown message type:', type);
    }
  }

  /**
   * Send message to server
   * @param {string} type - Message type
   * @param {any} payload - Message payload
   */
  send(type, payload = {}) {
    const message = {
      type,
      payload,
      playerId: this.playerId,
      timestamp: Date.now(),
    };

    if (!this.isConnected) {
      console.warn('Not connected, queuing message:', type);
      this.messageQueue.push(message);
      return;
    }

    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error sending message:', error);
      this.messageQueue.push(message);
    }
  }

  /**
   * Roll dice
   */
  rollDice() {
    this.send('DICE_ROLL');
  }

  /**
   * Move piece to new position
   * @param {number} newPosition - New position on board
   */
  movePiece(newPosition) {
    this.send('MOVE_PIECE', { newPosition });
  }

  /**
   * Collect ligand
   * @param {string} ligandId - Ligand ID
   * @param {any} ligandData - Ligand data
   */
  collectLigand(ligandId, ligandData) {
    this.send('COLLECT_LIGAND', { ligandId, ligandData });
  }

  /**
   * Answer question
   * @param {boolean} isCorrect - Whether answer is correct
   * @param {number} points - Points awarded
   */
  answerQuestion(isCorrect, points) {
    this.send('ANSWER_QUESTION', { isCorrect, points });
  }

  /**
   * Draw fate card
   * @param {any} fateCard - Fate card data
   */
  drawFate(fateCard) {
    this.send('DRAW_FATE', { fateCard });
  }

  /**
   * End turn and pass to next player
   */
  nextTurn() {
    this.send('NEXT_TURN');
  }

  /**
   * Start game
   */
  startGame() {
    this.send('START_GAME');
  }

  /**
   * Register event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  off(event, callback) {
    if (!this.listeners.has(event)) return;

    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  /**
   * Emit event to listeners
   * @param {string} event - Event name
   * @param {any} data - Event data
   */
  emit(event, data) {
    if (!this.listeners.has(event)) return;

    const callbacks = this.listeners.get(event);
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }

  /**
   * Schedule reconnection attempt
   */
  scheduleReconnect(roomId, playerName, color) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.emit('reconnectFailed');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      if (roomId && playerName && color) {
        this.connect(roomId, playerName, color);
      }
    }, delay);
  }

  /**
   * Generate unique player ID
   */
  generatePlayerId() {
    return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Close connection
   */
  disconnect() {
    if (this.ws) {
      this.isConnected = false;
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }
}

// Export as global singleton
if (typeof window !== 'undefined') {
  window.WebSocketClient = WebSocketClient;
  window.wsClient = new WebSocketClient();
}
