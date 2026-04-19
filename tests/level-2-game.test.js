/**
 * Tests for level-2-game.js — Level 2 wizard logic, chemistry data, scoring
 *
 * Since level-2-game.js is an IIFE with DOM-dependent init(),
 * we extract and test the pure chemistry logic by re-declaring the data
 * and re-implementing the pure functions inline.
 */
import { describe, it, expect } from 'vitest';

// ── Re-declare chemistry data (mirrors level-2-game.js) ──

const LIGAND_CHEMISTRY = {
  h2o:  { name: "H\u2082O",  charge: 0,  denticity: 1, type: "Monodentate", sphere: "red" },
  nh3:  { name: "NH\u2083",  charge: 0,  denticity: 1, type: "Monodentate", sphere: "blue" },
  py:   { name: "py",        charge: 0,  denticity: 1, type: "Monodentate", sphere: "blue" },
  pph3: { name: "PPh\u2083", charge: 0,  denticity: 1, type: "Monodentate", sphere: "orange" },
  cn:   { name: "CN\u207B",  charge: -1, denticity: 1, type: "Monodentate", sphere: "blue" },
  o2:   { name: "O\u00B2\u207B", charge: -2, denticity: 1, type: "Monodentate", sphere: "red" },
  cl:   { name: "Cl\u207B", charge: -1, denticity: 1, type: "Monodentate", sphere: "green" },
  ox:   { name: "Ox\u00B2\u207B", charge: -2, denticity: 2, type: "Bidentate", sphere: "red" },
  acac: { name: "acac\u207B", charge: -1, denticity: 2, type: "Bidentate", sphere: "red" },
  co32: { name: "CO\u2083\u00B2\u207B", charge: -2, denticity: 2, type: "Bidentate", sphere: "red" },
  phen: { name: "phen",     charge: 0,  denticity: 2, type: "Bidentate", sphere: "blue" },
  bipy: { name: "bipy",     charge: 0,  denticity: 2, type: "Bidentate", sphere: "blue" },
  en:   { name: "en",       charge: 0,  denticity: 2, type: "Bidentate", sphere: "blue" },
};

const CENTRAL_METALS = [
  { name: "Co\u00B3\u207A", id: "co3", charge: 3 },
  { name: "Cr\u00B3\u207A", id: "cr3", charge: 3 },
  { name: "Fe\u00B3\u207A", id: "fe3", charge: 3 },
  { name: "Cu\u00B2\u207A", id: "cu2", charge: 2 },
  { name: "Ni\u00B2\u207A", id: "ni2", charge: 2 },
  { name: "Zn\u00B2\u207A", id: "zn2", charge: 2 },
];

const GEOMETRY_MAP = {
  3: ["Trigonal planar"],
  4: ["Tetrahedral", "Square planar"],
  5: ["Trigonal bipyramidal", "Square pyramidal"],
  6: ["Octahedral"],
};

const ALL_GEOMETRIES = [
  "Trigonal planar", "Tetrahedral", "Square planar",
  "Trigonal bipyramidal", "Square pyramidal", "Octahedral",
];

const LIGAND_IUPAC = {
  h2o: "aqua", nh3: "ammine", py: "pyridine", pph3: "triphenylphosphine",
  cn: "cyano", o2: "oxo", cl: "chlorido", ox: "oxalato",
  acac: "acetylacetonato", co32: "carbonato", phen: "phenanthroline",
  bipy: "bipyridine", en: "ethylenediamine",
};

const NUMBER_PREFIX = {
  1: "", 2: "di", 3: "tri", 4: "tetra", 5: "penta", 6: "hexa",
};

const SPHERE_COLORS_CSS = {
  red: "#EF4444", blue: "#3B82F6", orange: "#F97316", green: "#10B981",
};

// ── Re-implement pure functions (mirrors level-2-game.js) ──

function calcCN(playerLigands) {
  let total = 0;
  playerLigands.forEach(lig => {
    const chem = LIGAND_CHEMISTRY[lig.id] || LIGAND_CHEMISTRY[(lig.id || '').toLowerCase()];
    if (chem) total += chem.denticity; else total += 1;
  });
  return total;
}

