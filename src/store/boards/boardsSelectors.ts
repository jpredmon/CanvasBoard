import { createSelector } from '@reduxjs/toolkit';

import type { RootState } from '../index';

export const selectAllBoards = createSelector(
  (state: RootState) => state.boards.ids,
  (state: RootState) => state.boards.entities,
  (ids, entities) => ids.map((id) => entities[id]).filter((b): b is NonNullable<typeof b> => b != null),
);

export const selectActiveBoardId = (state: RootState) =>
  state.boards.activeBoardId;

export const selectActiveBoard = (state: RootState) =>
  state.boards.activeBoardId
    ? state.boards.entities[state.boards.activeBoardId]
    : null;
