# Multi-Board with Naming Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add named, switchable boards to CanvasBoard — users create named boards, switch via a header dropdown, rename inline, and delete boards.

**Architecture:** Option A load/unload pattern — the existing `cards` and `layout` Redux slices always hold the _active_ board's data. A new `boards` slice holds metadata. Switching boards saves the current board to localStorage then loads the target board into the existing slices. Per-board storage keys replace the old flat keys. The `BoardRepository` interface gains board-scoped signatures; the persistence middleware routes saves through the active board ID.

**Tech Stack:** React 18, TypeScript strict, Redux Toolkit, Vite, Vitest, Tailwind CSS

---

### Task 1: Types and constants

**Files:**

- Modify: `src/types/index.ts`
- Modify: `src/constants/index.ts`

- [ ] **Step 1: Add `Board` and `BoardsState` to `src/types/index.ts`**

Append after the existing `UIState` block:

```ts
export interface Board {
  id: string;
  name: string;
  createdAt: number;
}

export interface BoardsState {
  ids: string[];
  activeBoardId: string | null;
  entities: Record<string, Board>;
}
```

- [ ] **Step 2: Add boards storage key to `src/constants/index.ts`**

Replace `STORAGE_KEYS`:

```ts
export const STORAGE_KEYS = {
  cards: 'canvasboard:cards',
  layout: 'canvasboard:layout',
  boards: 'canvasboard:boards',
} as const;
```

- [ ] **Step 3: Verify TypeScript is clean**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/types/index.ts src/constants/index.ts
git commit -m "feat(boards): add Board and BoardsState types"
```

---

### Task 2: boardsSlice (TDD)

**Files:**

- Create: `src/store/boards/boardsSlice.ts`
- Create: `src/store/boards/boardsSlice.test.ts`

- [ ] **Step 1: Create `src/store/boards/boardsSlice.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { boardsReducer, boardsActions } from './boardsSlice';
import type { Board } from '../../types';

const board: Board = { id: 'b1', name: 'Work', createdAt: 1700000000000 };
const board2: Board = { id: 'b2', name: 'Personal', createdAt: 1700000000001 };

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
```

- [ ] **Step 2: Run tests — confirm they fail**

Run: `npx vitest run src/store/boards/boardsSlice.test.ts`
Expected: FAIL — `Cannot find module './boardsSlice'`

- [ ] **Step 3: Create `src/store/boards/boardsSlice.ts`**

```ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Board, BoardsState } from '../../types';

const initialState: BoardsState = {
  ids: [],
  activeBoardId: null,
  entities: {},
};

const boardsSlice = createSlice({
  name: 'boards',
  initialState,
  reducers: {
    addBoard(state, action: PayloadAction<Board>) {
      const board = action.payload;
      state.ids.push(board.id);
      state.entities[board.id] = board;
    },
    removeBoard(state, action: PayloadAction<string>) {
      const id = action.payload;
      state.ids = state.ids.filter((i) => i !== id);
      delete state.entities[id];
    },
    renameBoard(state, action: PayloadAction<{ id: string; name: string }>) {
      const { id, name } = action.payload;
      if (state.entities[id]) {
        state.entities[id].name = name;
      }
    },
    setActiveBoardId(state, action: PayloadAction<string | null>) {
      state.activeBoardId = action.payload;
    },
  },
});

export const boardsActions = boardsSlice.actions;
export const boardsReducer = boardsSlice.reducer;
```

- [ ] **Step 4: Run tests — confirm they pass**

Run: `npx vitest run src/store/boards/boardsSlice.test.ts`
Expected: 6 tests pass

- [ ] **Step 5: Verify TypeScript is clean**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/store/boards/boardsSlice.ts src/store/boards/boardsSlice.test.ts
git commit -m "feat(boards): add boardsSlice with add/remove/rename/setActive actions"
```

---

### Task 3: `setCards` and `setLayout` actions (TDD)

**Files:**

- Modify: `src/store/cards/cardsSlice.ts`
- Modify: `src/store/cards/cardsSlice.test.ts`
- Modify: `src/store/layout/layoutSlice.ts`
- Modify: `src/store/layout/layoutSlice.test.ts`

