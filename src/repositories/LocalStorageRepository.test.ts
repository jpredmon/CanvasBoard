import { beforeEach, describe, expect, it } from 'vitest';

import type { BoardsState, CardsState, LayoutState } from '../types';
import { LocalStorageRepository } from './LocalStorageRepository';

const BOARD_ID = 'board-test-123';

const mockCards: CardsState = {
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

const mockLayout: LayoutState = {
  items: [{ i: 'card-1', x: 0, y: 0, w: 4, h: 3, minW: 2, minH: 2 }],
};

const mockBoards: BoardsState = {
  ids: [BOARD_ID],
  activeBoardId: BOARD_ID,
  entities: { [BOARD_ID]: { id: BOARD_ID, name: 'Test Board', createdAt: 1700000000000 } },
};

describe('LocalStorageRepository', () => {
  let repo: LocalStorageRepository;

  beforeEach(() => {
    localStorage.clear();
    repo = new LocalStorageRepository();
  });

  it('saveBoardState and loadBoardState round-trip', async () => {
    await repo.saveBoardState(BOARD_ID, mockCards, mockLayout);
    const state = await repo.loadBoardState(BOARD_ID);
    expect(state?.cards).toEqual(mockCards);
    expect(state?.layout).toEqual(mockLayout);
  });

  it('loadBoardState returns null when storage is empty', async () => {
    expect(await repo.loadBoardState(BOARD_ID)).toBeNull();
  });

  it('loadBoardState returns null when cards are corrupt JSON', async () => {
    localStorage.setItem(`canvasboard:board:${BOARD_ID}:cards`, 'not-json{{{');
    expect(await repo.loadBoardState(BOARD_ID)).toBeNull();
  });

  it('loadBoardState returns null when layout is corrupt JSON', async () => {
    localStorage.setItem(`canvasboard:board:${BOARD_ID}:layout`, 'not-json{{{');
    expect(await repo.loadBoardState(BOARD_ID)).toBeNull();
  });

  it('saveBoards and loadBoards round-trip', async () => {
    await repo.saveBoards(mockBoards);
    expect(await repo.loadBoards()).toEqual(mockBoards);
  });

  it('loadBoards returns null when storage is empty', async () => {
    expect(await repo.loadBoards()).toBeNull();
  });

  it('deleteBoardData removes board state', async () => {
    await repo.saveBoardState(BOARD_ID, mockCards, mockLayout);
    await repo.deleteBoardData(BOARD_ID);
    expect(await repo.loadBoardState(BOARD_ID)).toBeNull();
  });

  it('loadState returns boards, cards, and layout when all are saved', async () => {
    await repo.saveBoards(mockBoards);
    await repo.saveBoardState(BOARD_ID, mockCards, mockLayout);
    const state = await repo.loadState();
    expect(state.boards).toEqual(mockBoards);
    expect(state.cards).toEqual(mockCards);
    expect(state.layout).toEqual(mockLayout);
  });

  it('loadState returns only boards when active board has no saved data', async () => {
    await repo.saveBoards(mockBoards);
    const state = await repo.loadState();
    expect(state.boards).toEqual(mockBoards);
    expect(state.cards).toBeUndefined();
    expect(state.layout).toBeUndefined();
  });

  it('loadState returns all undefined when storage is empty', async () => {
    const state = await repo.loadState();
    expect(state.boards).toBeUndefined();
    expect(state.cards).toBeUndefined();
    expect(state.layout).toBeUndefined();
  });
});
