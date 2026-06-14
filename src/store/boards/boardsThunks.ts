import { nanoid } from 'nanoid';

import type { Board, CardsState } from '../../types';
import { cardsActions } from '../cards/cardsSlice';
import type { AppThunk } from '../index';
import { layoutActions } from '../layout/layoutSlice';
import { boardsActions } from './boardsSlice';

const EMPTY_CARDS: CardsState = { ids: [], entities: {} };

export const createAndSwitchBoard =
  (name: string): AppThunk =>
  (dispatch, getState, repository) => {
    const { boards, cards, layout } = getState();
    const currentBoardId = boards.activeBoardId;
    if (currentBoardId) {
      repository.saveBoardState(currentBoardId, cards, layout).catch(() => {});
    }
    const id = nanoid();
    const board: Board = { id, name: name.trim(), createdAt: Date.now() };
    dispatch(boardsActions.addBoard(board));
    dispatch(boardsActions.setActiveBoardId(id));
    dispatch(cardsActions.setCards(EMPTY_CARDS));
    dispatch(layoutActions.setLayout([]));
  };

export const switchBoard =
  (boardId: string): AppThunk<Promise<void>> =>
  async (dispatch, getState, repository) => {
    const { boards, cards, layout } = getState();
    const currentBoardId = boards.activeBoardId;

    if (currentBoardId && currentBoardId !== boardId) {
      await repository.saveBoardState(currentBoardId, cards, layout);
    }

    const boardState = await repository.loadBoardState(boardId);
    dispatch(boardsActions.setActiveBoardId(boardId));
    dispatch(cardsActions.setCards(boardState?.cards ?? EMPTY_CARDS));
    dispatch(layoutActions.setLayout(boardState?.layout.items ?? []));
  };

export const deleteBoard =
  (boardId: string): AppThunk<Promise<void>> =>
  async (dispatch, getState, repository) => {
    const { boards } = getState();
    const isActive = boards.activeBoardId === boardId;
    const remainingIds = boards.ids.filter((id) => id !== boardId);

    dispatch(boardsActions.removeBoard(boardId));
    await repository.deleteBoardData(boardId);

    if (isActive) {
      if (remainingIds.length > 0) {
        const nextId = remainingIds[0]!;
        const boardState = await repository.loadBoardState(nextId);
        dispatch(boardsActions.setActiveBoardId(nextId));
        dispatch(cardsActions.setCards(boardState?.cards ?? EMPTY_CARDS));
        dispatch(layoutActions.setLayout(boardState?.layout.items ?? []));
      } else {
        dispatch(boardsActions.setActiveBoardId(null));
        dispatch(cardsActions.setCards(EMPTY_CARDS));
        dispatch(layoutActions.setLayout([]));
      }
    }
  };