- [ ] **Step 1: Add a `setCards` test to `src/store/cards/cardsSlice.test.ts`**

Append inside the `describe` block:

```ts
import type { CardsState } from '../../types';

// add after existing imports at top of file
```

And add this test inside the existing `describe('cardsSlice', ...)`:

```ts
it('setCards replaces the entire state', () => {
  let state = cardsReducer(undefined, cardsActions.addCard(card));
  const empty: CardsState = { ids: [], entities: {} };
  state = cardsReducer(state, cardsActions.setCards(empty));
  expect(state.ids).toEqual([]);
  expect(state.entities).toEqual({});
});
```

- [ ] **Step 2: Add a `setLayout` test to `src/store/layout/layoutSlice.test.ts`**

Append inside the existing `describe('layoutSlice', ...)`:

```ts
it('setLayout replaces the entire items array', () => {
  let state = layoutReducer(undefined, layoutActions.addLayoutItem(item));
  state = layoutReducer(state, layoutActions.setLayout([]));
  expect(state.items).toHaveLength(0);
});
```

- [ ] **Step 3: Run tests — confirm new tests fail**

Run: `npx vitest run src/store/cards/cardsSlice.test.ts src/store/layout/layoutSlice.test.ts`
Expected: FAIL on `setCards` and `setLayout` — action not found

- [ ] **Step 4: Add `setCards` to `src/store/cards/cardsSlice.ts`**

Replace the full file:

```ts
import { createEntityAdapter, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { MediaCard, CardsState } from '../../types';

const adapter = createEntityAdapter<MediaCard>();

const cardsSlice = createSlice({
  name: 'cards',
  initialState: adapter.getInitialState(),
  reducers: {
    addCard: adapter.addOne,
    removeCard: adapter.removeOne,
    setCards(_state, action: PayloadAction<CardsState>) {
      return action.payload;
    },
  },
});

export const cardsActions = cardsSlice.actions;
export const cardsReducer = cardsSlice.reducer;
export const cardsAdapter = adapter;
```

- [ ] **Step 5: Add `setLayout` to `src/store/layout/layoutSlice.ts`**

Replace the full file:

```ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CardLayout, LayoutState } from '../../types';

const initialState: LayoutState = { items: [] };

const layoutSlice = createSlice({
  name: 'layout',
  initialState,
  reducers: {
    addLayoutItem(state, action: PayloadAction<CardLayout>) {
      state.items.push(action.payload);
    },
    removeLayoutItem(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.i !== action.payload);
    },
    updateLayout(state, action: PayloadAction<CardLayout[]>) {
      state.items = action.payload;
    },
    setLayout(_state, action: PayloadAction<CardLayout[]>) {
      return { items: action.payload };
    },
  },
});

export const layoutActions = layoutSlice.actions;
export const layoutReducer = layoutSlice.reducer;
```

- [ ] **Step 6: Run tests — confirm all pass**

Run: `npx vitest run src/store/cards/cardsSlice.test.ts src/store/layout/layoutSlice.test.ts`
Expected: all tests pass (4 cards + 5 layout)

- [ ] **Step 7: Verify TypeScript is clean**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: no errors

- [ ] **Step 8: Commit**

```bash
git add src/store/cards/cardsSlice.ts src/store/cards/cardsSlice.test.ts src/store/layout/layoutSlice.ts src/store/layout/layoutSlice.test.ts
git commit -m "feat(boards): add setCards and setLayout actions for board switching"
```

---

### Task 4: Wire `boards` into the Redux store

**Files:**

- Modify: `src/store/index.ts`

- [ ] **Step 1: Replace `src/store/index.ts`**

```ts
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
        createPersistenceMiddleware(repository)
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
```

Key changes from the original:

- `boardsReducer` added to the reducer map
- `RootState` now includes `boards`
- `AppThunk` extra argument changed from `unknown` to `BoardRepository` (allows thunks to call `repository.loadCards()` etc.)
- `getDefault({ thunk: { extraArgument: repository } })` makes the repository available as the third argument in any thunk

