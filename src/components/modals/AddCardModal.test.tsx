import { it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { AddCardModal } from './AddCardModal';
import { createStore } from '../../store';
import { LocalStorageRepository } from '../../repositories/LocalStorageRepository';
import { boardsActions } from '../../store/boards/boardsSlice';
import { uiActions } from '../../store/ui/uiSlice';
import { cardsActions } from '../../store/cards/cardsSlice';

function renderModalWithBoard() {
  const store = createStore(new LocalStorageRepository());
  store.dispatch(
    boardsActions.addBoard({ id: 'b1', name: 'Test Board', createdAt: 1700000000000 })
  );
  store.dispatch(boardsActions.setActiveBoardId('b1'));
  store.dispatch(uiActions.openAddCardModal());
  render(
    <Provider store={store}>
      <AddCardModal />
    </Provider>
  );
  return store;
}

it('submitting first card enables edit mode', () => {
  const store = renderModalWithBoard();
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' } });
  fireEvent.click(screen.getByRole('button', { name: /add/i }));
  const state = store.getState();
  expect(state.ui.editMode).toBe(true);
});

it('submitting subsequent card does not change edit mode', () => {
  const store = renderModalWithBoard();
  // Pre-populate the store with an existing card so cardCount > 0
  store.dispatch(
    cardsActions.addCard({
      id: 'existing-card',
      type: 'youtube',
      url: 'https://www.youtube.com/watch?v=existing',
      videoId: 'existing',
      aspectRatio: '16:9',
      createdAt: 1700000000000,
    })
  );
  // Ensure editMode starts as false
  store.dispatch(uiActions.setEditMode(false));

  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' } });
  fireEvent.click(screen.getByRole('button', { name: /add/i }));
  const state = store.getState();
  expect(state.ui.editMode).toBe(false);
});
