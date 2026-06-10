import type { RootState } from '../index';

export const selectLayout = (state: RootState) => state.layout.items;
