import type { RootState } from '../index';
import { cardsAdapter } from './cardsSlice';

const selectors = cardsAdapter.getSelectors<RootState>((state) => state.cards);

export const selectAllCards = selectors.selectAll;
export const selectCardById = selectors.selectById;
export const selectCardCount = selectors.selectTotal;
