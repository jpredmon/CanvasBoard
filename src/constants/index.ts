export const MAX_CARDS = 50;

export const GRID_COLS = 12;
export const GRID_ROW_HEIGHT = 80;
export const GRID_MARGIN: [number, number] = [16, 16];
export const GRID_CONTAINER_PADDING: [number, number] = [24, 24];

export const CARD_DEFAULTS = {
  '16:9': { w: 4, h: 3, minW: 2, minH: 2 },
  '9:16': { w: 2, h: 4, minW: 2, minH: 2 },
} as const satisfies Record<string, { w: number; h: number; minW: number; minH: number }>;

export const STORAGE_KEYS = {
  cards: 'canvasboard:cards',
  layout: 'canvasboard:layout',
} as const;