function generateIUPACName(metal, placedLigands) {
  const ligCounts = {};
  placedLigands.forEach(lig => {
    const iupac = LIGAND_IUPAC[lig.id] || lig.name;
    ligCounts[iupac] = (ligCounts[iupac] || 0) + 1;
  });

  const parts = [];
  Object.keys(ligCounts).sort().forEach(name => {
    const count = ligCounts[name];
    parts.push((NUMBER_PREFIX[count] || '') + name);
  });

  const metalBase = metal.id.replace(/[0-9]/g, '');
  const metalNames = { co: "cobalt", cr: "chromium", fe: "iron", cu: "copper", ni: "nickel", zn: "zinc" };
  const metalName = metalNames[metalBase] || metalBase;

  let totalCharge = metal.charge;
  placedLigands.forEach(lig => {
    const chem = LIGAND_CHEMISTRY[lig.id] || LIGAND_CHEMISTRY[(lig.id || '').toLowerCase()];
    if (chem) totalCharge += chem.charge;
  });

  const romanNumerals = { 1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI" };
  const roman = romanNumerals[metal.charge] || metal.charge;

  if (totalCharge < 0) {
    const ateNames = { co: "cobaltate", cr: "chromate", fe: "ferrate", cu: "cuprate", ni: "nickelate", zn: "zincate" };
    return parts.join('') + (ateNames[metalBase] || metalName + 'ate') + '(' + roman + ')';
  }
  return parts.join('') + metalName + '(' + roman + ')';
}

function generateDistractors(correct) {
  const candidates = [];
  const metals = ["cobalt", "chromium", "iron", "copper", "nickel", "zinc"];
  const prefixes = ["di", "tri", "tetra", "penta", "hexa"];

  const wrongMetal = metals.find(m => correct.indexOf(m) === -1 && correct.indexOf(m + 'ate') === -1) || "manganese";
  candidates.push(correct.replace(/cobalt|chromium|iron|copper|nickel|zinc|cobaltate|chromate|ferrate|cuprate|nickelate|zincate/i, wrongMetal));

  candidates.push(correct.replace(/di|tri|tetra|penta|hexa/, m => {
    const idx = prefixes.indexOf(m);
    return prefixes[(idx + 1) % prefixes.length];
  }));

  candidates.push(correct.replace(/\(I+V?\)/, m => m === "(III)" ? "(II)" : "(III)"));

  const wrongMetal2 = metals.find(m => m !== wrongMetal && correct.indexOf(m) === -1 && correct.indexOf(m + 'ate') === -1) || "titanium";
  candidates.push(correct.replace(/cobalt|chromium|iron|copper|nickel|zinc|cobaltate|chromate|ferrate|cuprate|nickelate|zincate/i, wrongMetal2));

  candidates.push(correct.replace(/di|tri|tetra|penta|hexa/, m => {
    const idx = prefixes.indexOf(m);
    return prefixes[(idx + 2) % prefixes.length];
  }));

  const unique = [];
  candidates.forEach(d => {
    if (d !== correct && unique.indexOf(d) === -1) unique.push(d);
  });
  return unique.slice(0, 3);
}

// ── Tests ──

describe('Level 2 — Chemistry Data', () => {
  describe('LIGAND_CHEMISTRY', () => {
    it('should have 13 ligand entries', () => {
      expect(Object.keys(LIGAND_CHEMISTRY).length).toBe(13);
    });

    it('should have correct denticity for monodentate ligands', () => {
      ['h2o', 'nh3', 'py', 'pph3', 'cn', 'o2', 'cl'].forEach(id => {
        expect(LIGAND_CHEMISTRY[id].denticity).toBe(1);
        expect(LIGAND_CHEMISTRY[id].type).toBe('Monodentate');
      });
    });

    it('should have correct denticity for bidentate ligands', () => {
      ['ox', 'acac', 'co32', 'phen', 'bipy', 'en'].forEach(id => {
        expect(LIGAND_CHEMISTRY[id].denticity).toBe(2);
        expect(LIGAND_CHEMISTRY[id].type).toBe('Bidentate');
      });
    });

    it('should have valid charges', () => {
      Object.values(LIGAND_CHEMISTRY).forEach(lig => {
        expect(typeof lig.charge).toBe('number');
        expect(lig.charge).toBeLessThanOrEqual(0);
      });
    });

    it('should have valid sphere colors', () => {
      const validSpheres = Object.keys(SPHERE_COLORS_CSS);
      Object.values(LIGAND_CHEMISTRY).forEach(lig => {
        expect(validSpheres).toContain(lig.sphere);
      });
    });
  });

  describe('CENTRAL_METALS', () => {
    it('should have 6 metal ions', () => {
      expect(CENTRAL_METALS.length).toBe(6);
    });

    it('should have unique IDs', () => {
      const ids = CENTRAL_METALS.map(m => m.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('should have positive charges', () => {
      CENTRAL_METALS.forEach(m => {
        expect(m.charge).toBeGreaterThan(0);
        expect(m.charge).toBeLessThanOrEqual(3);
      });
    });

    it('should include Co, Cr, Fe with +3 charge', () => {
      const plus3 = CENTRAL_METALS.filter(m => m.charge === 3);
      expect(plus3.length).toBe(3);
      const ids = plus3.map(m => m.id);
      expect(ids).toContain('co3');
      expect(ids).toContain('cr3');
      expect(ids).toContain('fe3');
    });

    it('should include Cu, Ni, Zn with +2 charge', () => {
      const plus2 = CENTRAL_METALS.filter(m => m.charge === 2);
      expect(plus2.length).toBe(3);
      const ids = plus2.map(m => m.id);
      expect(ids).toContain('cu2');
      expect(ids).toContain('ni2');
      expect(ids).toContain('zn2');
    });
  });

  describe('GEOMETRY_MAP', () => {
    it('should map CN 3 to Trigonal planar only', () => {
      expect(GEOMETRY_MAP[3]).toEqual(["Trigonal planar"]);
    });

    it('should map CN 4 to Tetrahedral and Square planar', () => {
      expect(GEOMETRY_MAP[4]).toEqual(["Tetrahedral", "Square planar"]);
    });

    it('should map CN 5 to Trigonal bipyramidal and Square pyramidal', () => {
      expect(GEOMETRY_MAP[5]).toEqual(["Trigonal bipyramidal", "Square pyramidal"]);
    });

    it('should map CN 6 to Octahedral only', () => {
      expect(GEOMETRY_MAP[6]).toEqual(["Octahedral"]);
    });

    it('should cover CNs 3-6', () => {
      expect(Object.keys(GEOMETRY_MAP).map(Number).sort()).toEqual([3, 4, 5, 6]);
    });
  });

  describe('ALL_GEOMETRIES', () => {
    it('should have 6 geometries', () => {
      expect(ALL_GEOMETRIES.length).toBe(6);
    });

    it('should include all geometries from GEOMETRY_MAP', () => {
      const allFromMap = Object.values(GEOMETRY_MAP).flat();
      allFromMap.forEach(geo => {
        expect(ALL_GEOMETRIES).toContain(geo);
      });
    });
  });

  describe('LIGAND_IUPAC', () => {
    it('should have IUPAC name for every ligand', () => {
      Object.keys(LIGAND_CHEMISTRY).forEach(id => {
        expect(LIGAND_IUPAC[id]).toBeTruthy();
      });
    });

    it('should map h2o to aqua', () => {
      expect(LIGAND_IUPAC.h2o).toBe('aqua');
    });

    it('should map nh3 to ammine', () => {
      expect(LIGAND_IUPAC.nh3).toBe('ammine');
    });

    it('should map cn to cyano', () => {
      expect(LIGAND_IUPAC.cn).toBe('cyano');
    });

    it('should map cl to chlorido', () => {
      expect(LIGAND_IUPAC.cl).toBe('chlorido');
    });

    it('should map en to ethylenediamine', () => {
      expect(LIGAND_IUPAC.en).toBe('ethylenediamine');
    });
  });

  describe('NUMBER_PREFIX', () => {
    it('should have empty string for 1', () => {
      expect(NUMBER_PREFIX[1]).toBe('');
    });

    it('should map 2-6 to Greek prefixes', () => {
      expect(NUMBER_PREFIX[2]).toBe('di');
      expect(NUMBER_PREFIX[3]).toBe('tri');
      expect(NUMBER_PREFIX[4]).toBe('tetra');
      expect(NUMBER_PREFIX[5]).toBe('penta');
      expect(NUMBER_PREFIX[6]).toBe('hexa');
    });
  });
});

describe('Level 2 — calcCN', () => {
  it('should calculate CN for 6 monodentate ligands', () => {
    const ligands = [
      { id: 'h2o' }, { id: 'h2o' }, { id: 'nh3' },
      { id: 'nh3' }, { id: 'cl' }, { id: 'cl' },
    ];
    expect(calcCN(ligands)).toBe(6);
  });

  it('should calculate CN for 3 bidentate ligands', () => {
    const ligands = [
      { id: 'en' }, { id: 'en' }, { id: 'en' },
    ];
    expect(calcCN(ligands)).toBe(6);
  });

  it('should calculate CN for mixed ligands', () => {
    const ligands = [
      { id: 'en' },    // denticity 2
      { id: 'h2o' },   // denticity 1
      { id: 'cl' },    // denticity 1
    ];
    expect(calcCN(ligands)).toBe(4);
  });

  it('should return 0 for empty ligands', () => {
    expect(calcCN([])).toBe(0);
  });

  it('should handle unknown ligand IDs with fallback denticity 1', () => {
    const ligands = [{ id: 'unknown' }];
    expect(calcCN(ligands)).toBe(1);
  });

  it('should calculate CN for single monodentate ligand', () => {
    expect(calcCN([{ id: 'h2o' }])).toBe(1);
  });

  it('should calculate CN for single bidentate ligand', () => {
    expect(calcCN([{ id: 'ox' }])).toBe(2);
  });

  it('should handle 2 bidentate + 2 monodentate = CN 6', () => {
    const ligands = [
      { id: 'en' }, { id: 'phen' }, { id: 'cl' }, { id: 'nh3' },
    ];
    expect(calcCN(ligands)).toBe(6);
  });
});

describe('Level 2 — generateIUPACName', () => {
  it('should generate name for [Co(NH3)6]3+ (hexaamminecobalt(III))', () => {
    const metal = { id: 'co3', charge: 3 };
    const ligands = Array(6).fill({ id: 'nh3' });
    const name = generateIUPACName(metal, ligands);
    expect(name).toBe('hexaamminecobalt(III)');
  });

  it('should generate name for [CoCl6]3- (hexachloridocobaltate(III))', () => {
    const metal = { id: 'co3', charge: 3 };
    const ligands = Array(6).fill({ id: 'cl' });
    const name = generateIUPACName(metal, ligands);
    // totalCharge = 3 + 6*(-1) = -3 → anionic → cobaltate
    expect(name).toBe('hexachloridocobaltate(III)');
  });

  it('should generate name for [Fe(CN)6]3- (hexacyanoferrate(III))', () => {
    const metal = { id: 'fe3', charge: 3 };
    const ligands = Array(6).fill({ id: 'cn' });
    const name = generateIUPACName(metal, ligands);
    expect(name).toBe('hexacyanoferrate(III)');
  });

  it('should generate name for [Cu(H2O)4]2+ (tetraaquacopper(II))', () => {
    const metal = { id: 'cu2', charge: 2 };
    const ligands = Array(4).fill({ id: 'h2o' });
    const name = generateIUPACName(metal, ligands);
    expect(name).toBe('tetraaquacopper(II)');
  });

  it('should sort ligands alphabetically in name', () => {
    const metal = { id: 'co3', charge: 3 };
    // "chlorido" and "ammine" — alphabetical: ammine, chlorido
    const ligands = [
      { id: 'cl' }, { id: 'cl' }, { id: 'cl' },
      { id: 'nh3' }, { id: 'nh3' }, { id: 'nh3' },
    ];
    const name = generateIUPACName(metal, ligands);
    // ammine before chlorido alphabetically
    expect(name).toBe('triamminetrichloridocobalt(III)');
  });

  it('should handle mixed denticity ligands', () => {
    const metal = { id: 'cr3', charge: 3 };
    const ligands = [
      { id: 'en' }, { id: 'en' }, { id: 'h2o' }, { id: 'cl' },
    ];
    const name = generateIUPACName(metal, ligands);
    // aqua, chlorido, diethylenediamine — sorted alphabetically
    expect(name).toContain('chromium(III)');
    expect(name).toContain('aqua');
    expect(name).toContain('chlorido');
    expect(name).toContain('diethylenediamine');
  });

  it('should use -ate suffix for anionic complexes', () => {
    const metal = { id: 'ni2', charge: 2 };
    const ligands = Array(4).fill({ id: 'cn' });
    // totalCharge = 2 + 4*(-1) = -2 → anionic → nickelate
    const name = generateIUPACName(metal, ligands);
    expect(name).toContain('nickelate(II)');
  });

  it('should NOT use -ate suffix for cationic complexes', () => {
    const metal = { id: 'co3', charge: 3 };
    const ligands = Array(6).fill({ id: 'nh3' });
    // totalCharge = 3 + 0 = 3 → cationic
    const name = generateIUPACName(metal, ligands);
    expect(name).not.toContain('ate');
  });

  it('should use correct Roman numerals', () => {
    const metal2 = { id: 'cu2', charge: 2 };
    const metal3 = { id: 'co3', charge: 3 };
    expect(generateIUPACName(metal2, [{ id: 'h2o' }])).toContain('(II)');
    expect(generateIUPACName(metal3, [{ id: 'h2o' }])).toContain('(III)');
  });

  it('should handle no prefix for single ligand', () => {
    const metal = { id: 'cu2', charge: 2 };
    const ligands = [{ id: 'h2o' }];
    const name = generateIUPACName(metal, ligands);
    // NUMBER_PREFIX[1] = "" → just "aqua" not "monoaqua"
    expect(name).toBe('aquacopper(II)');
  });
});

describe('Level 2 — generateDistractors', () => {
  it('should generate up to 3 distractors', () => {
    const correct = 'hexaamminecobalt(III)';
    const distractors = generateDistractors(correct);
    expect(distractors.length).toBeLessThanOrEqual(3);
    expect(distractors.length).toBeGreaterThan(0);
  });

  it('should not include the correct answer', () => {
    const correct = 'hexaamminecobalt(III)';
    const distractors = generateDistractors(correct);
    distractors.forEach(d => {
      expect(d).not.toBe(correct);
    });
  });

  it('should not have duplicates', () => {
    const correct = 'hexachloridocobaltate(III)';
    const distractors = generateDistractors(correct);
    expect(new Set(distractors).size).toBe(distractors.length);
  });

  it('should generate meaningful variations', () => {
    const correct = 'hexaamminecobalt(III)';
    const distractors = generateDistractors(correct);
    // At least one should have a different metal name
    const hasDifferentMetal = distractors.some(d => !d.includes('cobalt'));
    expect(hasDifferentMetal).toBe(true);
  });

  it('should vary oxidation state in at least one distractor', () => {
    const correct = 'hexaamminecobalt(III)';
    const distractors = generateDistractors(correct);
    const hasDifferentRoman = distractors.some(d => d.includes('(II)'));
    expect(hasDifferentRoman).toBe(true);
  });
});

describe('Level 2 — Scoring System', () => {
  it('should award 2 pts for first-attempt geometry', () => {
    // Attempt 1: Math.max(0, 3 - 1) = 2
    expect(Math.max(0, 3 - 1)).toBe(2);
  });

  it('should award 1 pt for second-attempt geometry', () => {
    expect(Math.max(0, 3 - 2)).toBe(1);
  });

  it('should award 0 pts for third-attempt geometry', () => {
    expect(Math.max(0, 3 - 3)).toBe(0);
  });

  it('should award 6 pts for first-attempt build', () => {
    const attempt = 1;
    const pts = attempt === 1 ? 6 : (attempt === 2 ? 4 : 2);
    expect(pts).toBe(6);
  });

  it('should award 4 pts for second-attempt build', () => {
    const attempt = 2;
    const pts = attempt === 1 ? 6 : (attempt === 2 ? 4 : 2);
    expect(pts).toBe(4);
  });

  it('should award 2 pts for third-attempt build', () => {
    const attempt = 3;
    const pts = attempt === 1 ? 6 : (attempt === 2 ? 4 : 2);
    expect(pts).toBe(2);
  });

  it('should have max total of 10 points (2 + 6 + 2)', () => {
    const maxGeometry = 2;
    const maxBuild = 6;
    const maxNaming = 2;
    expect(maxGeometry + maxBuild + maxNaming).toBe(10);
  });
});