- [ ] **Step 2: Verify TypeScript is clean**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: no errors (the `repository.saveCards(state.cards)` call in the middleware will now fail TypeScript — this is expected and resolved in Task 5)

Note: if TypeScript shows an error in `persistenceMiddleware.ts` about `saveCards` signature, that is expected. Proceed — it is fixed in Task 5.

- [ ] **Step 3: Commit**

```bash
git add src/store/index.ts
git commit -m "feat(boards): add boardsReducer to store and BoardRepository to AppThunk extra arg"
```

---

### Task 5: Repository and persistence middleware (TDD)

**Files:**

- Modify: `src/repositories/BoardRepository.ts`
- Modify: `src/repositories/LocalStorageRepository.ts`
- Modify: `src/repositories/LocalStorageRepository.test.ts`
- Modify: `src/store/middleware/persistenceMiddleware.ts`

- [ ] **Step 1: Replace `src/repositories/LocalStorageRepository.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorageRepository } from './LocalStorageRepository';
import type { CardsState, LayoutState, BoardsState } from '../types';

const BOARD_ID = 'board-test-123';

const mockCardsState: CardsState = {
  ids: ['card-1'],
  entities: {
    'card-1': {
      id: 'card-1',
      type: 'youtube',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      videoId: 'dQw4w9WgXcQ',
      aspectRatio: '16:9',
      createdAt: 1700000000000,
    },
  },
};

const mockLayoutState: LayoutState = {
  items: [{ i: 'card-1', x: 0, y: 0, w: 4, h: 3, minW: 2, minH: 2 }],
};

const mockBoardsState: BoardsState = {
  ids: [BOARD_ID],
  activeBoardId: BOARD_ID,
  entities: {
    [BOARD_ID]: { id: BOARD_ID, name: 'Test Board', createdAt: 1700000000000 },
  },
};

describe('LocalStorageRepository', () => {
  let repo: LocalStorageRepository;

  beforeEach(() => {
    localStorage.clear();
    repo = new LocalStorageRepository();
  });

  it('saves and loads cards with a round-trip', () => {
    repo.saveCards(BOARD_ID, mockCardsState);
    expect(repo.loadCards(BOARD_ID)).toEqual(mockCardsState);
  });

  it('saves and loads layout with a round-trip', () => {
    repo.saveLayout(BOARD_ID, mockLayoutState);
    expect(repo.loadLayout(BOARD_ID)).toEqual(mockLayoutState);
  });

  it('returns null for cards when storage is empty', () => {
    expect(repo.loadCards(BOARD_ID)).toBeNull();
  });

  it('returns null for layout when storage is empty', () => {
    expect(repo.loadLayout(BOARD_ID)).toBeNull();
  });

  it('returns null for cards when stored value is corrupt JSON', () => {
    localStorage.setItem(`canvasboard:board:${BOARD_ID}:cards`, 'not-json{{{');
    expect(repo.loadCards(BOARD_ID)).toBeNull();
  });

  it('returns null for layout when stored value is corrupt JSON', () => {
    localStorage.setItem(`canvasboard:board:${BOARD_ID}:layout`, 'not-json{{{');
    expect(repo.loadLayout(BOARD_ID)).toBeNull();
  });

  it('saves and loads boards with a round-trip', () => {
    repo.saveBoards(mockBoardsState);
    expect(repo.loadBoards()).toEqual(mockBoardsState);
  });

  it('returns null for boards when storage is empty', () => {
    expect(repo.loadBoards()).toBeNull();
  });

  it('deleteBoardData removes cards and layout keys', () => {
    repo.saveCards(BOARD_ID, mockCardsState);
    repo.saveLayout(BOARD_ID, mockLayoutState);
    repo.deleteBoardData(BOARD_ID);
    expect(repo.loadCards(BOARD_ID)).toBeNull();
    expect(repo.loadLayout(BOARD_ID)).toBeNull();
  });

  it('loadStateSync returns boards, cards, and layout when all are saved', () => {
    repo.saveBoards(mockBoardsState);
    repo.saveCards(BOARD_ID, mockCardsState);
    repo.saveLayout(BOARD_ID, mockLayoutState);
    const state = repo.loadStateSync();
    expect(state.boards).toEqual(mockBoardsState);
    expect(state.cards).toEqual(mockCardsState);
    expect(state.layout).toEqual(mockLayoutState);
  });

  it('loadStateSync returns only boards when active board has no saved data', () => {
    repo.saveBoards(mockBoardsState);
    const state = repo.loadStateSync();
    expect(state.boards).toEqual(mockBoardsState);
    expect(state.cards).toBeUndefined();
    expect(state.layout).toBeUndefined();
  });

  it('loadStateSync returns all undefined when storage is empty', () => {
    const state = repo.loadStateSync();
    expect(state.boards).toBeUndefined();
    expect(state.cards).toBeUndefined();
    expect(state.layout).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests — confirm they fail**

Run: `npx vitest run src/repositories/LocalStorageRepository.test.ts`
Expected: FAIL — most tests fail because `saveCards` / `loadCards` signatures don't match

- [ ] **Step 3: Replace `src/repositories/BoardRepository.ts`**

```ts
import type { CardsState, LayoutState, BoardsState } from '../types';

