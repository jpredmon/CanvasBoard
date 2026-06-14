import type { User } from 'firebase/auth';

import type { BoardsState, CardsState, LayoutState } from '../types';
import type { BoardRepository } from './BoardRepository';

const API_URL = import.meta.env.VITE_API_URL as string;

export class HttpRepository implements BoardRepository {
  constructor(private user: User) {}

  private async request<T>(method: string, path: string, body?: unknown): Promise<T | null> {
    const token = await this.user.getIdToken();
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const text = await res.text();
    return text === 'null' ? null : (JSON.parse(text) as T);
  }

  async saveBoards(state: BoardsState): Promise<void> {
    await this.request('PUT', '/api/boards', state);
  }

  async loadBoards(): Promise<BoardsState | null> {
    return this.request<BoardsState>('GET', '/api/boards');
  }

  async saveBoardState(
    boardId: string,
    cards: CardsState,
    layout: LayoutState
  ): Promise<void> {
    await this.request('PUT', `/api/boards/${boardId}/state`, { cards, layout });
  }

  async loadBoardState(
    boardId: string
  ): Promise<{ cards: CardsState; layout: LayoutState } | null> {
    return this.request<{ cards: CardsState; layout: LayoutState }>(
      'GET',
      `/api/boards/${boardId}/state`
    );
  }

  async deleteBoardData(boardId: string): Promise<void> {
    await this.request('DELETE', `/api/boards/${boardId}`);
  }

  async loadState(): Promise<{
    cards?: CardsState;
    layout?: LayoutState;
    boards?: BoardsState;
  }> {
    const boards = await this.loadBoards();
    if (!boards) return {};
    const activeBoardId = boards.activeBoardId;
    if (!activeBoardId) return { boards };
    const boardState = await this.loadBoardState(activeBoardId);
    return {
      boards,
      cards: boardState?.cards,
      layout: boardState?.layout,
    };
  }
}
