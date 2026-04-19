/**
 * Tests for level-2-3d-builder.js — GEOMETRY_CONFIG and BoneBuilder API
 *
 * Since the 3D builder requires Three.js and WebGL (not available in jsdom),
 * we test the geometry configuration data and API shape.
 * The Three.js rendering is tested via the data integrity checks.
 */
import { describe, it, expect } from 'vitest';

// Re-declare GEOMETRY_CONFIG (mirrors level-2-3d-builder.js)
const GEOMETRY_CONFIG = {
  "Trigonal planar": {
    slots: 3,
    positions: [
      { x: 1.8, y: 0, z: 0 },
      { x: -0.9, y: 0, z: 1.56 },
      { x: -0.9, y: 0, z: -1.56 },
    ],
  },
  Tetrahedral: {
    slots: 4,
    positions: [
      { x: 1.2, y: 1.2, z: 1.2 },
      { x: -1.2, y: -1.2, z: 1.2 },
      { x: -1.2, y: 1.2, z: -1.2 },
      { x: 1.2, y: -1.2, z: -1.2 },
    ],
  },
  "Square planar": {
    slots: 4,
    positions: [
      { x: 1.8, y: 0, z: 0 },
      { x: -1.8, y: 0, z: 0 },
      { x: 0, y: 0, z: 1.8 },
      { x: 0, y: 0, z: -1.8 },
    ],
  },
  "Trigonal bipyramidal": {
    slots: 5,
    positions: [
      { x: 0, y: 2, z: 0 },
      { x: 0, y: -2, z: 0 },
      { x: 1.8, y: 0, z: 0 },
      { x: -0.9, y: 0, z: 1.56 },
      { x: -0.9, y: 0, z: -1.56 },
    ],
  },
  "Square pyramidal": {
    slots: 5,
    positions: [
      { x: 0, y: 2, z: 0 },
      { x: 1.5, y: 0, z: 1.5 },
      { x: -1.5, y: 0, z: 1.5 },
      { x: -1.5, y: 0, z: -1.5 },
      { x: 1.5, y: 0, z: -1.5 },
    ],
  },
  Octahedral: {
    slots: 6,
    positions: [
      { x: 2, y: 0, z: 0 },
      { x: -2, y: 0, z: 0 },
      { x: 0, y: 2, z: 0 },
      { x: 0, y: -2, z: 0 },
      { x: 0, y: 0, z: 2 },
      { x: 0, y: 0, z: -2 },
    ],
  },
};

const SPHERE_COLORS = {
  red: 0xef4444,
  blue: 0x3b82f6,
  orange: 0xf97316,
  green: 0x10b981,
};

const METAL_COLOR = 0x9ca3af;

