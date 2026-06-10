import { describe, it, expect } from 'vitest';
import { findTopLeftCell } from './layout';
import type { CardLayout } from '../types';

function makeItem(i: string, x: number, y: number, w: number, h: number): CardLayout {
  return { i, x, y, w, h, minW: 2, minH: 2 };
}

describe('findTopLeftCell', () => {
  it('returns {x:0, y:0} on an empty board', () => {
    expect(findTopLeftCell([], 4)).toEqual({ x: 0, y: 0 });
  });

  it('finds the next available cell when top-left is occupied', () => {
    const items = [makeItem('a', 0, 0, 4, 3)];
    const result = findTopLeftCell(items, 4);
    expect(result).toEqual({ x: 4, y: 0 });
  });

  it('moves to the next row when the current row is full', () => {
    const items = [
      makeItem('a', 0, 0, 6, 1),
      makeItem('b', 6, 0, 6, 1),
    ];
    const result = findTopLeftCell(items, 4);
    expect(result).toEqual({ x: 0, y: 1 });
  });

  it('respects custom card width when checking available x positions', () => {
    const items = [makeItem('a', 0, 0, 10, 1)];
    // only x=0 or x=1 fit a width-2 card; both overlap with item a at y=0
    const result = findTopLeftCell(items, 2);
    expect(result).toEqual({ x: 10, y: 0 });
  });

  it('handles a card that is wider than remaining space in a row', () => {
    const items = [makeItem('a', 0, 0, 9, 1)];
    // width-4 card: x can be 0..8. 0-8 overlap with item a. x=9 doesn't fit (9+4>12).
    // so y=0 is blocked, y=1 should return {x:0, y:1}
    const result = findTopLeftCell(items, 4);
    expect(result).toEqual({ x: 0, y: 1 });
  });
});
