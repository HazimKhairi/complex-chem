/**
 * Board Cell to Complex Image Mapping
 * Maps specific board cells to their corresponding complex molecular images
 * Based on grid analysis of reference board design
 */

export interface BoardCellComplex {
  cellId: string; // Cell ID like 'r10', 'b5', 'y20', 'g15'
  imagePath: string; // Path to complex image
  bgColor: string; // Expected background color
  label?: string; // Optional text label
}

/**
 * Complex images in board cells
 * Mapped from grid positions to actual cell IDs
 */
export const BOARD_COMPLEX_CELLS: BoardCellComplex[] = [
  // Top section - py structure on green background
  {
    cellId: 'g53', // Green path, top middle section
    imagePath: '/complexes/5.png',
    bgColor: 'green',
    label: 'py'
  },

  // Top right - complex structure on blue/yellow background
  {
    cellId: 'y31', // Yellow/blue intersection area
    imagePath: '/complexes/6.png',
    bgColor: 'blue',
  },

  // Middle row left - molecular on yellow background
  {
    cellId: 'y26', // Yellow cell, middle left
    imagePath: '/complexes/7.png',
    bgColor: 'yellow',
  },

  // Middle row right - molecular on yellow background
  {
    cellId: 'y44', // Yellow cell, middle right
    imagePath: '/complexes/9.png',
    bgColor: 'yellow',
  },

  // Bottom left - molecular on red background
  {
    cellId: 'r52', // Red path, bottom left section
    imagePath: '/complexes/3.png',
    bgColor: 'red',
  },

  // Bottom middle-right - molecular on red background
  {
    cellId: 'b40', // Red section, bottom area
    imagePath: '/complexes/8.png',
    bgColor: 'red',
  },

  // Bottom middle - en structure on green background
  {
    cellId: 'g12', // Green path, bottom middle
    imagePath: '/complexes/10.png',
    bgColor: 'green',
    label: 'en'
  },

  // Bottom center - molecular on yellow background
  {
    cellId: 'y8', // Yellow cell, bottom center
    imagePath: '/complexes/4.png',
    bgColor: 'yellow',
  },
];

/**
 * Get complex image for a specific cell ID
 */
export function getComplexForCell(cellId: string): BoardCellComplex | undefined {
  return BOARD_COMPLEX_CELLS.find(cell => cell.cellId === cellId);
}

/**
 * Check if a cell should have a complex image
 */
export function hasCellComplex(cellId: string): boolean {
  return BOARD_COMPLEX_CELLS.some(cell => cell.cellId === cellId);
}
