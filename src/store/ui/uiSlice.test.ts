import { describe, it, expect } from 'vitest';
import { uiReducer, uiActions } from './uiSlice';

describe('uiSlice — setEditMode', () => {
  it('setEditMode(true) enables edit mode', () => {
    const state = uiReducer(undefined, uiActions.setEditMode(true));
    expect(state.editMode).toBe(true);
  });

  it('setEditMode(false) disables edit mode', () => {
    const withEditOn = uiReducer(undefined, uiActions.setEditMode(true));
    const state = uiReducer(withEditOn, uiActions.setEditMode(false));
    expect(state.editMode).toBe(false);
  });

  it('setEditMode does not affect addCardModalOpen', () => {
    const withModalOpen = uiReducer(undefined, uiActions.openAddCardModal());
    const state = uiReducer(withModalOpen, uiActions.setEditMode(true));
    expect(state.addCardModalOpen).toBe(true);
  });
});
