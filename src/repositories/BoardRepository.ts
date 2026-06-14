import type { BoardsState, CardsState, LayoutState } from '../types';

export interface BoardRepository {
  saveBoards(state: BoardsState): Promise<void>;
  loadBoards(): Promise<BoardsState | null>;
  saveBoardState(boardId: string, cards: CardsState, layout: LayoutState): Promise<void>;
  loadBoardState(
    boardId: string
  ): Promise<{ cards: CardsState; layout: LayoutState } | null>;
  deleteBoardData(boardId: string): Promise<void>;
  loadState(): Promise<{ cards?: CardsState; layout?: LayoutState; boards?: BoardsState }>;
}
