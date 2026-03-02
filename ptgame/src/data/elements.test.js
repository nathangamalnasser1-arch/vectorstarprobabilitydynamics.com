import { describe, it, expect } from 'vitest';
import {
  getElements,
  getFact,
  getNumberAtSlot,
  shuffleArray,
  getGridMatrix,
  getAllSlots,
} from './elements';

describe('elements data', () => {
  it('getElements returns 118 elements with number, symbol, row, col, block', () => {
    const elements = getElements();
    expect(elements).toHaveLength(118);
    expect(elements[0]).toMatchObject({ number: 1, symbol: 'H', block: 's' });
    expect(elements[0]).toHaveProperty('row');
    expect(elements[0]).toHaveProperty('col');
    expect(elements[117]).toMatchObject({ number: 118, symbol: 'Og', block: 'p' });
  });

  it('getNumberAtSlot returns correct atomic number for each slot', () => {
    expect(getNumberAtSlot(1, 1)).toBe(1);
    expect(getNumberAtSlot(1, 18)).toBe(2);
    expect(getNumberAtSlot(6, 12)).toBe(80);
    expect(getNumberAtSlot(8, 4)).toBe(58);
    expect(getNumberAtSlot(9, 17)).toBe(103);
    expect(getNumberAtSlot(2, 3)).toBe(null);
  });

  it('getGridMatrix is 9x18 with no duplicate slots', () => {
    const matrix = getGridMatrix();
    expect(matrix).toHaveLength(9);
    expect(matrix[0]).toHaveLength(18);
    const filled = matrix.flat().filter(Boolean);
    expect(filled).toHaveLength(118);
  });

  it('getAllSlots returns 118 unique slots', () => {
    const slots = getAllSlots();
    expect(slots).toHaveLength(118);
    const keys = new Set(slots.map((s) => `${s.row},${s.col}`));
    expect(keys.size).toBe(118);
  });

  it('shuffleArray returns same length and contents', () => {
    const arr = [1, 2, 3, 4, 5];
    const shuffled = shuffleArray(arr);
    expect(shuffled).toHaveLength(5);
    expect(shuffled.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
  });

  it('getFact returns fact for specified elements only', () => {
    expect(getFact(1)).toContain('alkali');
    expect(getFact(2)).toContain('Group 18');
    expect(getFact(43)).toContain('synthesis');
    expect(getFact(80)).toContain('liquid');
    expect(getFact(118)).toContain('heaviest');
    expect(getFact(50)).toBe(null);
  });
});
