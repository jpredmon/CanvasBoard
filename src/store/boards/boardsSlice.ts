import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Board, BoardsState } from '../../types';

const initialState: BoardsState = {
  ids: [],
  activeBoardId: null,
  entities: {},
};

const boardsSlice = createSlice({
  name: 'boards',
  initialState,
  reducers: {
    addBoard(state, action: PayloadAction<Board>) {
      const board = action.payload;
      state.ids.push(board.id);
      state.entities[board.id] = board;
    },
    removeBoard(state, action: PayloadAction<string>) {
      const id = action.payload;
      state.ids = state.ids.filter((i) => i !== id);
      delete state.entities[id];
    },
    renameBoard(state, action: PayloadAction<{ id: string; name: string }>) {
      const { id, name } = action.payload;
      if (state.entities[id]) {
        state.entities[id].name = name;
      }
    },
    setActiveBoardId(state, action: PayloadAction<string | null>) {
      state.activeBoardId = action.payload;
    },
  },
});

export const boardsActions = boardsSlice.actions;
export const boardsReducer = boardsSlice.reducer;
