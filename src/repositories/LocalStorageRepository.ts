import { STORAGE_KEYS } from '../constants';
import type { BoardsState, CardsState, LayoutState } from '../types';
import type { BoardRepository } from './BoardRepository';

export class LocalStorageRepository implements BoardRepository {
  private boardCardsKey(boardId: string) {
    return `canvasboard:board:${boardId}:cards`;
  }

  private boardLayoutKey(boardId: string) {
    return `canvasboard:board:${boardId}:layout`;
  }

  private saveCards(boardId: string, state: CardsState): void {
    try {
      localStorage.setItem(this.boardCardsKey(boardId), JSON.stringify(state));
    } catch {
      console.warn('Failed to persist cards.');
    }
  }

  private loadCards(boardId: string): CardsState | null {
    try {
      const raw = localStorage.getItem(this.boardCardsKey(boardId));
      return raw ? (JSON.parse(raw) as CardsState) : null;
    } catch {
      return null;
    }
  }

  private saveLayout(boardId: string, state: LayoutState): void {
    try {
      localStorage.setItem(this.boardLayoutKey(boardId), JSON.stringify(state));
    } catch {
      console.warn('Failed to persist layout.');
    }
  }

  private loadLayout(boardId: string): LayoutState | null {
    try {
      const raw = localStorage.getItem(this.boardLayoutKey(boardId));
      return raw ? (JSON.parse(raw) as LayoutState) : null;
    } catch {
      return null;
    }
  }

  async saveBoards(state: BoardsState): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEYS.boards, JSON.stringify(state));
    } catch {
      console.warn('Failed to persist boards.');
    }
  }

  async loadBoards(): Promise<BoardsState | null> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.boards);
      return raw ? (JSON.parse(raw) as BoardsState) : null;
    } catch {
      return null;
    }
  }

  async saveBoardState(
    boardId: string,
    cards: CardsState,
    layout: LayoutState
  ): Promise<void> {
    this.saveCards(boardId, cards);
    this.saveLayout(boardId, layout);
  }

  async loadBoardState(
    boardId: string
  ): Promise<{ cards: CardsState; layout: LayoutState } | null> {
    const cards = this.loadCards(boardId);
    const layout = this.loadLayout(boardId);
    if (!cards || !layout) return null;
    return { cards, layout };
  }

  async deleteBoardData(boardId: string): Promise<void> {
    try {
      localStorage.removeItem(this.boardCardsKey(boardId));
      localStorage.removeItem(this.boardLayoutKey(boardId));
    } catch {
      console.warn('Failed to delete board data.');
    }
  }

  async loadState(): Promise<{
    cards?: CardsState;
    layout?: LayoutState;
    boards?: BoardsState;
  }> {
    const boards = (await this.loadBoards()) ?? undefined;
    const activeBoardId = boards?.activeBoardId ?? null;
    if (!activeBoardId) return { boards };
    const boardState = await this.loadBoardState(activeBoardId);
    return {
      boards,
      cards: boardState?.cards,
      layout: boardState?.layout,
    };
  }

}
