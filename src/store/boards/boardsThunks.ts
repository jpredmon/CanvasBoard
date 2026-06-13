import { nanoid } from 'nanoid';
import type { AppThunk } from '../index';
import type { Board, CardsState, LayoutState } from '../../types';
import type { BoardRepository } from '../../repositories/BoardRepository';
import { boardsActions } from './boardsSlice';
import { cardsActions } from '../cards/cardsSlice';
import { layoutActions } from '../layout/layoutSlice';

function persistBoard(
  repository: BoardRepository,
  boardId: string,
  cards: CardsState,
  layout: LayoutState,
): void {
  repository.saveCards(boardId, cards);
  repository.saveLayout(boardId, layout);
}

export const createAndSwitchBoard =
  (name: string): AppThunk =>
  (dispatch, getState, repository) => {
    const { boards, cards, layout } = getState();
    const currentBoardId = boards.activeBoardId;
    if (currentBoardId) {
      persistBoard(repository, currentBoardId, cards, layout);
    }
    const id = nanoid();
    const board: Board = { id, name: name.trim(), createdAt: Date.now() };
    dispatch(boardsActions.addBoard(board));
    dispatch(boardsActions.setActiveBoardId(id));
    dispatch(cardsActions.setCards({ ids: [], entities: {} }));
    dispatch(layoutActions.setLayout([]));
  };

export const switchBoard =
  (boardId: string): AppThunk =>
  (dispatch, getState, repository) => {
    const { boards, cards, layout } = getState();
    const currentBoardId = boards.activeBoardId;

    if (currentBoardId && currentBoardId !== boardId) {
      persistBoard(repository, currentBoardId, cards, layout);
    }

    const newCards = repository.loadCards(boardId) ?? { ids: [], entities: {} };
    const newLayout = repository.loadLayout(boardId) ?? { items: [] };

    dispatch(boardsActions.setActiveBoardId(boardId));
    dispatch(cardsActions.setCards(newCards));
    dispatch(layoutActions.setLayout(newLayout.items));
  };

export const deleteBoard =
  (boardId: string): AppThunk =>
  (dispatch, getState, repository) => {
    const { boards } = getState();
    const isActive = boards.activeBoardId === boardId;
    const remainingIds = boards.ids.filter((id) => id !== boardId);

    dispatch(boardsActions.removeBoard(boardId));
    repository.deleteBoardData(boardId);

    if (isActive) {
      if (remainingIds.length > 0) {
        const nextId = remainingIds[0];
        const newCards = repository.loadCards(nextId) ?? { ids: [], entities: {} };
        const newLayout = repository.loadLayout(nextId) ?? { items: [] };
        dispatch(boardsActions.setActiveBoardId(nextId));
        dispatch(cardsActions.setCards(newCards));
        dispatch(layoutActions.setLayout(newLayout.items));
      } else {
        dispatch(boardsActions.setActiveBoardId(null));
        dispatch(cardsActions.setCards({ ids: [], entities: {} }));
        dispatch(layoutActions.setLayout([]));
      }
    }
  };
