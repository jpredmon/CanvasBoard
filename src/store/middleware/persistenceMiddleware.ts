import type { Middleware } from '@reduxjs/toolkit';

import type { BoardRepository } from '../../repositories/BoardRepository';
import { boardsActions } from '../boards/boardsSlice';
import { cardsActions } from '../cards/cardsSlice';
import type { RootState } from '../index';
import { layoutActions } from '../layout/layoutSlice';
import { uiActions } from '../ui/uiSlice';

const boardsActionTypes = new Set<string>([
  boardsActions.addBoard.type,
  boardsActions.removeBoard.type,
  boardsActions.renameBoard.type,
  boardsActions.setActiveBoardId.type,
]);

const cardLayoutActionTypes = new Set<string>([
  cardsActions.addCard.type,
  cardsActions.removeCard.type,
  cardsActions.setCards.type,
  layoutActions.addLayoutItem.type,
  layoutActions.removeLayoutItem.type,
  layoutActions.updateLayout.type,
  layoutActions.setLayout.type,
]);

export const createPersistenceMiddleware =
  (repository: BoardRepository): Middleware<object, RootState> =>
  (store) =>
  (next) =>
  (action) => {
    const result = next(action);
    const state = store.getState();
    const actionType = (action as { type: string }).type;

    if (boardsActionTypes.has(actionType)) {
      repository.saveBoards(state.boards).catch(() => {
        store.dispatch(uiActions.setSaveError(true));
      });
    }

    if (cardLayoutActionTypes.has(actionType)) {
      const boardId = state.boards.activeBoardId;
      if (boardId) {
        repository.saveBoardState(boardId, state.cards, state.layout).catch(() => {
          store.dispatch(uiActions.setSaveError(true));
        });
      }
    }

    return result;
  };
