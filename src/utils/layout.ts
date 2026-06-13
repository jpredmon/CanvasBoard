import { GRID_COLS } from '../constants';
import type { CardLayout } from '../types';

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function rectsOverlap(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

export function findTopLeftCell(
  items: CardLayout[],
  cardWidth: number,
  cols: number = GRID_COLS,
): { x: number; y: number } {
  for (let y = 0; y < 1000; y++) {
    for (let x = 0; x <= cols - cardWidth; x++) {
      const candidate: Rect = { x, y, w: cardWidth, h: 1 };
      const blocked = items.some((item) => rectsOverlap(candidate, item));
      if (!blocked) return { x, y };
    }
  }
  return { x: 0, y: 0 };
}
