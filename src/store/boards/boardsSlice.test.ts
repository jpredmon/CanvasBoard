import { describe, expect, it } from 'vitest';

import type { Board } from '../../types';
import { boardsActions, boardsReducer } from './boardsSlice';

const board: Board = { id: 'b1', name: 'Work', createdAt: 1700000000000 };

describe('boardsSlice', () => {
  it('starts with empty state', () => {
    const state = boardsReducer(undefined, { type: '@@init' });
    expect(state.ids).toEqual([]);
    expect(state.entities).toEqual({});
    expect(state.activeBoardId).toBeNull();
  });

  it('addBoard inserts entity and updates ids', () => {
    const state = boardsReducer(undefined, boardsActions.addBoard(board));
    expect(state.ids).toContain('b1');
    expect(state.entities['b1']).toEqual(board);
  });

  it('removeBoard removes entity and updates ids', () => {
    let state = boardsReducer(undefined, boardsActions.addBoard(board));
    state = boardsReducer(state, boardsActions.removeBoard('b1'));
    expect(state.ids).not.toContain('b1');
    expect(state.entities['b1']).toBeUndefined();
  });

  it('renameBoard updates name in entities', () => {
    let state = boardsReducer(undefined, boardsActions.addBoard(board));
    state = boardsReducer(state, boardsActions.renameBoard({ id: 'b1', name: 'Updated' }));
    expect(state.entities['b1'].name).toBe('Updated');
  });

  it('setActiveBoardId sets the active board', () => {
    let state = boardsReducer(undefined, boardsActions.addBoard(board));
    state = boardsReducer(state, boardsActions.setActiveBoardId('b1'));
    expect(state.activeBoardId).toBe('b1');
  });

  it('setActiveBoardId accepts null', () => {
    let state = boardsReducer(undefined, boardsActions.addBoard(board));
    state = boardsReducer(state, boardsActions.setActiveBoardId('b1'));
    state = boardsReducer(state, boardsActions.setActiveBoardId(null));
    expect(state.activeBoardId).toBeNull();
  });
});
