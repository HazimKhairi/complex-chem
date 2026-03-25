// Game type definitions for Complex Chem Quest

import type { Ligand } from "../data/ligands";
import type { FateCard } from "../data/fate-cards";
import type { QuestionCardImage } from "../data/question-cards-image";

export type PlayerColor = "red" | "blue" | "yellow" | "green";

export type TileType =
  | "empty"
  | "ligand"
  | "question"
  | "fate"
  | "start"
  | "complex";

export interface BoardTile {
  position: number; // 0-59 for full board path
  type: TileType;
  ligandId?: string; // ID of ligand if type is "ligand"
  difficulty?: "easy" | "medium" | "hard"; // For question tiles
  row: number;
  col: number;
}

export interface Player {
  id: number;
  name: string;
  color: PlayerColor;
  position: number; // Current position on board (0-59)
  inventory: Ligand[];
  fateCards: FateCard[];
  points: number;
  isActive: boolean;
  hasCompletedRound: boolean;
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  diceValue: number | null;
  isRolling: boolean;
  level: 1 | 2;
  winner: Player | null;
}

export interface TileInteraction {
  type: TileType;
  ligand?: Ligand;
  question?: QuestionCardImage;
  fate?: FateCard;
}
