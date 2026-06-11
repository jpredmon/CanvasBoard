import type { RootState } from '../index';

export const selectAllBoards = (state: RootState) =>
  state.boards.ids.map((id) => state.boards.entities[id]);

export const selectActiveBoardId = (state: RootState) =>
  state.boards.activeBoardId;

export const selectActiveBoard = (state: RootState) =>
  state.boards.activeBoardId
    ? state.boards.entities[state.boards.activeBoardId]
    : null;
