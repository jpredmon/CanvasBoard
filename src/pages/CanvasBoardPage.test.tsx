import { it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import CanvasBoardPage from './CanvasBoardPage';
import { createStore } from '../store';
import { LocalStorageRepository } from '../repositories/LocalStorageRepository';
import { boardsActions } from '../store/boards/boardsSlice';

beforeEach(() => {
  localStorage.clear();
  document.title = '';
});

function renderPage({ boardName }: { boardName?: string } = {}) {
  const store = createStore(new LocalStorageRepository());
  if (boardName) {
    store.dispatch(boardsActions.addBoard({ id: 'b1', name: boardName, createdAt: 1700000000000 }));
    store.dispatch(boardsActions.setActiveBoardId('b1'));
  }
  return render(<Provider store={store}><CanvasBoardPage /></Provider>);
}

it('sets document title to active board name', () => {
  renderPage({ boardName: 'My Board' });
  expect(document.title).toBe('My Board — CanvasBoard');
});

it('sets document title to CanvasBoard when no board is active', () => {
  renderPage();
  expect(document.title).toBe('CanvasBoard');
});

it('renders a skip link to main content', () => {
  renderPage({ boardName: 'Test Board' });
  const skipLink = screen.getByRole('link', { name: /skip to content/i });
  expect(skipLink).toHaveAttribute('href', '#main-content');
});

it('main element has id main-content', () => {
  renderPage({ boardName: 'Test Board' });
  expect(document.getElementById('main-content')).toBeInTheDocument();
});