export interface BoardRepository {
  saveCards(boardId: string, state: CardsState): void;
  loadCards(boardId: string): CardsState | null;
  saveLayout(boardId: string, state: LayoutState): void;
  loadLayout(boardId: string): LayoutState | null;
  saveBoards(state: BoardsState): void;
  loadBoards(): BoardsState | null;
  deleteBoardData(boardId: string): void;
  loadStateSync(): { cards?: CardsState; layout?: LayoutState; boards?: BoardsState };
}
```

- [ ] **Step 4: Replace `src/repositories/LocalStorageRepository.ts`**

```ts
import { STORAGE_KEYS } from '../constants';
import type { BoardRepository } from './BoardRepository';
import type { CardsState, LayoutState, BoardsState } from '../types';

export class LocalStorageRepository implements BoardRepository {
  private boardCardsKey(boardId: string) {
    return `canvasboard:board:${boardId}:cards`;
  }

  private boardLayoutKey(boardId: string) {
    return `canvasboard:board:${boardId}:layout`;
  }

  saveCards(boardId: string, state: CardsState): void {
    try {
      localStorage.setItem(this.boardCardsKey(boardId), JSON.stringify(state));
    } catch {
      console.warn('Failed to persist cards.');
    }
  }

  loadCards(boardId: string): CardsState | null {
    try {
      const raw = localStorage.getItem(this.boardCardsKey(boardId));
      return raw ? (JSON.parse(raw) as CardsState) : null;
    } catch {
      return null;
    }
  }

  saveLayout(boardId: string, state: LayoutState): void {
    try {
      localStorage.setItem(this.boardLayoutKey(boardId), JSON.stringify(state));
    } catch {
      console.warn('Failed to persist layout.');
    }
  }

  loadLayout(boardId: string): LayoutState | null {
    try {
      const raw = localStorage.getItem(this.boardLayoutKey(boardId));
      return raw ? (JSON.parse(raw) as LayoutState) : null;
    } catch {
      return null;
    }
  }

  saveBoards(state: BoardsState): void {
    try {
      localStorage.setItem(STORAGE_KEYS.boards, JSON.stringify(state));
    } catch {
      console.warn('Failed to persist boards.');
    }
  }

  loadBoards(): BoardsState | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.boards);
      return raw ? (JSON.parse(raw) as BoardsState) : null;
    } catch {
      return null;
    }
  }

  deleteBoardData(boardId: string): void {
    localStorage.removeItem(this.boardCardsKey(boardId));
    localStorage.removeItem(this.boardLayoutKey(boardId));
  }

  loadStateSync() {
    const boards = this.loadBoards() ?? undefined;
    const activeBoardId = boards?.activeBoardId ?? null;
    return {
      boards,
      cards: activeBoardId ? (this.loadCards(activeBoardId) ?? undefined) : undefined,
      layout: activeBoardId ? (this.loadLayout(activeBoardId) ?? undefined) : undefined,
    };
  }
}
```

- [ ] **Step 5: Run tests — confirm they pass**

Run: `npx vitest run src/repositories/LocalStorageRepository.test.ts`
Expected: 12 tests pass

- [ ] **Step 6: Replace `src/store/middleware/persistenceMiddleware.ts`**

```ts
import type { Middleware } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import type { BoardRepository } from '../../repositories/BoardRepository';
import { boardsActions } from '../boards/boardsSlice';
import { cardsActions } from '../cards/cardsSlice';
import { layoutActions } from '../layout/layoutSlice';

