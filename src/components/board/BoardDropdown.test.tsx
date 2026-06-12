import { it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BoardDropdown } from './BoardDropdown';
import { createStore } from '../../store';
import { LocalStorageRepository } from '../../repositories/LocalStorageRepository';
import { boardsActions } from '../../store/boards/boardsSlice';

function renderDropdownWithBoard() {
  const store = createStore(new LocalStorageRepository());
  store.dispatch(
    boardsActions.addBoard({ id: 'b1', name: 'Test Board', createdAt: 1700000000000 })
  );
  store.dispatch(boardsActions.setActiveBoardId('b1'));
  render(
    <Provider store={store}>
      <BoardDropdown onClose={() => {}} />
    </Provider>
  );
  return store;
}

it('rename input has an accessible label', () => {
  renderDropdownWithBoard();
  fireEvent.click(screen.getByRole('button', { name: 'Rename Test Board' }));
  expect(screen.getByRole('textbox', { name: 'Rename board' })).toBeInTheDocument();
});

it('new board input has an accessible label', () => {
  renderDropdownWithBoard();
  fireEvent.click(screen.getByRole('button', { name: '+ New Board' }));
  expect(screen.getByRole('textbox', { name: 'New board name' })).toBeInTheDocument();
});
