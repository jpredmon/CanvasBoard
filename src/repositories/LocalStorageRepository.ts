import { STORAGE_KEYS } from '../constants';
import type { BoardsState,CardsState, LayoutState } from '../types';
import type { BoardRepository } from './BoardRepository';

export class LocalStorageRepository implements BoardRepository {
  private boardCardsKey(boardId: string) {
    return `canvasboard:board:${boardId}:cards`;
  }

  private boardLayoutKey(boardId: string) {
    return `canvasboard:board:${boardId}:layout`;
  }

  saveCards(boardId: string, state: CardsState): void {
    try {
      localStorage.setItem(this.boardCardsKey(boardId), JSON.stringify(state));
    } catch {
      console.warn('Failed to persist cards.');
    }
  }

  loadCards(boardId: string): CardsState | null {
    try {
      const raw = localStorage.getItem(this.boardCardsKey(boardId));
      return raw ? (JSON.parse(raw) as CardsState) : null;
    } catch {
      return null;
    }
  }

  saveLayout(boardId: string, state: LayoutState): void {
    try {
      localStorage.setItem(this.boardLayoutKey(boardId), JSON.stringify(state));
    } catch {
      console.warn('Failed to persist layout.');
    }
  }

  loadLayout(boardId: string): LayoutState | null {
    try {
      const raw = localStorage.getItem(this.boardLayoutKey(boardId));
      return raw ? (JSON.parse(raw) as LayoutState) : null;
    } catch {
      return null;
    }
  }

  saveBoards(state: BoardsState): void {
    try {
      localStorage.setItem(STORAGE_KEYS.boards, JSON.stringify(state));
    } catch {
      console.warn('Failed to persist boards.');
    }
  }

  loadBoards(): BoardsState | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.boards);
      return raw ? (JSON.parse(raw) as BoardsState) : null;
    } catch {
      return null;
    }
  }

  deleteBoardData(boardId: string): void {
    try {
      localStorage.removeItem(this.boardCardsKey(boardId));
      localStorage.removeItem(this.boardLayoutKey(boardId));
    } catch {
      console.warn('Failed to delete board data.');
    }
  }

  loadStateSync() {
    const boards = this.loadBoards() ?? undefined;
    const activeBoardId = boards?.activeBoardId ?? null;
    return {
      boards,
      cards: activeBoardId ? (this.loadCards(activeBoardId) ?? undefined) : undefined,
      layout: activeBoardId ? (this.loadLayout(activeBoardId) ?? undefined) : undefined,
    };
  }
}