const boardsActionTypes = new Set([
  boardsActions.addBoard.type,
  boardsActions.removeBoard.type,
  boardsActions.renameBoard.type,
  boardsActions.setActiveBoardId.type,
]);

const cardLayoutActionTypes = new Set([
  cardsActions.addCard.type,
  cardsActions.removeCard.type,
  cardsActions.setCards.type,
  layoutActions.addLayoutItem.type,
  layoutActions.removeLayoutItem.type,
  layoutActions.updateLayout.type,
  layoutActions.setLayout.type,
]);

export const createPersistenceMiddleware =
  (repository: BoardRepository): Middleware<object, RootState> =>
  (store) =>
  (next) =>
  (action) => {
    const result = next(action);
    const state = store.getState();
    const actionType = (action as { type: string }).type;

    if (boardsActionTypes.has(actionType)) {
      repository.saveBoards(state.boards);
    }

    if (cardLayoutActionTypes.has(actionType)) {
      const boardId = state.boards.activeBoardId;
      if (boardId) {
        repository.saveCards(boardId, state.cards);
        repository.saveLayout(boardId, state.layout);
      }
    }

    return result;
  };
```

- [ ] **Step 7: Verify TypeScript is clean**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: no errors

- [ ] **Step 8: Run all tests**

Run: `npx vitest run`
Expected: all tests pass

- [ ] **Step 9: Commit**

```bash
git add src/repositories/BoardRepository.ts src/repositories/LocalStorageRepository.ts src/repositories/LocalStorageRepository.test.ts src/store/middleware/persistenceMiddleware.ts
git commit -m "feat(boards): board-scoped repository, persistence middleware, and updated tests"
```

---

### Task 6: `boardsSelectors` and `boardsThunks`

**Files:**

- Create: `src/store/boards/boardsSelectors.ts`
- Create: `src/store/boards/boardsThunks.ts`

- [ ] **Step 1: Create `src/store/boards/boardsSelectors.ts`**

```ts
import type { RootState } from '../index';

export const selectAllBoards = (state: RootState) =>
  state.boards.ids.map((id) => state.boards.entities[id]);

export const selectActiveBoardId = (state: RootState) => state.boards.activeBoardId;

export const selectActiveBoard = (state: RootState) =>
  state.boards.activeBoardId ? state.boards.entities[state.boards.activeBoardId] : null;
```

- [ ] **Step 2: Create `src/store/boards/boardsThunks.ts`**

```ts
import { nanoid } from 'nanoid';
import type { AppThunk } from '../index';
import type { Board } from '../../types';
import { boardsActions } from './boardsSlice';
import { cardsActions } from '../cards/cardsSlice';
import { layoutActions } from '../layout/layoutSlice';

export const createAndSwitchBoard =
  (name: string): AppThunk =>
  (dispatch, _getState, repository) => {
    const id = nanoid();
    const board: Board = { id, name: name.trim(), createdAt: Date.now() };
    dispatch(boardsActions.addBoard(board));
    dispatch(cardsActions.setCards({ ids: [], entities: {} }));
    dispatch(layoutActions.setLayout([]));
    dispatch(boardsActions.setActiveBoardId(id));
  };

export const switchBoard =
  (boardId: string): AppThunk =>
  (dispatch, getState, repository) => {
    const { boards, cards, layout } = getState();
    const currentBoardId = boards.activeBoardId;

    if (currentBoardId && currentBoardId !== boardId) {
      repository.saveCards(currentBoardId, cards);
      repository.saveLayout(currentBoardId, layout);
    }

    const newCards = repository.loadCards(boardId) ?? { ids: [], entities: {} };
    const newLayout = repository.loadLayout(boardId) ?? { items: [] };

    dispatch(cardsActions.setCards(newCards));
    dispatch(layoutActions.setLayout(newLayout.items));
    dispatch(boardsActions.setActiveBoardId(boardId));
  };

