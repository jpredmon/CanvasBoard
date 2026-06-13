import { beforeEach, describe, expect, it } from 'vitest';

import type { BoardsState, CardsState, LayoutState } from '../types';
import { LocalStorageRepository } from './LocalStorageRepository';

const BOARD_ID = 'board-test-123';

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

const mockBoardsState: BoardsState = {
  ids: [BOARD_ID],
  activeBoardId: BOARD_ID,
  entities: {
    [BOARD_ID]: { id: BOARD_ID, name: 'Test Board', createdAt: 1700000000000 },
  },
};

describe('LocalStorageRepository', () => {
  let repo: LocalStorageRepository;

  beforeEach(() => {
    localStorage.clear();
    repo = new LocalStorageRepository();
  });

  it('saves and loads cards with a round-trip', () => {
    repo.saveCards(BOARD_ID, mockCardsState);
    expect(repo.loadCards(BOARD_ID)).toEqual(mockCardsState);
  });

  it('saves and loads layout with a round-trip', () => {
    repo.saveLayout(BOARD_ID, mockLayoutState);
    expect(repo.loadLayout(BOARD_ID)).toEqual(mockLayoutState);
  });

  it('returns null for cards when storage is empty', () => {
    expect(repo.loadCards(BOARD_ID)).toBeNull();
  });

  it('returns null for layout when storage is empty', () => {
    expect(repo.loadLayout(BOARD_ID)).toBeNull();
  });

  it('returns null for cards when stored value is corrupt JSON', () => {
    localStorage.setItem(`canvasboard:board:${BOARD_ID}:cards`, 'not-json{{{');
    expect(repo.loadCards(BOARD_ID)).toBeNull();
  });

  it('returns null for layout when stored value is corrupt JSON', () => {
    localStorage.setItem(`canvasboard:board:${BOARD_ID}:layout`, 'not-json{{{');
    expect(repo.loadLayout(BOARD_ID)).toBeNull();
  });

  it('saves and loads boards with a round-trip', () => {
    repo.saveBoards(mockBoardsState);
    expect(repo.loadBoards()).toEqual(mockBoardsState);
  });

  it('returns null for boards when storage is empty', () => {
    expect(repo.loadBoards()).toBeNull();
  });

  it('deleteBoardData removes cards and layout keys', () => {
    repo.saveCards(BOARD_ID, mockCardsState);
    repo.saveLayout(BOARD_ID, mockLayoutState);
    repo.deleteBoardData(BOARD_ID);
    expect(repo.loadCards(BOARD_ID)).toBeNull();
    expect(repo.loadLayout(BOARD_ID)).toBeNull();
  });

  it('loadStateSync returns boards, cards, and layout when all are saved', () => {
    repo.saveBoards(mockBoardsState);
    repo.saveCards(BOARD_ID, mockCardsState);
    repo.saveLayout(BOARD_ID, mockLayoutState);
    const state = repo.loadStateSync();
    expect(state.boards).toEqual(mockBoardsState);
    expect(state.cards).toEqual(mockCardsState);
    expect(state.layout).toEqual(mockLayoutState);
  });

  it('loadStateSync returns only boards when active board has no saved data', () => {
    repo.saveBoards(mockBoardsState);
    const state = repo.loadStateSync();
    expect(state.boards).toEqual(mockBoardsState);
    expect(state.cards).toBeUndefined();
    expect(state.layout).toBeUndefined();
  });

  it('loadStateSync returns all undefined when storage is empty', () => {
    const state = repo.loadStateSync();
    expect(state.boards).toBeUndefined();
    expect(state.cards).toBeUndefined();
    expect(state.layout).toBeUndefined();
  });
});
