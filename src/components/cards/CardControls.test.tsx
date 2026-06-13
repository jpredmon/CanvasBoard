import { act, fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { LocalStorageRepository } from '../../repositories/LocalStorageRepository';
import { createStore } from '../../store';
import { boardsActions } from '../../store/boards/boardsSlice';
import { cardsActions } from '../../store/cards/cardsSlice';
import { layoutActions } from '../../store/layout/layoutSlice';
import { CardControls } from './CardControls';

beforeEach(() => localStorage.clear());
afterEach(() => vi.useRealTimers());

function renderCardControls(
  props: { cardId?: string; editMode?: boolean; onDeleteStart?: () => void } = {}
) {
  const { cardId = 'c1', editMode = true, onDeleteStart = vi.fn() } = props;
  const store = createStore(new LocalStorageRepository());
  store.dispatch(boardsActions.addBoard({ id: 'b1', name: 'Board', createdAt: 1700000000000 }));
  store.dispatch(boardsActions.setActiveBoardId('b1'));
  store.dispatch(
    cardsActions.addCard({
      id: 'c1',
      type: 'youtube',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      videoId: 'dQw4w9WgXcQ',
      aspectRatio: '16:9',
      createdAt: 0,
    })
  );
  store.dispatch(
    layoutActions.addLayoutItem({ i: 'c1', x: 0, y: 0, w: 4, h: 3, minW: 2, minH: 2 })
  );
  return {
    store,
    onDeleteStart,
    ...render(
      <Provider store={store}>
        <CardControls cardId={cardId} editMode={editMode} onDeleteStart={onDeleteStart} />
      </Provider>
    ),
  };
}

it('renders nothing when editMode is false', () => {
  const { container } = renderCardControls({ editMode: false });
  expect(container.firstChild).toBeNull();
});

it('shows the delete button when editMode is true', () => {
  renderCardControls();
  expect(screen.getByRole('button', { name: 'Delete card' })).toBeInTheDocument();
});

it('clicking the delete button shows Cancel and Confirm delete buttons', () => {
  renderCardControls();
  fireEvent.click(screen.getByRole('button', { name: 'Delete card' }));
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Confirm delete' })).toBeInTheDocument();
});

it('clicking Cancel returns to the single delete button', () => {
  renderCardControls();
  fireEvent.click(screen.getByRole('button', { name: 'Delete card' }));
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(screen.getByRole('button', { name: 'Delete card' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
});

it('clicking Confirm delete calls onDeleteStart and removes card after 150 ms', () => {
  vi.useFakeTimers();
  const { store, onDeleteStart } = renderCardControls();

  fireEvent.click(screen.getByRole('button', { name: 'Delete card' }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirm delete' }));

  expect(onDeleteStart).toHaveBeenCalledOnce();
  expect(store.getState().cards.ids).toContain('c1');

  act(() => vi.runAllTimers());

  expect(store.getState().cards.ids).not.toContain('c1');
  expect(store.getState().layout.items.map((item) => item.i)).not.toContain('c1');
});