export const deleteBoard =
  (boardId: string): AppThunk =>
  (dispatch, getState, repository) => {
    const { boards } = getState();
    const isActive = boards.activeBoardId === boardId;
    const remainingIds = boards.ids.filter((id) => id !== boardId);

    dispatch(boardsActions.removeBoard(boardId));
    repository.deleteBoardData(boardId);

    if (isActive) {
      if (remainingIds.length > 0) {
        const nextId = remainingIds[0];
        const newCards = repository.loadCards(nextId) ?? { ids: [], entities: {} };
        const newLayout = repository.loadLayout(nextId) ?? { items: [] };
        dispatch(cardsActions.setCards(newCards));
        dispatch(layoutActions.setLayout(newLayout.items));
        dispatch(boardsActions.setActiveBoardId(nextId));
      } else {
        dispatch(cardsActions.setCards({ ids: [], entities: {} }));
        dispatch(layoutActions.setLayout([]));
        dispatch(boardsActions.setActiveBoardId(null));
      }
    }
  };
```

- [ ] **Step 3: Verify TypeScript is clean**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/store/boards/boardsSelectors.ts src/store/boards/boardsThunks.ts
git commit -m "feat(boards): add boardsSelectors and boardsThunks"
```

---

### Task 7: `NoBoardsState` component

**Files:**

- Create: `src/components/board/NoBoardsState.tsx`

- [ ] **Step 1: Create `src/components/board/NoBoardsState.tsx`**

```tsx
import { useState } from 'react';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { createAndSwitchBoard } from '../../store/boards/boardsThunks';
import { Button } from '../ui/Button';

export function NoBoardsState() {
  const dispatch = useAppDispatch();
  const [name, setName] = useState('');

  function handleCreate() {
    if (name.trim()) {
      dispatch(createAndSwitchBoard(name.trim()));
    }
  }

  return (
    <div
      className="relative flex flex-1 flex-col items-center justify-center overflow-hidden"
      style={{
        backgroundImage:
          'linear-gradient(rgba(139,92,246,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.07) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(139,92,246,0.15) 0%, transparent 60%)',
        }}
        aria-hidden="true"
      />
      <div className="relative flex flex-col items-center gap-4 text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-violet-500">Welcome</span>
        <p className="text-2xl font-extrabold text-zinc-100">Create your first board</p>
        <p className="max-w-xs text-sm text-zinc-500">
          Name your board and start curating your video world
        </p>
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="Board name..."
            autoFocus
            className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none"
          />
          <Button onClick={handleCreate} disabled={name.trim() === ''}>
            Create Board
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript is clean**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/board/NoBoardsState.tsx
git commit -m "feat(boards): add NoBoardsState first-launch screen"
```

---

### Task 8: `BoardSelector` and `BoardDropdown` components

**Files:**

- Create: `src/components/board/BoardSelector.tsx`
- Create: `src/components/board/BoardDropdown.tsx`

- [ ] **Step 1: Create `src/components/board/BoardSelector.tsx`**

```tsx
import { useState, useRef, useEffect } from 'react';
import { useAppSelector } from '../../hooks/useAppSelector';
import { selectActiveBoard } from '../../store/boards/boardsSelectors';
import { BoardDropdown } from './BoardDropdown';

export function BoardSelector() {
  const activeBoard = useAppSelector(selectActiveBoard);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  if (!activeBoard) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold text-zinc-100 hover:bg-zinc-800 focus:outline-none"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="max-w-[180px] truncate">{activeBoard.name}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mt-0.5 text-zinc-400"
        >
          <path d="M2 4l4 4 4-4" />
        </svg>
      </button>
      {open && <BoardDropdown onClose={() => setOpen(false)} />}
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/board/BoardDropdown.tsx`**

