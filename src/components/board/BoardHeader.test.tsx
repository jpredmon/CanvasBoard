import { it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BoardHeader } from './BoardHeader';
import { createStore } from '../../store';
import { LocalStorageRepository } from '../../repositories/LocalStorageRepository';
import { boardsActions } from '../../store/boards/boardsSlice';
import { cardsActions } from '../../store/cards/cardsSlice';
import { MAX_CARDS } from '../../constants';
import type { YouTubeCard } from '../../types';

beforeEach(() => localStorage.clear());

function renderWithStore({ withBoard = true } = {}) {
  const store = createStore(new LocalStorageRepository());
  if (withBoard) {
    store.dispatch(
      boardsActions.addBoard({ id: 'b1', name: 'Test Board', createdAt: 1700000000000 })
    );
    store.dispatch(boardsActions.setActiveBoardId('b1'));
  }
  return { store, ...render(<Provider store={store}><BoardHeader /></Provider>) };
}

function mockCard(id: string): YouTubeCard {
  return {
    id,
    type: 'youtube',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    videoId: 'dQw4w9WgXcQ',
    aspectRatio: '16:9',
    createdAt: 0,
  };
}

it('renders Add Card and Edit buttons when a board is active', () => {
  renderWithStore();
  expect(screen.getByRole('button', { name: 'Add card' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
});

it('renders no Add Card or Edit button when no board is active', () => {
  renderWithStore({ withBoard: false });
  expect(screen.queryByRole('button', { name: 'Add card' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
});

it('Add Card button is disabled when card count reaches MAX_CARDS', () => {
  const store = createStore(new LocalStorageRepository());
  store.dispatch(
    boardsActions.addBoard({ id: 'b1', name: 'Test Board', createdAt: 1700000000000 })
  );
  store.dispatch(boardsActions.setActiveBoardId('b1'));
  const ids = Array.from({ length: MAX_CARDS }, (_, i) => `card-${i}`);
  store.dispatch(
    cardsActions.setCards({
      ids,
      entities: Object.fromEntries(ids.map((id) => [id, mockCard(id)])),
    })
  );
  render(<Provider store={store}><BoardHeader /></Provider>);
  expect(screen.getByRole('button', { name: 'Add card' })).toBeDisabled();
});

it('clicking Edit toggles edit mode in the store', () => {
  const { store } = renderWithStore();
  expect(store.getState().ui.editMode).toBe(false);
  fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
  expect(store.getState().ui.editMode).toBe(true);
});

it('clicking Add Card opens the add-card modal', () => {
  const { store } = renderWithStore();
  expect(store.getState().ui.addCardModalOpen).toBe(false);
  fireEvent.click(screen.getByRole('button', { name: 'Add card' }));
  expect(store.getState().ui.addCardModalOpen).toBe(true);
});
