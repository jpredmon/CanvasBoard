import { STORAGE_KEYS } from '../constants';
import type { BoardRepository } from './BoardRepository';
import type { CardsState, LayoutState } from '../types';

export class LocalStorageRepository implements BoardRepository {
  saveCards(state: CardsState): void {
    try {
      localStorage.setItem(STORAGE_KEYS.cards, JSON.stringify(state));
    } catch {
      console.warn('Failed to persist cards.');
    }
  }

  loadCards(): CardsState | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.cards);
      return raw ? (JSON.parse(raw) as CardsState) : null;
    } catch {
      return null;
    }
  }

  saveLayout(state: LayoutState): void {
    try {
      localStorage.setItem(STORAGE_KEYS.layout, JSON.stringify(state));
    } catch {
      console.warn('Failed to persist layout.');
    }
  }

  loadLayout(): LayoutState | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.layout);
      return raw ? (JSON.parse(raw) as LayoutState) : null;
    } catch {
      return null;
    }
  }

  loadStateSync() {
    return {
      cards: this.loadCards() ?? undefined,
      layout: this.loadLayout() ?? undefined,
    };
  }
}