```tsx
import { useState } from 'react';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { selectAllBoards, selectActiveBoardId } from '../../store/boards/boardsSelectors';
import { boardsActions } from '../../store/boards/boardsSlice';
import { switchBoard, createAndSwitchBoard, deleteBoard } from '../../store/boards/boardsThunks';

interface Props {
  onClose: () => void;
}

export function BoardDropdown({ onClose }: Props) {
  const dispatch = useAppDispatch();
  const boards = useAppSelector(selectAllBoards);
  const activeBoardId = useAppSelector(selectActiveBoardId);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [creatingNew, setCreatingNew] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');

  function handleSwitch(boardId: string) {
    if (boardId !== activeBoardId) {
      dispatch(switchBoard(boardId));
    }
    onClose();
  }

  function startRename(boardId: string, currentName: string) {
    setRenamingId(boardId);
    setRenameValue(currentName);
  }

  function commitRename() {
    if (renamingId && renameValue.trim()) {
      dispatch(boardsActions.renameBoard({ id: renamingId, name: renameValue.trim() }));
    }
    setRenamingId(null);
    setRenameValue('');
  }

  function handleDelete(boardId: string) {
    dispatch(deleteBoard(boardId));
    onClose();
  }

  function handleCreateNew() {
    if (newBoardName.trim()) {
      dispatch(createAndSwitchBoard(newBoardName.trim()));
      setNewBoardName('');
      setCreatingNew(false);
      onClose();
    }
  }

  return (
    <div className="absolute left-0 top-full z-50 mt-1 min-w-[220px] rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl">
      <ul role="listbox" className="py-1">
        {boards.map((board) => (
          <li key={board.id} className="flex items-center gap-1 px-2 py-0.5">
            {renamingId === board.id ? (
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitRename();
                  if (e.key === 'Escape') setRenamingId(null);
                }}
                onBlur={commitRename}
                className="flex-1 rounded border border-violet-500 bg-zinc-800 px-2 py-0.5 text-sm text-zinc-100 focus:outline-none"
              />
            ) : (
              <button
                role="option"
                aria-selected={board.id === activeBoardId}
                onClick={() => handleSwitch(board.id)}
                className={`flex-1 truncate rounded px-2 py-1.5 text-left text-sm ${
                  board.id === activeBoardId
                    ? 'font-semibold text-violet-400'
                    : 'text-zinc-300 hover:text-zinc-100'
                }`}
              >
                {board.name}
              </button>
            )}
            <button
              onClick={() => startRename(board.id, board.name)}
              className="rounded p-1 text-zinc-500 hover:text-zinc-300"
              aria-label={`Rename ${board.name}`}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button
              onClick={() => handleDelete(board.id)}
              className="rounded p-1 text-zinc-500 hover:text-red-400"
              aria-label={`Delete ${board.name}`}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
      <div className="border-t border-zinc-700 px-2 py-1">
        {creatingNew ? (
          <div className="flex gap-1">
            <input
              autoFocus
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateNew();
                if (e.key === 'Escape') {
                  setCreatingNew(false);
                  setNewBoardName('');
                }
              }}
              placeholder="Board name..."
              className="flex-1 rounded border border-violet-500 bg-zinc-800 px-2 py-1 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
            />
            <button
              onClick={handleCreateNew}
              disabled={newBoardName.trim() === ''}
              className="rounded px-2 py-1 text-sm text-violet-400 hover:text-violet-300 disabled:opacity-40"
            >
              Add
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCreatingNew(true)}
            className="w-full rounded px-2 py-1 text-left text-sm text-zinc-400 hover:text-zinc-200"
          >
            + New Board
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript is clean**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/components/board/BoardSelector.tsx src/components/board/BoardDropdown.tsx
git commit -m "feat(boards): add BoardSelector and BoardDropdown components"
```

---

### Task 9: Wire everything into `BoardHeader` and `CanvasBoardPage`

**Files:**

- Modify: `src/components/board/BoardHeader.tsx`
- Modify: `src/pages/CanvasBoardPage.tsx`

- [ ] **Step 1: Replace `src/components/board/BoardHeader.tsx`**

