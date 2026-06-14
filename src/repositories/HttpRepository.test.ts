import type { User } from 'firebase/auth';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { BoardsState, CardsState, LayoutState } from '../types';
import { HttpRepository } from './HttpRepository';

const mockUser = {
  getIdToken: vi.fn().mockResolvedValue('fake-token'),
} as unknown as User;

const mockFetch = vi.fn();
global.fetch = mockFetch;

const BOARDS: BoardsState = {
  ids: ['b1'],
  activeBoardId: 'b1',
  entities: { b1: { id: 'b1', name: 'Board 1', createdAt: 1700000000000 } },
};
const CARDS: CardsState = { ids: [], entities: {} };
const LAYOUT: LayoutState = { items: [] };

function ok(body: unknown) {
  return { ok: true, text: () => Promise.resolve(JSON.stringify(body)) };
}

describe('HttpRepository', () => {
  let repo: HttpRepository;

  beforeEach(() => {
    repo = new HttpRepository(mockUser);
    vi.clearAllMocks();
  });

  it('loadBoards sends GET /api/boards with Bearer token', async () => {
    mockFetch.mockResolvedValue(ok(BOARDS));
    const result = await repo.loadBoards();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/boards'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ Authorization: 'Bearer fake-token' }),
      })
    );
    expect(result).toEqual(BOARDS);
  });

  it('loadBoards returns null when server returns null', async () => {
    mockFetch.mockResolvedValue(ok(null));
    expect(await repo.loadBoards()).toBeNull();
  });

  it('saveBoards sends PUT /api/boards with serialized body', async () => {
    mockFetch.mockResolvedValue(ok({}));
    await repo.saveBoards(BOARDS);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/boards'),
      expect.objectContaining({ method: 'PUT', body: JSON.stringify(BOARDS) })
    );
  });

  it('loadBoardState sends GET /api/boards/:id/state', async () => {
    mockFetch.mockResolvedValue(ok({ cards: CARDS, layout: LAYOUT }));
    const result = await repo.loadBoardState('b1');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/boards/b1/state'),
      expect.objectContaining({ method: 'GET' })
    );
    expect(result).toEqual({ cards: CARDS, layout: LAYOUT });
  });

  it('loadBoardState returns null when server returns null', async () => {
    mockFetch.mockResolvedValue(ok(null));
    expect(await repo.loadBoardState('b1')).toBeNull();
  });

  it('saveBoardState sends PUT /api/boards/:id/state with cards and layout', async () => {
    mockFetch.mockResolvedValue(ok({}));
    await repo.saveBoardState('b1', CARDS, LAYOUT);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/boards/b1/state'),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ cards: CARDS, layout: LAYOUT }),
      })
    );
  });

  it('deleteBoardData sends DELETE /api/boards/:id', async () => {
    mockFetch.mockResolvedValue(ok({}));
    await repo.deleteBoardData('b1');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/boards/b1'),
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('throws on non-OK response', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 401 });
    await expect(repo.loadBoards()).rejects.toThrow('API error: 401');
  });
});
