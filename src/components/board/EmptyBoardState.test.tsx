import { it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { EmptyBoardState } from './EmptyBoardState';
import { createStore } from '../../store';
import { LocalStorageRepository } from '../../repositories/LocalStorageRepository';

beforeEach(() => localStorage.clear());

function renderWithStore() {
  const store = createStore(new LocalStorageRepository());
  return { store, ...render(<Provider store={store}><EmptyBoardState /></Provider>) };
}

it('renders the h2 heading', () => {
  renderWithStore();
  expect(
    screen.getByRole('heading', { level: 2, name: /curate your video world/i })
  ).toBeInTheDocument();
});

it('renders the Add Card button', () => {
  renderWithStore();
  expect(screen.getByRole('button', { name: /\+ add card/i })).toBeInTheDocument();
});

it('clicking Add Card opens the modal', () => {
  const { store } = renderWithStore();
  expect(store.getState().ui.addCardModalOpen).toBe(false);
  fireEvent.click(screen.getByRole('button', { name: /\+ add card/i }));
  expect(store.getState().ui.addCardModalOpen).toBe(true);
});
