import { configureStore } from '@reduxjs/toolkit';
import type { ThunkAction, Action } from '@reduxjs/toolkit';
import { cardsReducer } from './cards/cardsSlice';
import { layoutReducer } from './layout/layoutSlice';
import { uiReducer } from './ui/uiSlice';
import { boardsReducer } from './boards/boardsSlice';
import { createPersistenceMiddleware } from './middleware/persistenceMiddleware';
import type { BoardRepository } from '../repositories/BoardRepository';

export type RootState = {
  cards: ReturnType<typeof cardsReducer>;
  layout: ReturnType<typeof layoutReducer>;
  ui: ReturnType<typeof uiReducer>;
  boards: ReturnType<typeof boardsReducer>;
};

export function createStore(repository: BoardRepository) {
  const preloaded = repository.loadStateSync();
  const store = configureStore({
    reducer: {
      cards: cardsReducer,
      layout: layoutReducer,
      ui: uiReducer,
      boards: boardsReducer,
    },
    preloadedState: preloaded as Parameters<typeof configureStore>[0]['preloadedState'],
    middleware: (getDefault) =>
      getDefault({ thunk: { extraArgument: repository } }).concat(
        createPersistenceMiddleware(repository),
      ),
  });
  return store;
}

export type AppDispatch = ReturnType<typeof createStore>['dispatch'];
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  BoardRepository,
  Action<string>
>;
