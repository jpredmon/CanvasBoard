import { createEntityAdapter, createSlice } from '@reduxjs/toolkit';
import type { MediaCard } from '../../types';

const adapter = createEntityAdapter<MediaCard>();

const cardsSlice = createSlice({
  name: 'cards',
  initialState: adapter.getInitialState(),
  reducers: {
    addCard: adapter.addOne,
    removeCard: adapter.removeOne,
  },
});

export const cardsActions = cardsSlice.actions;
export const cardsReducer = cardsSlice.reducer;
export const cardsAdapter = adapter;
