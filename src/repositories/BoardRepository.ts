import type { CardsState, LayoutState, BoardsState } from '../types';

export interface BoardRepository {
  saveCards(boardId: string, state: CardsState): void;
  loadCards(boardId: string): CardsState | null;
  saveLayout(boardId: string, state: LayoutState): void;
  loadLayout(boardId: string): LayoutState | null;
  saveBoards(state: BoardsState): void;
  loadBoards(): BoardsState | null;
  deleteBoardData(boardId: string): void;
  loadStateSync(): { cards?: CardsState; layout?: LayoutState; boards?: BoardsState };
}
