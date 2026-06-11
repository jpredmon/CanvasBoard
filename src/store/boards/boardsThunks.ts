import { nanoid } from 'nanoid';
import type { AppThunk } from '../index';
import type { Board } from '../../types';
import { boardsActions } from './boardsSlice';
import { cardsActions } from '../cards/cardsSlice';
import { layoutActions } from '../layout/layoutSlice';

export const createAndSwitchBoard =
  (name: string): AppThunk =>
  (dispatch, _getState, _repository) => {
    const id = nanoid();
    const board: Board = { id, name: name.trim(), createdAt: Date.now() };
    dispatch(boardsActions.addBoard(board));
    dispatch(cardsActions.setCards({ ids: [], entities: {} }));
    dispatch(layoutActions.setLayout([]));
    dispatch(boardsActions.setActiveBoardId(id));
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

    dispatch(cardsActions.setCards(newCards));
    dispatch(layoutActions.setLayout(newLayout.items));
    dispatch(boardsActions.setActiveBoardId(boardId));
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
        dispatch(cardsActions.setCards(newCards));
        dispatch(layoutActions.setLayout(newLayout.items));
        dispatch(boardsActions.setActiveBoardId(nextId));
      } else {
        dispatch(cardsActions.setCards({ ids: [], entities: {} }));
        dispatch(layoutActions.setLayout([]));
        dispatch(boardsActions.setActiveBoardId(null));
      }
    }
  };