```tsx
import { Button } from '../ui/Button';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { uiActions } from '../../store/ui/uiSlice';
import { selectCardCount } from '../../store/cards/cardsSelectors';
import { selectActiveBoardId } from '../../store/boards/boardsSelectors';
import { MAX_CARDS } from '../../constants';
import { BoardSelector } from './BoardSelector';

export function BoardHeader() {
  const dispatch = useAppDispatch();
  const editMode = useAppSelector((state) => state.ui.editMode);
  const cardCount = useAppSelector(selectCardCount);
  const activeBoardId = useAppSelector(selectActiveBoardId);

  return (
    <header className="relative flex items-center justify-between overflow-hidden border-b border-zinc-800 px-6 py-3">
      <div
        className="pointer-events-none absolute right-0 top-0 h-full w-64"
        style={{
          background:
            'radial-gradient(ellipse at top right, rgba(139,92,246,0.12) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />
      <h1 className="text-lg font-extrabold uppercase tracking-widest">
        <span className="text-zinc-100">CANVAS</span>
        <span className="text-violet-400">BOARD</span>
      </h1>
      <BoardSelector />
      {activeBoardId && (
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            onClick={() => dispatch(uiActions.openAddCardModal())}
            disabled={cardCount >= MAX_CARDS}
            aria-label="Add card"
          >
            + Add Card
          </Button>
          <Button
            variant={editMode ? 'edit-active' : 'ghost'}
            onClick={() => dispatch(uiActions.toggleEditMode())}
            aria-pressed={editMode}
          >
            {editMode ? 'Done' : 'Edit'}
          </Button>
        </div>
      )}
    </header>
  );
}
```

- [ ] **Step 2: Replace `src/pages/CanvasBoardPage.tsx`**

```tsx
import { BoardHeader } from '../components/board/BoardHeader';
import { EditModeBanner } from '../components/board/EditModeBanner';
import { EmptyBoardState } from '../components/board/EmptyBoardState';
import { GridCanvas } from '../components/board/GridCanvas';
import { NoBoardsState } from '../components/board/NoBoardsState';
import { AddCardModal } from '../components/modals/AddCardModal';
import { useAppSelector } from '../hooks/useAppSelector';
import { selectCardCount } from '../store/cards/cardsSelectors';
import { selectActiveBoardId } from '../store/boards/boardsSelectors';

export default function CanvasBoardPage() {
  const cardCount = useAppSelector(selectCardCount);
  const editMode = useAppSelector((state) => state.ui.editMode);
  const activeBoardId = useAppSelector(selectActiveBoardId);

  return (
    <div className="flex h-screen flex-col bg-zinc-950">
      <BoardHeader />
      <EditModeBanner visible={editMode} />
      {activeBoardId === null ? (
        <NoBoardsState />
      ) : cardCount === 0 ? (
        <EmptyBoardState />
      ) : (
        <GridCanvas />
      )}
      <AddCardModal />
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript is clean**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: no errors

- [ ] **Step 4: Run all tests**

Run: `npx vitest run`
Expected: all tests pass (27 existing + 6 boardsSlice + 1 setCards + 1 setLayout + 12 repository = 47 total)

- [ ] **Step 5: Commit**

```bash
git add src/components/board/BoardHeader.tsx src/pages/CanvasBoardPage.tsx
git commit -m "feat(boards): wire BoardSelector, NoBoardsState into header and page"
```

---

### Task 10: Final verification

- [ ] **Step 1: Run all tests**

Run: `npx vitest run`
Expected: all tests pass

- [ ] **Step 2: TypeScript clean check**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: no errors

- [ ] **Step 3: Smoke test in the browser**

Start dev server: `npm run dev`

Verify:

1. App opens to "Create your first board" screen — no boards exist
2. Type a board name and press Enter or click "Create Board" — board appears, header shows board name with chevron
3. Add a YouTube card — card persists
4. Click the board name in the header — dropdown opens with the board listed
5. Click "+ New Board" — type a name, press Enter — new board created, header updates, canvas is empty
6. Switch back to the first board — cards reappear
7. Rename a board via the pencil icon — name updates in dropdown and header
8. Delete the second board — app switches back to the first board
9. Delete the last board — app returns to "Create your first board" screen
10. Hard refresh — boards, active board, and its cards all persist

- [ ] **Step 4: Push to GitHub**

```bash
git push origin master
```
