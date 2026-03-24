/**
 * Complex Image to Background Color Mapping
 * Based on classification from board design
 */

export type ComplexColor = 'red' | 'yellow' | 'green' | 'blue';

export interface ComplexData {
  filename: string;
  color: ComplexColor;
  bgClass: string;
  bgHex: string;
}

/**
 * Complex image to color mapping
 * Classified based on board game design
 */
export const COMPLEX_COLORS: Record<string, ComplexData> = {
  '3.png': {
    filename: '3.png',
    color: 'red',
    bgClass: 'bg-red-500',
    bgHex: '#ef4444'
  },
  '4.png': {
    filename: '4.png',
    color: 'yellow',
    bgClass: 'bg-yellow-400',
    bgHex: '#facc15'
  },
  '5.png': {
    filename: '5.png',
    color: 'green',
    bgClass: 'bg-green-500',
    bgHex: '#22c55e'
  },
  '6.png': {
    filename: '6.png',
    color: 'red',
    bgClass: 'bg-red-500',
    bgHex: '#ef4444'
  },
  '7.png': {
    filename: '7.png',
    color: 'yellow',
    bgClass: 'bg-yellow-400',
    bgHex: '#facc15'
  },
  '8.png': {
    filename: '8.png',
    color: 'red',
    bgClass: 'bg-red-500',
    bgHex: '#ef4444'
  },
  '9.png': {
    filename: '9.png',
    color: 'yellow',
    bgClass: 'bg-yellow-400',
    bgHex: '#facc15'
  },
  '10.png': {
    filename: '10.png',
    color: 'green',
    bgClass: 'bg-green-500',
    bgHex: '#22c55e'
  }
};

/**
 * Get complex data by filename
 */
export function getComplexColor(filename: string): ComplexData | undefined {
  return COMPLEX_COLORS[filename];
}

/**
 * Get all complexes by color
 */
export function getComplexesByColor(color: ComplexColor): ComplexData[] {
  return Object.values(COMPLEX_COLORS).filter(complex => complex.color === color);
}

/**
 * Get background class for a complex image
 */
export function getComplexBgClass(filename: string): string {
  return COMPLEX_COLORS[filename]?.bgClass || 'bg-gray-500';
}

/**
 * Get hex color for a complex image
 */
export function getComplexBgHex(filename: string): string {
  return COMPLEX_COLORS[filename]?.bgHex || '#6b7280';
}
