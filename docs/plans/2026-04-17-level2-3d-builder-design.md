# Level 2: 3D Ball-and-Stick Complex Builder

**Date:** 2026-04-17
**Status:** Approved

## Context

The original physical game uses a ball-and-stick model kit where players physically attach ligand balls onto metal center sticks. The current Level 2 digital implementation is quiz-only (6-step wizard). This redesign replaces it with a visual 3D builder where assembling the complex IS the assessment.

## Design

### Flow (4 Steps, Max 10 pts)

| Step | Task | Points | Attempts |
|------|------|--------|----------|
| 1 | Choose Central Metal Ion | 0 | - |
| 2 | Pick Geometry (match CN) | 2 | 3 (2/1/0 pts) |
| 3 | Drag & Place Ligands on Bone | 6 | 3 (6/4/2 pts) |
| 4 | Name the Complex (IUPAC) | 2 | 1 |

### Step 1: Choose Central Metal (0 pts)

Same as current implementation. Player picks from 6 metal ions:
- Co3+, Cr3+, Fe3+ (charge +3)
- Cu2+, Ni2+, Zn2+ (charge +2)

No scoring — just selection.

### Step 2: Pick Geometry (2 pts)

Player sees their collected ligands with denticity info. They must determine the coordination number and pick the matching geometry.

Options shown: Trigonal planar, Tetrahedral, Square planar, Trigonal bipyramidal, Square pyramidal, Octahedral.

Scoring:
- 1st attempt correct: 2 pts
- 2nd attempt correct: 1 pt
- 3rd attempt correct: 0 pts

The chosen geometry determines the bone structure (number of slots and arrangement) for Step 3.

### Step 3: Drag & Place Ligands on Bone (6 pts) — MAIN EVENT

#### 3D Scene
- Central metal = grey sphere at center
- Sticks radiate outward based on geometry
- Empty slots = transparent/ghost spheres at stick endpoints
- Player's collected ligands shown as draggable cards below the 3D view

#### Interaction
- **Rotate model**: mouse drag / touch drag on the 3D canvas
- **Place ligand**: drag card from inventory → drop onto empty slot → ball snaps in with color matching ligand's sphere color
- **Remove ligand**: click placed ball → returns to inventory

#### Visual
```
Inventory cards:
[PPh3:green] [O2-:red] [H2O:red] [ox:blue]

3D Model (octahedral example):
          red ball
             |
  red ball - grey - (empty slot)
             |
        purple ball
```

#### Sphere Colors (from LIGAND_CHEMISTRY data)
- red: H2O, O2-, ox, acac, CO32-
- blue: NH3, py, CN-, phen, bipy, en
- orange: PPh3
- green: Cl-

#### Scoring
Player must fill all slots. When they click "Submit":
- All correct: 6 pts (1st attempt)
- Retry after wrong: 4 pts (2nd attempt)
- Retry again: 2 pts (3rd attempt)

"Correct" = valid ligand placement that produces a chemically valid complex (CN matches geometry, charges compute correctly).

#### Validation Rules
- Total slots must be filled
- Each ligand can only be used once
- Bidentate ligands occupy 2 adjacent slots
- CN = sum of denticity values of placed ligands

### Step 4: Name the Complex (2 pts)

After successful assembly, the completed 3D model is displayed. Player must provide the IUPAC name.

Options: Multiple choice (4 options) — one correct IUPAC name + 3 distractors.

Scoring: Correct = 2 pts, Wrong = 0 pts (1 attempt only).

### Grand Total

```
Level 1: Board question points + fate card points
Level 2: Max 10 pts (geometry 2 + assembly 6 + naming 2)
Grand Total = Level 1 + Level 2
```

## Tech Stack

### 3D Rendering
- **Three.js** — sphere geometry for atoms, cylinder geometry for bonds
- Orbit controls for rotation (mouse + touch)
- Raycasting for click/drop detection on slots

### Drag & Drop
- HTML5 Drag API for card → canvas transfer
- Three.js raycasting to detect which slot is being targeted
- Touch: `touchstart/touchmove/touchend` with raycasting

### Animations
- Snap animation when ligand placed (scale bounce)
- Glow/pulse on empty slots (hint for player)
- Rotation animation on completion (celebrate)
- Wrong placement: shake + red flash

### Device Support
- Desktop: mouse drag to rotate, drag cards to place
- Tablet: touch drag to rotate, touch drag cards to place
- Phone: same as tablet, responsive layout (cards below 3D view)

## Files to Create/Modify

### New Files
- `public/scripts/level-2-3d-builder.js` — Three.js scene, bone model, drag & drop logic
- `public/scripts/level-2-naming.js` — IUPAC naming quiz logic (Step 4)

### Modified Files
- `src/pages/level-2.astro` — new layout with 3D canvas + card inventory
- `public/scripts/level-2-game.js` — refactor to use new 4-step flow, integrate 3D builder

### Dependencies
- Three.js (CDN: three.js r160+)
- OrbitControls (from Three.js examples)

## Data Structures

### Bone Model Config
```js
const GEOMETRY_CONFIG = {
  "Trigonal planar":       { slots: 3, positions: [...] },
  "Tetrahedral":           { slots: 4, positions: [...] },
  "Square planar":         { slots: 4, positions: [...] },
  "Trigonal bipyramidal":  { slots: 5, positions: [...] },
  "Square pyramidal":      { slots: 5, positions: [...] },
  "Octahedral":            { slots: 6, positions: [...] },
};
```

### Slot State
```js
{
  slotIndex: 0,
  position: { x, y, z },
  ligand: null | { id, name, sphere, denticity },
  mesh: THREE.Mesh
}
```

## Out of Scope
- AR/camera-based interaction
- Multiplayer simultaneous building
- Custom geometry creation
- 3D model export
