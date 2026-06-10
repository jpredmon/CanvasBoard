import type { CardsState, LayoutState } from '../types';

export interface BoardRepository {
  saveCards(state: CardsState): void;
  loadCards(): CardsState | null;
  saveLayout(state: LayoutState): void;
  loadLayout(): LayoutState | null;
  loadStateSync(): { cards?: CardsState; layout?: LayoutState };
}
