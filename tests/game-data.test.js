/**
 * Tests for game data integrity — QUESTION_CARDS, FATE_CARDS_DATA, LIGANDS_DATA
 * Validates correctness of all game data constants used across Level 1 and Level 2
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// Extract data by reading the source and parsing
const src = readFileSync(join(import.meta.dirname, '..', 'public', 'scripts', 'game-mechanics-cards.js'), 'utf-8');

// Parse QUESTION_CARDS from source
function extractArray(source, name) {
  const regex = new RegExp(`const ${name} = \\[([\\s\\S]*?)\\];`);
  const match = source.match(regex);
  if (!match) return [];
  try {
    return new Function(`return [${match[1]}]`)();
  } catch {
    return [];
  }
}

const QUESTION_CARDS = extractArray(src, 'QUESTION_CARDS');
const FATE_CARDS_DATA = extractArray(src, 'FATE_CARDS_DATA');
const LIGANDS_DATA = extractArray(src, 'LIGANDS_DATA');

describe('QUESTION_CARDS data integrity', () => {
  it('should have 18 question cards', () => {
    expect(QUESTION_CARDS.length).toBe(18);
  });

  it('should have unique IDs', () => {
    const ids = QUESTION_CARDS.map(q => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('should have 6 hard, 6 medium, 6 easy questions', () => {
    const hard = QUESTION_CARDS.filter(q => q.difficulty === 'hard');
    const medium = QUESTION_CARDS.filter(q => q.difficulty === 'medium');
    const easy = QUESTION_CARDS.filter(q => q.difficulty === 'easy');
    expect(hard.length).toBe(6);
    expect(medium.length).toBe(6);
    expect(easy.length).toBe(6);
  });

  it('hard questions should award 5 points', () => {
    QUESTION_CARDS.filter(q => q.difficulty === 'hard').forEach(q => {
      expect(q.points).toBe(5);
    });
  });

  it('medium questions should award 3 points', () => {
    QUESTION_CARDS.filter(q => q.difficulty === 'medium').forEach(q => {
      expect(q.points).toBe(3);
    });
  });

  it('easy questions should award 2 points', () => {
    QUESTION_CARDS.filter(q => q.difficulty === 'easy').forEach(q => {
      expect(q.points).toBe(2);
    });
  });

  it('each question should have a valid correctAnswer (1-4)', () => {
    QUESTION_CARDS.forEach(q => {
      expect(q.correctAnswer).toBeGreaterThanOrEqual(1);
      expect(q.correctAnswer).toBeLessThanOrEqual(4);
    });
  });

  it('each question should have at least 3 answers', () => {
    QUESTION_CARDS.forEach(q => {
      expect(q.answers.length).toBeGreaterThanOrEqual(3);
    });
  });

  it('correctAnswer index should not exceed answers length', () => {
    QUESTION_CARDS.forEach(q => {
      expect(q.correctAnswer).toBeLessThanOrEqual(q.answers.length);
    });
  });

  it('each question should have an imageFile', () => {
    QUESTION_CARDS.forEach(q => {
      expect(q.imageFile).toBeTruthy();
      expect(q.imageFile).toMatch(/^\d+\.png$/);
    });
  });

  it('imageFiles should be in range 6-23', () => {
    QUESTION_CARDS.forEach(q => {
      const num = parseInt(q.imageFile);
      expect(num).toBeGreaterThanOrEqual(6);
      expect(num).toBeLessThanOrEqual(23);
    });
  });

  it('imageFiles should be unique', () => {
    const files = QUESTION_CARDS.map(q => q.imageFile);
    expect(new Set(files).size).toBe(files.length);
  });
});

describe('FATE_CARDS_DATA data integrity', () => {
  it('should have 10 fate cards', () => {
    expect(FATE_CARDS_DATA.length).toBe(10);
  });

  it('should have unique IDs', () => {
    const ids = FATE_CARDS_DATA.map(f => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('each card should have title and description', () => {
    FATE_CARDS_DATA.forEach(f => {
      expect(f.title).toBeTruthy();
      expect(f.description).toBeTruthy();
    });
  });

  it('each card should have an effect string', () => {
    FATE_CARDS_DATA.forEach(f => {
      expect(f.effect).toBeTruthy();
      expect(typeof f.effect).toBe('string');
    });
  });

  it('should include known fate card effects', () => {
    const effects = FATE_CARDS_DATA.map(f => f.effect);
    expect(effects).toContain('point-booster');
    expect(effects).toContain('ligand-gain');
    expect(effects).toContain('minus');
    expect(effects).toContain('move-forward');
    expect(effects).toContain('extra-turn');
    expect(effects).toContain('destiny-dance');
    expect(effects).toContain('swap-card');
  });

  it('Point Booster should have value +3', () => {
    const card = FATE_CARDS_DATA.find(f => f.id === 'point-booster');
    expect(card.value).toBe(3);
  });

  it('Minus Card should have value -3', () => {
    const card = FATE_CARDS_DATA.find(f => f.id === 'minus-card');
    expect(card.value).toBe(-3);
  });

  it('Second Chance should have value +1', () => {
    const card = FATE_CARDS_DATA.find(f => f.id === 'second-chance');
    expect(card.value).toBe(1);
  });
});

describe('LIGANDS_DATA data integrity', () => {
  it('should have 13 ligands', () => {
    expect(LIGANDS_DATA.length).toBe(13);
  });

  it('should have unique IDs', () => {
    const ids = LIGANDS_DATA.map(l => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('each ligand should have id, name, color, imageFile', () => {
    LIGANDS_DATA.forEach(l => {
      expect(l.id).toBeTruthy();
      expect(l.name).toBeTruthy();
      expect(l.color).toBeTruthy();
      expect(l.imageFile).toBeTruthy();
    });
  });

  it('imageFiles should be 1.png through 13.png', () => {
    const files = LIGANDS_DATA.map(l => parseInt(l.imageFile)).sort((a, b) => a - b);
    expect(files).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
  });

  it('colors should be valid hex', () => {
    LIGANDS_DATA.forEach(l => {
      expect(l.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  it('should include all expected ligand IDs', () => {
    const ids = LIGANDS_DATA.map(l => l.id);
    const expected = ['h2o', 'nh3', 'py', 'pph3', 'cn', 'o2', 'cl', 'ox', 'acac', 'co32', 'phen', 'bipy', 'en'];
    expected.forEach(id => {
      expect(ids).toContain(id);
    });
  });

  it('should have H2O mapped to 1.png', () => {
    const h2o = LIGANDS_DATA.find(l => l.id === 'h2o');
    expect(h2o.imageFile).toBe('1.png');
  });

  it('should have en mapped to 13.png', () => {
    const en = LIGANDS_DATA.find(l => l.id === 'en');
    expect(en.imageFile).toBe('13.png');
  });

  it('should use CI (not Cl) as board name for chloride', () => {
    const cl = LIGANDS_DATA.find(l => l.id === 'cl');
    expect(cl.name).toBe('CI');
  });
});
