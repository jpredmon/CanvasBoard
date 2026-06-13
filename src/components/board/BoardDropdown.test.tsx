import { it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { Provider } from 'react-redux';
import { BoardDropdown } from './BoardDropdown';
import { createStore } from '../../store';
import { LocalStorageRepository } from '../../repositories/LocalStorageRepository';
import { boardsActions } from '../../store/boards/boardsSlice';

beforeEach(() => {
  localStorage.clear();
});

function renderDropdownWithBoard(onClose = vi.fn()) {
  const store = createStore(new LocalStorageRepository());
  store.dispatch(
    boardsActions.addBoard({ id: 'b1', name: 'Board One', createdAt: 1700000000000 })
  );
  store.dispatch(
    boardsActions.addBoard({ id: 'b2', name: 'Board Two', createdAt: 1700000001000 })
  );
  store.dispatch(boardsActions.setActiveBoardId('b1'));
  const triggerButton = document.createElement('button');
  document.body.appendChild(triggerButton);
  const triggerRef = { current: triggerButton };
  const { container } = render(
    <Provider store={store}>
      <BoardDropdown onClose={onClose} triggerRef={triggerRef} />
    </Provider>
  );
  return { store, container, triggerRef, onClose };
}

it('rename input has an accessible label', () => {
  renderDropdownWithBoard();
  fireEvent.click(screen.getByRole('menuitem', { name: 'Rename Board One' }));
  expect(screen.getByRole('textbox', { name: 'Rename board' })).toBeInTheDocument();
});

it('new board input has an accessible label', () => {
  renderDropdownWithBoard();
  fireEvent.click(screen.getByRole('button', { name: '+ New Board' }));
  expect(screen.getByRole('textbox', { name: 'New board name' })).toBeInTheDocument();
});

it('has no accessibility violations', async () => {
  const { container } = renderDropdownWithBoard();
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});

it('focuses first board button on mount', () => {
  renderDropdownWithBoard();
  expect(document.activeElement).toBe(
    screen.getByRole('menuitem', { name: 'Board One' })
  );
});

it('moves focus to next board button on ArrowDown', () => {
  renderDropdownWithBoard();
  const menu = screen.getByRole('menu');
  fireEvent.keyDown(menu, { key: 'ArrowDown' });
  expect(document.activeElement).toBe(
    screen.getByRole('menuitem', { name: 'Board Two' })
  );
});

it('calls onClose and focuses trigger on Escape', () => {
  const { onClose, triggerRef } = renderDropdownWithBoard();
  const menu = screen.getByRole('menu');
  triggerRef.current.focus = vi.fn();
  fireEvent.keyDown(menu, { key: 'Escape' });
  expect(onClose).toHaveBeenCalledOnce();
  expect(triggerRef.current.focus).toHaveBeenCalled();
});
