import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CardLayout, LayoutState } from '../../types';

const initialState: LayoutState = { items: [] };

const layoutSlice = createSlice({
  name: 'layout',
  initialState,
  reducers: {
    addLayoutItem(state, action: PayloadAction<CardLayout>) {
      state.items.push(action.payload);
    },
    removeLayoutItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.i !== action.payload);
    },
    updateLayout(state, action: PayloadAction<CardLayout[]>) {
      state.items = action.payload;
    },
  },
});

export const layoutActions = layoutSlice.actions;
export const layoutReducer = layoutSlice.reducer;
