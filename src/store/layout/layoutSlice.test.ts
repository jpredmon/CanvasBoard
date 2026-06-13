import { describe, expect,it } from 'vitest';

import type { CardLayout } from '../../types';
import { layoutActions,layoutReducer } from './layoutSlice';

const item: CardLayout = { i: 'card-1', x: 0, y: 0, w: 4, h: 3, minW: 2, minH: 2 };

describe('layoutSlice', () => {
  it('starts with empty items', () => {
    const state = layoutReducer(undefined, { type: '@@init' });
    expect(state.items).toEqual([]);
  });

  it('addLayoutItem appends the item', () => {
    const state = layoutReducer(undefined, layoutActions.addLayoutItem(item));
    expect(state.items).toHaveLength(1);
    expect(state.items[0]).toEqual(item);
  });

  it('removeLayoutItem removes by id', () => {
    let state = layoutReducer(undefined, layoutActions.addLayoutItem(item));
    state = layoutReducer(state, layoutActions.removeLayoutItem('card-1'));
    expect(state.items).toHaveLength(0);
  });

  it('updateLayout replaces all items', () => {
    let state = layoutReducer(undefined, layoutActions.addLayoutItem(item));
    const updated: CardLayout = { ...item, x: 4, y: 2 };
    state = layoutReducer(state, layoutActions.updateLayout([updated]));
    expect(state.items).toHaveLength(1);
    expect(state.items[0]).toEqual(updated);
  });

  it('setLayout replaces the entire items array', () => {
    let state = layoutReducer(undefined, layoutActions.addLayoutItem(item));
    state = layoutReducer(state, layoutActions.setLayout([]));
    expect(state.items).toHaveLength(0);
  });
});
