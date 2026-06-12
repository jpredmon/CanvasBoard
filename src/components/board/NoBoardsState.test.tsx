import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { NoBoardsState } from './NoBoardsState';
import { createStore } from '../../store';
import { LocalStorageRepository } from '../../repositories/LocalStorageRepository';

function renderWithStore(ui: React.ReactElement) {
  const store = createStore(new LocalStorageRepository());
  return render(<Provider store={store}>{ui}</Provider>);
}

it('board name input has an accessible label', () => {
  renderWithStore(<NoBoardsState />);
  expect(screen.getByRole('textbox', { name: 'Board name' })).toBeInTheDocument();
});
