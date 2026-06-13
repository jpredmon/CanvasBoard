import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { expect,it } from 'vitest';
import { axe } from 'vitest-axe';

import { LocalStorageRepository } from '../../repositories/LocalStorageRepository';
import { createStore } from '../../store';
import { NoBoardsState } from './NoBoardsState';

function renderWithStore(ui: React.ReactElement) {
  const store = createStore(new LocalStorageRepository());
  return render(<Provider store={store}>{ui}</Provider>);
}

it('board name input has an accessible label', () => {
  renderWithStore(<NoBoardsState />);
  expect(screen.getByRole('textbox', { name: 'Board name' })).toBeInTheDocument();
});

it('has no accessibility violations', async () => {
  const { container } = renderWithStore(<NoBoardsState />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});

it('renders the primary text as a heading', () => {
  renderWithStore(<NoBoardsState />);
  expect(screen.getByRole('heading', { level: 2, name: /create your first board/i })).toBeInTheDocument();
});
