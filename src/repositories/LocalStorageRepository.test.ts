import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorageRepository } from './LocalStorageRepository';
import type { CardsState, LayoutState } from '../types';

const mockCardsState: CardsState = {
  ids: ['card-1'],
  entities: {
    'card-1': {
      id: 'card-1',
      type: 'youtube',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      videoId: 'dQw4w9WgXcQ',
      aspectRatio: '16:9',
      createdAt: 1700000000000,
    },
  },
};

const mockLayoutState: LayoutState = {
  items: [{ i: 'card-1', x: 0, y: 0, w: 4, h: 3, minW: 2, minH: 2 }],
};

describe('LocalStorageRepository', () => {
  let repo: LocalStorageRepository;

  beforeEach(() => {
    localStorage.clear();
    repo = new LocalStorageRepository();
  });

  it('saves and loads cards with a round-trip', () => {
    repo.saveCards(mockCardsState);
    expect(repo.loadCards()).toEqual(mockCardsState);
  });

  it('saves and loads layout with a round-trip', () => {
    repo.saveLayout(mockLayoutState);
    expect(repo.loadLayout()).toEqual(mockLayoutState);
  });

  it('returns null for cards when storage is empty', () => {
    expect(repo.loadCards()).toBeNull();
  });

  it('returns null for layout when storage is empty', () => {
    expect(repo.loadLayout()).toBeNull();
  });

  it('returns null for cards when stored value is corrupt JSON', () => {
    localStorage.setItem('canvasboard:cards', 'not-json{{{');
    expect(repo.loadCards()).toBeNull();
  });

  it('returns null for layout when stored value is corrupt JSON', () => {
    localStorage.setItem('canvasboard:layout', 'not-json{{{');
    expect(repo.loadLayout()).toBeNull();
  });

  it('loadStateSync returns both states when both are saved', () => {
    repo.saveCards(mockCardsState);
    repo.saveLayout(mockLayoutState);
    const state = repo.loadStateSync();
    expect(state.cards).toEqual(mockCardsState);
    expect(state.layout).toEqual(mockLayoutState);
  });

  it('loadStateSync returns undefined values when storage is empty', () => {
    const state = repo.loadStateSync();
    expect(state.cards).toBeUndefined();
    expect(state.layout).toBeUndefined();
  });
});
