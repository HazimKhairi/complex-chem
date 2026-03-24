# Complex Chemistry Image Classification

## Overview
This document describes the background color classification system for chemistry complex images used in the COOR-CHEM Ludo board game.

## Classification System

### 🔴 Red Background Complexes
- `3.png` - Acetylacetonate (acac)
- `6.png` - Complex structure with N and O
- `8.png` - Acetylacetonate variant

**Hex Color**: `#ef4444`
**Tailwind Class**: `bg-red-500`

### 🟡 Yellow Background Complexes
- `4.png` - Bipyridine/Phenanthroline structure
- `7.png` - Benzene-based ligand
- `9.png` - Benzene ring structure

**Hex Color**: `#facc15`
**Tailwind Class**: `bg-yellow-400`

### 🟢 Green Background Complexes
- `5.png` - Pyridine (py)
- `10.png` - Acetylacetonate (acac)

**Hex Color**: `#22c55e`
**Tailwind Class**: `bg-green-500`

## File Structure

```
src/
├── data/
│   └── complex-colors.ts          # Color mapping data and utilities
├── components/
│   ├── complex-showcase.astro     # Demo component
│   └── game-assets.astro          # Preload configuration
public/
└── complexes/
    ├── 3.png                      # Red
    ├── 4.png                      # Yellow
    ├── 5.png                      # Green
    ├── 6.png                      # Red
    ├── 7.png                      # Yellow
    ├── 8.png                      # Red
    ├── 9.png                      # Yellow
    └── 10.png                     # Green
```

## Usage

### Import and Use

```typescript
import {
  COMPLEX_COLORS,
  getComplexColor,
  getComplexesByColor,
  getComplexBgClass,
  getComplexBgHex
} from '@/data/complex-colors';

// Get specific complex data
const complex3 = getComplexColor('3.png');
console.log(complex3.color); // 'red'

// Get all complexes of a specific color
const redComplexes = getComplexesByColor('red');
// Returns: [3.png, 6.png, 8.png]

// Get Tailwind class
const bgClass = getComplexBgClass('4.png');
// Returns: 'bg-yellow-400'

// Get hex color
const hexColor = getComplexBgHex('5.png');
// Returns: '#22c55e'
```

### In Astro Components

```astro
---
import { getComplexColor } from '@/data/complex-colors';

const complex = getComplexColor('3.png');
---

<div class={complex.bgClass}>
  <img src={`/complexes/${complex.filename}`} alt="Complex" />
</div>
```

## Color Distribution

| Color  | Count | Percentage |
|--------|-------|------------|
| Red    | 3     | 37.5%      |
| Yellow | 3     | 37.5%      |
| Green  | 2     | 25.0%      |
| Blue   | 0     | 0%         |

**Total**: 8 unique complex images

## Notes

1. **Blue complexes**: No blue background complexes in current classification
2. **Image quality**: All images are high-resolution PNG with transparent backgrounds
3. **Performance**: Images are preloaded in `game-assets.astro` for optimal performance
4. **Chemistry accuracy**: Classifications based on visual board design, may need validation by chemistry expert

## Maintenance

To add new complexes:

1. Add image to `public/complexes/`
2. Update `src/data/complex-colors.ts` with new mapping
3. Add preload link in `src/components/game-assets.astro`
4. Update this documentation

---

**Last Updated**: March 25, 2026
**Classifier**: HakasAI
**Status**: ✅ Complete
