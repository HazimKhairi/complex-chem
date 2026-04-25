// Game state management for Complex Chem Quest Level 1

import type { GameState, Player, PlayerColor, TileInteraction } from "./types";
import { getTileByPosition } from "./board-data";
import { LIGANDS } from "../data/ligands";
import { FATE_CARDS } from "../data/fate-cards";
import { QUESTION_CARDS_IMAGE } from "../data/question-cards-image";

const GAME_STATE_KEY = "complex-chem-game-state";

export function initializeGame(playerCount: 2 | 3 | 4, playerNames: string[]): GameState {
  const colors: PlayerColor[] = ["green", "yellow", "red", "blue"];

  const players: Player[] = [];
  for (let i = 0; i < playerCount; i++) {
    players.push({
      id: i + 1,
      name: playerNames[i] || `Player ${i + 1}`,
      color: colors[i],
      position: i * 15, // Starting positions: 0, 15, 30, 45
      inventory: [],
      fateCards: [],
      points: 0,
      isActive: i === 0, // First player starts
      hasCompletedRound: false,
    });
  }

  const gameState: GameState = {
    players,
    currentPlayerIndex: 0,
    diceValue: null,
    isRolling: false,
    level: 1,
    winner: null,
  };

  saveGameState(gameState);
  return gameState;
}

export function loadGameState(): GameState | null {
  const stored = sessionStorage.getItem(GAME_STATE_KEY);
  return stored ? JSON.parse(stored) : null;
}

export function saveGameState(state: GameState): void {
  sessionStorage.setItem(GAME_STATE_KEY, JSON.stringify(state));
}

export function rollDice(state: GameState): number {
  const diceValue = Math.floor(Math.random() * 6) + 1;
  state.diceValue = diceValue;
  state.isRolling = true;
  saveGameState(state);
  return diceValue;
}

export function movePlayer(state: GameState, steps: number): TileInteraction | null {
  const currentPlayer = state.players[state.currentPlayerIndex];
  const newPosition = currentPlayer.position + steps;

  // Check if completed round
  if (newPosition >= currentPlayer.position + 60 && !currentPlayer.hasCompletedRound) {
    currentPlayer.hasCompletedRound = true;
  }

  currentPlayer.position = newPosition % 60;

  // Get tile interaction
  const tile = getTileByPosition(currentPlayer.position);
  let interaction: TileInteraction | null = null;

  if (tile) {
    switch (tile.type) {
      case "ligand":
        if (tile.ligandId) {
          const ligand = LIGANDS.find(l => l.id === tile.ligandId);
          if (ligand) {
            currentPlayer.inventory.push(ligand);
            interaction = { type: "ligand", ligand };
          }
        }
        break;

      case "question":
        // Get random question of appropriate difficulty
        const questions = QUESTION_CARDS_IMAGE.filter(q => q.difficulty === tile.difficulty);
        const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
        interaction = { type: "question", question: randomQuestion };
        break;

      case "fate":
        // Get random fate card
        const randomFate = FATE_CARDS[Math.floor(Math.random() * FATE_CARDS.length)];
        currentPlayer.fateCards.push(randomFate);
        interaction = { type: "fate", fate: randomFate };
        break;
    }
  }

  saveGameState(state);
  return interaction;
}

export function addPoints(state: GameState, points: number): void {
  state.players[state.currentPlayerIndex].points += points;
  saveGameState(state);
}

export function nextTurn(state: GameState): void {
  // Move to next player
  state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
  state.diceValue = null;
  state.isRolling = false;

  // Update active status
  state.players.forEach((p, i) => {
    p.isActive = i === state.currentPlayerIndex;
  });

  saveGameState(state);
}

export function checkLevelCompletion(state: GameState): boolean {
  // Level 1 complete when all players have completed one round
  return state.players.every(p => p.hasCompletedRound);
}

export function calculateFinalScore(state: GameState): void {
  state.players.forEach(player => {
    // Add fate card bonuses/penalties
    player.fateCards.forEach(card => {
      if (card.value) {
        player.points += card.value;
      }
    });
  });

  // Find winner
  const sortedPlayers = [...state.players].sort((a, b) => b.points - a.points);
  state.winner = sortedPlayers[0];

  saveGameState(state);
}
