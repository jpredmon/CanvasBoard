import { configureStore } from '@reduxjs/toolkit';
import type { ThunkAction, Action } from '@reduxjs/toolkit';
import { cardsReducer } from './cards/cardsSlice';
import { layoutReducer } from './layout/layoutSlice';
import { uiReducer } from './ui/uiSlice';
import { createPersistenceMiddleware } from './middleware/persistenceMiddleware';
import type { BoardRepository } from '../repositories/BoardRepository';

export type RootState = {
  cards: ReturnType<typeof cardsReducer>;
  layout: ReturnType<typeof layoutReducer>;
  ui: ReturnType<typeof uiReducer>;
};

export function createStore(repository: BoardRepository) {
  const store = configureStore({
    reducer: {
      cards: cardsReducer,
      layout: layoutReducer,
      ui: uiReducer,
    },
    preloadedState: repository.loadStateSync() as Parameters<typeof configureStore>[0]['preloadedState'],
    middleware: (getDefault) =>
      getDefault().concat(createPersistenceMiddleware(repository)),
  });
  return store;
}

export type AppDispatch = ReturnType<typeof createStore>['dispatch'];
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
