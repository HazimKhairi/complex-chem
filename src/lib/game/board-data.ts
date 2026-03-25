// Board tile mappings for 15x15 grid
// Based on the Complex Chem Quest board layout

import type { BoardTile } from "./types";

// Map [row, col] coordinates to tile data
// Row 0 = top, Col 0 = left
export const BOARD_TILES: Record<string, BoardTile> = {
  // Starting positions
  "0,0": { position: 0, type: "start", row: 0, col: 0 }, // Green start
  "0,14": { position: 15, type: "start", row: 0, col: 14 }, // Yellow start
  "14,14": { position: 30, type: "start", row: 14, col: 14 }, // Blue start
  "14,0": { position: 45, type: "start", row: 14, col: 0 }, // Red start

  // Ligand tiles (examples - need to map all 30)
  "0,4": { position: 4, type: "ligand", ligandId: "py", row: 0, col: 4 },
  "0,7": { position: 7, type: "ligand", ligandId: "nh3", row: 0, col: 7 },
  "3,7": { position: 10, type: "ligand", ligandId: "pph3", row: 3, col: 7 },
  "4,7": { position: 11, type: "ligand", ligandId: "ox", row: 4, col: 7 },
  "4,9": { position: 13, type: "ligand", ligandId: "cl", row: 4, col: 9 },
  "5,6": { position: 14, type: "ligand", ligandId: "bipy", row: 5, col: 6 },

  // Question tiles (examples - need to map all)
  "2,7": { position: 9, type: "question", difficulty: "easy", row: 2, col: 7 },
  "6,9": { position: 16, type: "question", difficulty: "medium", row: 6, col: 9 },
  "8,11": { position: 22, type: "question", difficulty: "hard", row: 8, col: 11 },

  // Fate card tiles (examples - red triangles)
  "6,1": { position: 17, type: "fate", row: 6, col: 1 },
  "2,5": { position: 8, type: "fate", row: 2, col: 5 },
  "10,7": { position: 26, type: "fate", row: 10, col: 7 },
};

// Get tile data by row/col
export function getTileAt(row: number, col: number): BoardTile | null {
  const key = `${row},${col}`;
  return BOARD_TILES[key] || null;
}

// Get tile data by position
export function getTileByPosition(position: number): BoardTile | null {
  return Object.values(BOARD_TILES).find((tile) => tile.position === position) || null;
}

// Board path for movement (clockwise around 15x15 grid)
// This defines the sequence of cells players move through
export const BOARD_PATH = [
  // Top row (left to right)
  [0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7], [0, 8], [0, 9], [0, 10], [0, 11], [0, 12], [0, 13], [0, 14],
  // Right column (top to bottom)
  [1, 14], [2, 14], [3, 14], [4, 14], [5, 14], [6, 14], [7, 14], [8, 14], [9, 14], [10, 14], [11, 14], [12, 14], [13, 14], [14, 14],
  // Bottom row (right to left)
  [14, 13], [14, 12], [14, 11], [14, 10], [14, 9], [14, 8], [14, 7], [14, 6], [14, 5], [14, 4], [14, 3], [14, 2], [14, 1], [14, 0],
  // Left column (bottom to top)
  [13, 0], [12, 0], [11, 0], [10, 0], [9, 0], [8, 0], [7, 0], [6, 0], [5, 0], [4, 0], [3, 0], [2, 0], [1, 0],
];

// Total tiles in one round
export const TOTAL_TILES = BOARD_PATH.length; // 60 tiles

// Get coordinates for a position
export function getCoordinatesForPosition(position: number): [number, number] {
  const normalizedPos = position % TOTAL_TILES;
  return BOARD_PATH[normalizedPos];
}
