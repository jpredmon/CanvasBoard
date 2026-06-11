import { nanoid } from 'nanoid';
import type { AppThunk } from '../index';
import type { Board } from '../../types';
import { boardsActions } from './boardsSlice';
import { cardsActions } from '../cards/cardsSlice';
import { layoutActions } from '../layout/layoutSlice';

export const createAndSwitchBoard =
  (name: string): AppThunk =>
  (dispatch, getState, repository) => {
    const { boards, cards, layout } = getState();
    const currentBoardId = boards.activeBoardId;
    if (currentBoardId) {
      repository.saveCards(currentBoardId, cards);
      repository.saveLayout(currentBoardId, layout);
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
      repository.saveCards(currentBoardId, cards);
      repository.saveLayout(currentBoardId, layout);
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
