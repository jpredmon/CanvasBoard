import { describe, it, expect } from 'vitest';
import { cardsReducer, cardsActions } from './cardsSlice';
import type { MediaCard } from '../../types';

const card: MediaCard = {
  id: 'card-1',
  type: 'youtube',
  url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  videoId: 'dQw4w9WgXcQ',
  aspectRatio: '16:9',
  createdAt: 1700000000000,
};

describe('cardsSlice', () => {
  it('starts with empty state', () => {
    const state = cardsReducer(undefined, { type: '@@init' });
    expect(state.ids).toEqual([]);
    expect(state.entities).toEqual({});
  });

  it('addCard inserts the entity and updates ids', () => {
    const state = cardsReducer(undefined, cardsActions.addCard(card));
    expect(state.ids).toContain('card-1');
    expect(state.entities['card-1']).toEqual(card);
  });

  it('removeCard removes the entity and updates ids', () => {
    let state = cardsReducer(undefined, cardsActions.addCard(card));
    state = cardsReducer(state, cardsActions.removeCard('card-1'));
    expect(state.ids).not.toContain('card-1');
    expect(state.entities['card-1']).toBeUndefined();
  });
});
