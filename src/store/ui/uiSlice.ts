import { createSlice } from '@reduxjs/toolkit';
import type { UIState } from '../../types';

const initialState: UIState = {
  addCardModalOpen: false,
  editMode: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openAddCardModal(state) {
      state.addCardModalOpen = true;
    },
    closeAddCardModal(state) {
      state.addCardModalOpen = false;
    },
    toggleEditMode(state) {
      state.editMode = !state.editMode;
    },
  },
});

export const uiActions = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
