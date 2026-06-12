import { createEntityAdapter, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { MediaCard, CardsState } from '../../types';

const adapter = createEntityAdapter<MediaCard>();

const cardsSlice = createSlice({
  name: 'cards',
  initialState: adapter.getInitialState(),
  reducers: {
    addCard: adapter.addOne,
    removeCard: adapter.removeOne,
    setCards(_state, action: PayloadAction<CardsState>) {
      return action.payload;
    },
  },
});

export const cardsActions = cardsSlice.actions;
export const cardsReducer = cardsSlice.reducer;
export const cardsAdapter = adapter;
