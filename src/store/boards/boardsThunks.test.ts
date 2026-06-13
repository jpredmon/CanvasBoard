import { beforeEach,describe, expect, it } from 'vitest';

import { LocalStorageRepository } from '../../repositories/LocalStorageRepository';
import type { YouTubeCard } from '../../types';
import { cardsActions } from '../cards/cardsSlice';
import { createStore } from '../index';
import { boardsActions } from './boardsSlice';
import { createAndSwitchBoard, deleteBoard,switchBoard } from './boardsThunks';

const card: YouTubeCard = {
  id: 'c1',
  type: 'youtube',
  url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  videoId: 'dQw4w9WgXcQ',
  aspectRatio: '16:9',
  createdAt: 1700000000000,
};

function makeStore() {
  localStorage.clear();
  const repo = new LocalStorageRepository();
  const store = createStore(repo);
  return { store, repo };
}

describe('createAndSwitchBoard', () => {
  it('adds a board with the trimmed name', () => {
    const { store } = makeStore();
    store.dispatch(createAndSwitchBoard('  New Board  '));
    const names = Object.values(store.getState().boards.entities).map((b) => b.name);
    expect(names).toContain('New Board');
  });

  it('activates the new board', () => {
    const { store } = makeStore();
    store.dispatch(createAndSwitchBoard('New Board'));
    const { activeBoardId, entities } = store.getState().boards;
    expect(entities[activeBoardId!]?.name).toBe('New Board');
  });

  it('starts the new board with empty cards and layout', () => {
    const { store } = makeStore();
    store.dispatch(boardsActions.addBoard({ id: 'b1', name: 'B1', createdAt: 1 }));
    store.dispatch(boardsActions.setActiveBoardId('b1'));
    store.dispatch(cardsActions.addCard(card));
    store.dispatch(createAndSwitchBoard('New Board'));
    expect(store.getState().cards.ids).toHaveLength(0);
    expect(store.getState().layout.items).toHaveLength(0);
  });

  it('saves the previous board data before switching', () => {
    const { store, repo } = makeStore();
    store.dispatch(boardsActions.addBoard({ id: 'b1', name: 'B1', createdAt: 1 }));
    store.dispatch(boardsActions.setActiveBoardId('b1'));
    store.dispatch(cardsActions.addCard(card));
    store.dispatch(createAndSwitchBoard('New Board'));
    expect(repo.loadCards('b1')?.ids).toContain('c1');
  });
});

describe('switchBoard', () => {
  beforeEach(() => localStorage.clear());

  it('sets the active board', () => {
    const { store } = makeStore();
    store.dispatch(boardsActions.addBoard({ id: 'b1', name: 'B1', createdAt: 1 }));
    store.dispatch(boardsActions.addBoard({ id: 'b2', name: 'B2', createdAt: 2 }));
    store.dispatch(boardsActions.setActiveBoardId('b1'));
    store.dispatch(switchBoard('b2'));
    expect(store.getState().boards.activeBoardId).toBe('b2');
  });

  it('loads persisted cards and layout for the target board', () => {
    const { store, repo } = makeStore();
    store.dispatch(boardsActions.addBoard({ id: 'b1', name: 'B1', createdAt: 1 }));
    store.dispatch(boardsActions.addBoard({ id: 'b2', name: 'B2', createdAt: 2 }));
    store.dispatch(boardsActions.setActiveBoardId('b1'));
    repo.saveCards('b2', { ids: ['c1'], entities: { c1: card } });
    repo.saveLayout('b2', { items: [{ i: 'c1', x: 0, y: 0, w: 4, h: 3, minW: 2, minH: 2 }] });
    store.dispatch(switchBoard('b2'));
    expect(store.getState().cards.ids).toContain('c1');
    expect(store.getState().layout.items).toHaveLength(1);
  });

  it('restores original board data when switching back', () => {
    const { store } = makeStore();
    store.dispatch(boardsActions.addBoard({ id: 'b1', name: 'B1', createdAt: 1 }));
    store.dispatch(boardsActions.addBoard({ id: 'b2', name: 'B2', createdAt: 2 }));
    store.dispatch(boardsActions.setActiveBoardId('b1'));
    store.dispatch(cardsActions.addCard(card));
    store.dispatch(switchBoard('b2'));
    expect(store.getState().cards.ids).toHaveLength(0);
    store.dispatch(switchBoard('b1'));
    expect(store.getState().cards.ids).toContain('c1');
  });
});

describe('deleteBoard', () => {
  beforeEach(() => localStorage.clear());

  it('removes the board from the store', () => {
    const { store } = makeStore();
    store.dispatch(boardsActions.addBoard({ id: 'b1', name: 'B1', createdAt: 1 }));
    store.dispatch(boardsActions.setActiveBoardId('b1'));
    store.dispatch(deleteBoard('b1'));
    expect(store.getState().boards.ids).not.toContain('b1');
  });

  it('sets activeBoardId to null when deleting the last board', () => {
    const { store } = makeStore();
    store.dispatch(boardsActions.addBoard({ id: 'b1', name: 'B1', createdAt: 1 }));
    store.dispatch(boardsActions.setActiveBoardId('b1'));
    store.dispatch(deleteBoard('b1'));
    expect(store.getState().boards.activeBoardId).toBeNull();
  });

  it('switches to the first remaining board when deleting the active board', () => {
    const { store } = makeStore();
    store.dispatch(boardsActions.addBoard({ id: 'b1', name: 'B1', createdAt: 1 }));
    store.dispatch(boardsActions.addBoard({ id: 'b2', name: 'B2', createdAt: 2 }));
    store.dispatch(boardsActions.setActiveBoardId('b1'));
    store.dispatch(deleteBoard('b1'));
    expect(store.getState().boards.activeBoardId).toBe('b2');
  });

  it('keeps the active board unchanged when deleting an inactive board', () => {
    const { store } = makeStore();
    store.dispatch(boardsActions.addBoard({ id: 'b1', name: 'B1', createdAt: 1 }));
    store.dispatch(boardsActions.addBoard({ id: 'b2', name: 'B2', createdAt: 2 }));
    store.dispatch(boardsActions.setActiveBoardId('b1'));
    store.dispatch(deleteBoard('b2'));
    expect(store.getState().boards.activeBoardId).toBe('b1');
  });

  it('deletes localStorage data for the board', () => {
    const { store, repo } = makeStore();
    store.dispatch(boardsActions.addBoard({ id: 'b1', name: 'B1', createdAt: 1 }));
    store.dispatch(boardsActions.setActiveBoardId('b1'));
    repo.saveCards('b1', { ids: ['c1'], entities: { c1: card } });
    repo.saveLayout('b1', { items: [{ i: 'c1', x: 0, y: 0, w: 4, h: 3, minW: 2, minH: 2 }] });
    store.dispatch(deleteBoard('b1'));
    expect(repo.loadCards('b1')).toBeNull();
    expect(repo.loadLayout('b1')).toBeNull();
  });
});