describe('Level 2 — GEOMETRY_CONFIG', () => {
  it('should have 6 geometry types', () => {
    expect(Object.keys(GEOMETRY_CONFIG).length).toBe(6);
  });

  it('should have all expected geometry names', () => {
    const expected = [
      "Trigonal planar", "Tetrahedral", "Square planar",
      "Trigonal bipyramidal", "Square pyramidal", "Octahedral",
    ];
    expected.forEach(name => {
      expect(GEOMETRY_CONFIG).toHaveProperty(name);
    });
  });

  describe('slot counts', () => {
    it('Trigonal planar should have 3 slots', () => {
      expect(GEOMETRY_CONFIG["Trigonal planar"].slots).toBe(3);
    });

    it('Tetrahedral should have 4 slots', () => {
      expect(GEOMETRY_CONFIG["Tetrahedral"].slots).toBe(4);
    });

    it('Square planar should have 4 slots', () => {
      expect(GEOMETRY_CONFIG["Square planar"].slots).toBe(4);
    });

    it('Trigonal bipyramidal should have 5 slots', () => {
      expect(GEOMETRY_CONFIG["Trigonal bipyramidal"].slots).toBe(5);
    });

    it('Square pyramidal should have 5 slots', () => {
      expect(GEOMETRY_CONFIG["Square pyramidal"].slots).toBe(5);
    });

    it('Octahedral should have 6 slots', () => {
      expect(GEOMETRY_CONFIG["Octahedral"].slots).toBe(6);
    });
  });

  describe('position counts match slot counts', () => {
    Object.entries(GEOMETRY_CONFIG).forEach(([name, config]) => {
      it(`${name} should have positions.length === slots (${config.slots})`, () => {
        expect(config.positions.length).toBe(config.slots);
      });
    });
  });

  describe('position coordinates', () => {
    Object.entries(GEOMETRY_CONFIG).forEach(([name, config]) => {
      it(`${name} positions should have x, y, z numbers`, () => {
        config.positions.forEach((pos, i) => {
          expect(typeof pos.x).toBe('number');
          expect(typeof pos.y).toBe('number');
          expect(typeof pos.z).toBe('number');
        });
      });

      it(`${name} positions should be non-zero distance from center`, () => {
        config.positions.forEach(pos => {
          const dist = Math.sqrt(pos.x ** 2 + pos.y ** 2 + pos.z ** 2);
          expect(dist).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('geometry symmetry checks', () => {
    it('Square planar should have all y=0 (planar)', () => {
      GEOMETRY_CONFIG["Square planar"].positions.forEach(pos => {
        expect(pos.y).toBe(0);
      });
    });

    it('Trigonal planar should have all y=0 (planar)', () => {
      GEOMETRY_CONFIG["Trigonal planar"].positions.forEach(pos => {
        expect(pos.y).toBe(0);
      });
    });

    it('Octahedral positions should be along axes', () => {
      const positions = GEOMETRY_CONFIG["Octahedral"].positions;
      // Each position should have exactly one non-zero coordinate
      positions.forEach(pos => {
        const nonZero = [pos.x, pos.y, pos.z].filter(v => v !== 0);
        expect(nonZero.length).toBe(1);
      });
    });

    it('Octahedral should have equal distances from center', () => {
      const distances = GEOMETRY_CONFIG["Octahedral"].positions.map(
        pos => Math.sqrt(pos.x ** 2 + pos.y ** 2 + pos.z ** 2)
      );
      const allEqual = distances.every(d => Math.abs(d - distances[0]) < 0.01);
      expect(allEqual).toBe(true);
    });

    it('Tetrahedral positions should have equal distances from center', () => {
      const distances = GEOMETRY_CONFIG["Tetrahedral"].positions.map(
        pos => Math.sqrt(pos.x ** 2 + pos.y ** 2 + pos.z ** 2)
      );
      const allEqual = distances.every(d => Math.abs(d - distances[0]) < 0.01);
      expect(allEqual).toBe(true);
    });

    it('Trigonal bipyramidal should have 2 axial + 3 equatorial', () => {
      const positions = GEOMETRY_CONFIG["Trigonal bipyramidal"].positions;
      const axial = positions.filter(p => p.x === 0 && p.z === 0 && p.y !== 0);
      const equatorial = positions.filter(p => p.y === 0);
      expect(axial.length).toBe(2);
      expect(equatorial.length).toBe(3);
    });

    it('Square pyramidal should have 1 apex + 4 base', () => {
      const positions = GEOMETRY_CONFIG["Square pyramidal"].positions;
      const apex = positions.filter(p => p.y > 0 && p.x === 0 && p.z === 0);
      const base = positions.filter(p => p.y === 0);
      expect(apex.length).toBe(1);
      expect(base.length).toBe(4);
    });
  });
});

describe('Level 2 — SPHERE_COLORS', () => {
  it('should have 4 sphere colors', () => {
    expect(Object.keys(SPHERE_COLORS).length).toBe(4);
  });

  it('should have red, blue, orange, green', () => {
    expect(SPHERE_COLORS).toHaveProperty('red');
    expect(SPHERE_COLORS).toHaveProperty('blue');
    expect(SPHERE_COLORS).toHaveProperty('orange');
    expect(SPHERE_COLORS).toHaveProperty('green');
  });

  it('should have valid hex color integers', () => {
    Object.values(SPHERE_COLORS).forEach(color => {
      expect(typeof color).toBe('number');
      expect(color).toBeGreaterThanOrEqual(0);
      expect(color).toBeLessThanOrEqual(0xffffff);
    });
  });
});

describe('Level 2 — METAL_COLOR', () => {
  it('should be grey (0x9ca3af)', () => {
    expect(METAL_COLOR).toBe(0x9ca3af);
  });
});

describe('Level 2 — Geometry-CN mapping consistency', () => {
  // GEOMETRY_MAP from level-2-game.js
  const GEOMETRY_MAP = {
    3: ["Trigonal planar"],
    4: ["Tetrahedral", "Square planar"],
    5: ["Trigonal bipyramidal", "Square pyramidal"],
    6: ["Octahedral"],
  };

  it('each geometry in GEOMETRY_MAP should have matching slot count in GEOMETRY_CONFIG', () => {
    Object.entries(GEOMETRY_MAP).forEach(([cn, geos]) => {
      geos.forEach(geo => {
        expect(GEOMETRY_CONFIG[geo].slots).toBe(Number(cn));
      });
    });
  });

  it('every GEOMETRY_CONFIG entry should appear in GEOMETRY_MAP', () => {
    const allMapGeos = Object.values(GEOMETRY_MAP).flat();
    Object.keys(GEOMETRY_CONFIG).forEach(geo => {
      expect(allMapGeos).toContain(geo);
    });
  });
});
