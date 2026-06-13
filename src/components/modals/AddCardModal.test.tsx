import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import { LocalStorageRepository } from '../../repositories/LocalStorageRepository';
import { createStore } from '../../store';
import { boardsActions } from '../../store/boards/boardsSlice';
import { cardsActions } from '../../store/cards/cardsSlice';
import { uiActions } from '../../store/ui/uiSlice';
import { AddCardModal } from './AddCardModal';

function renderModalWithBoard() {
  const store = createStore(new LocalStorageRepository());
  store.dispatch(
    boardsActions.addBoard({ id: 'b1', name: 'Test Board', createdAt: 1700000000000 })
  );
  store.dispatch(boardsActions.setActiveBoardId('b1'));
  store.dispatch(uiActions.openAddCardModal());
  const { container } = render(
    <Provider store={store}>
      <AddCardModal />
    </Provider>
  );
  return { store, container };
}

it('submitting first card enables edit mode', () => {
  const { store } = renderModalWithBoard();
  fireEvent.change(screen.getByRole('textbox'), {
    target: { value: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  });
  fireEvent.click(screen.getByRole('button', { name: /add/i }));
  const state = store.getState();
  expect(state.ui.editMode).toBe(true);
});

it('submitting subsequent card does not change edit mode', () => {
  const store = createStore(new LocalStorageRepository());
  store.dispatch(
    boardsActions.addBoard({ id: 'b1', name: 'Test Board', createdAt: 1700000000000 })
  );
  store.dispatch(boardsActions.setActiveBoardId('b1'));
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
  store.dispatch(uiActions.setEditMode(false));
  store.dispatch(uiActions.openAddCardModal());
  render(
    <Provider store={store}>
      <AddCardModal />
    </Provider>
  );

  fireEvent.change(screen.getByRole('textbox'), {
    target: { value: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  });
  fireEvent.click(screen.getByRole('button', { name: /add/i }));
  const state = store.getState();
  expect(state.ui.editMode).toBe(false);
});

it('has no accessibility violations', async () => {
  const { container } = renderModalWithBoard();
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
