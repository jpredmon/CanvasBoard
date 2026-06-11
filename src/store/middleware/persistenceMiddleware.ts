import type { Middleware } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import type { BoardRepository } from '../../repositories/BoardRepository';

export const createPersistenceMiddleware = (
  repository: BoardRepository,
): Middleware<object, RootState> => (store) => (next) => (action) => {
  const result = next(action);
  const state = store.getState();
  repository.saveCards(state.cards);
  repository.saveLayout(state.layout);
  return result;
};
