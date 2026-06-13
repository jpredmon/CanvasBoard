import { beforeEach,expect, it } from 'vitest';

import { MAX_CARDS } from '../../constants';
import { LocalStorageRepository } from '../../repositories/LocalStorageRepository';
import type { YouTubeCard } from '../../types';
import { createStore } from '../index';
import { cardsActions } from './cardsSlice';
import { addYouTubeCard } from './cardsThunks';

beforeEach(() => localStorage.clear());

function makeStore() {
  return createStore(new LocalStorageRepository());
}

function mockCard(id: string): YouTubeCard {
  return {
    id,
    type: 'youtube',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    videoId: 'dQw4w9WgXcQ',
    aspectRatio: '16:9',
    createdAt: 0,
  };
}

it('dispatches card and layout item for a valid YouTube URL', () => {
  const store = makeStore();
  store.dispatch(addYouTubeCard('https://www.youtube.com/watch?v=dQw4w9WgXcQ'));
  expect(store.getState().cards.ids).toHaveLength(1);
  expect(store.getState().layout.items).toHaveLength(1);
});

it('throws for an invalid URL', () => {
  const store = makeStore();
  expect(() => store.dispatch(addYouTubeCard('not-a-url'))).toThrow();
});

it('throws for a non-YouTube URL', () => {
  const store = makeStore();
  expect(() => store.dispatch(addYouTubeCard('https://vimeo.com/123456'))).toThrow();
});

it('throws when card count is at MAX_CARDS', () => {
  const store = makeStore();
  const ids = Array.from({ length: MAX_CARDS }, (_, i) => `card-${i}`);
  store.dispatch(
    cardsActions.setCards({
      ids,
      entities: Object.fromEntries(ids.map((id) => [id, mockCard(id)])),
    })
  );
  expect(() =>
    store.dispatch(addYouTubeCard('https://www.youtube.com/watch?v=dQw4w9WgXcQ'))
  ).toThrow(`Board is full (${MAX_CARDS} card maximum).`);
});

it('places the card at the top-left available cell', () => {
  const store = makeStore();
  store.dispatch(addYouTubeCard('https://www.youtube.com/watch?v=dQw4w9WgXcQ'));
  const item = store.getState().layout.items[0];
  expect(item.x).toBe(0);
  expect(item.y).toBe(0);
});
