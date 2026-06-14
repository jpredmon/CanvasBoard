import type { Action, ThunkAction } from '@reduxjs/toolkit';
import { configureStore } from '@reduxjs/toolkit';

import type { BoardRepository } from '../repositories/BoardRepository';
import type { BoardsState, CardsState, LayoutState } from '../types';
import { boardsReducer } from './boards/boardsSlice';
import { cardsReducer } from './cards/cardsSlice';
import { layoutReducer } from './layout/layoutSlice';
import { createPersistenceMiddleware } from './middleware/persistenceMiddleware';
import { uiReducer } from './ui/uiSlice';

export type RootState = {
  cards: ReturnType<typeof cardsReducer>;
  layout: ReturnType<typeof layoutReducer>;
  ui: ReturnType<typeof uiReducer>;
  boards: ReturnType<typeof boardsReducer>;
};

export function createStore(
  repository: BoardRepository,
  preloaded: { boards?: BoardsState; cards?: CardsState; layout?: LayoutState } = {}
) {
  return configureStore({
    reducer: {
      cards: cardsReducer,
      layout: layoutReducer,
      ui: uiReducer,
      boards: boardsReducer,
    },
    preloadedState: preloaded as Parameters<typeof configureStore>[0]['preloadedState'],
    middleware: (getDefault) =>
      getDefault({ thunk: { extraArgument: repository } }).concat(
        createPersistenceMiddleware(repository)
      ),
  });
}

export type AppDispatch = ReturnType<typeof createStore>['dispatch'];
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  BoardRepository,
  Action<string>
>;
