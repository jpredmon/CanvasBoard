# Multi-Board with Naming — Design Spec

**Date:** 2026-06-11
**Status:** Approved

---

## Overview

Add multi-board support to CanvasBoard. Users can create named boards, switch between them via a header dropdown, rename boards inline, and delete boards. Each board has its own independent card set and layout. The app starts with no boards — users create their first board before adding cards.

---

## Decisions

| #   | Decision                                                                                           |
| --- | -------------------------------------------------------------------------------------------------- |
| 1   | Option A: load/unload pattern — `cards` and `layout` slices always represent the active board only |
| 2   | Board selector: dropdown in the header, centered between logo and action buttons                   |
| 3   | No boards on first load — user creates their first board explicitly                                |
| 4   | Delete is immediate, no confirmation dialog                                                        |
| 5   | Old flat storage keys (`canvasboard:cards`, `canvasboard:layout`) are abandoned — no migration     |

---

## Data Model (`src/types/index.ts`)

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

`activeBoardId: null` means no board exists. `CardsState` and `LayoutState` are unchanged — they always represent the active board's data.

---

## Storage Layout

```
canvasboard:boards                   → BoardsState (all board metadata)
canvasboard:board:{id}:cards         → CardsState  (per board)
canvasboard:board:{id}:layout        → LayoutState (per board)
```

Old keys `canvasboard:cards` and `canvasboard:layout` are abandoned. On first load with the new code, the app starts fresh (no boards).

---

## Repository (`src/repositories/BoardRepository.ts`)

```ts
interface BoardRepository {
  // Board-scoped (existing methods, new signatures)
  loadCards(boardId: string): CardsState;
  saveCards(boardId: string, state: CardsState): void;
  loadLayout(boardId: string): LayoutState;
  saveLayout(boardId: string, state: LayoutState): void;

  // Board metadata (new)
  loadBoards(): BoardsState;
  saveBoards(state: BoardsState): void;
  deleteBoardData(boardId: string): void;
}
```

`deleteBoardData` removes `canvasboard:board:{id}:cards` and `canvasboard:board:{id}:layout` from localStorage.

`LocalStorageRepository` builds keys dynamically:

```ts
saveCards(boardId: string, state: CardsState) {
  localStorage.setItem(`canvasboard:board:${boardId}:cards`, JSON.stringify(state));
}
```

---

## Redux Store

### New: `boards` slice (`src/store/boards/boardsSlice.ts`)

Actions:

- `addBoard(board: Board)` — adds to entities and ids
- `removeBoard(id: string)` — removes from entities and ids
- `renameBoard({ id: string, name: string })` — updates name in entities
- `setActiveBoardId(id: string | null)` — sets the active board

### Updated: `cards` slice

Add one new action:

- `setCards(state: CardsState)` — replaces entire cards state (used on board switch)

### Updated: `layout` slice

Add one new action:

- `setLayout(items: CardLayout[])` — replaces entire layout state (used on board switch)

### New: `boardsThunks.ts` (`src/store/boards/boardsThunks.ts`)

**`createAndSwitchBoard(name: string)`:**

1. Generate `nanoid()` id, build `Board` object
2. Dispatch `addBoard(board)`
3. Dispatch `cardsActions.setCards({ ids: [], entities: {} })`
4. Dispatch `layoutActions.setLayout([])`
5. Dispatch `boardsActions.setActiveBoardId(id)`
6. Save boards metadata and empty cards/layout to repository

**`switchBoard(boardId: string)`:**

1. Save current board: `repository.saveCards(activeBoardId, cards)` + `repository.saveLayout(activeBoardId, layout)`
2. Load target board: `repository.loadCards(boardId)` + `repository.loadLayout(boardId)`
3. Dispatch `cardsActions.setCards(loadedCards)`
4. Dispatch `layoutActions.setLayout(loadedLayout.items)`
5. Dispatch `boardsActions.setActiveBoardId(boardId)`

**`deleteBoard(boardId: string)`:**

1. Dispatch `boardsActions.removeBoard(boardId)`
2. `repository.deleteBoardData(boardId)`
3. If `boardId === activeBoardId`:
   - If other boards exist:
     - `newId = remainingIds[0]`
     - Load `repository.loadCards(newId)` + `repository.loadLayout(newId)`
     - Dispatch `cardsActions.setCards(loaded)` + `layoutActions.setLayout(loaded.items)`
     - Dispatch `boardsActions.setActiveBoardId(newId)`
   - Else: dispatch `boardsActions.setActiveBoardId(null)`, `cardsActions.setCards({ ids: [], entities: {} })`, `layoutActions.setLayout([])`

Note: `switchBoard` is NOT reused here because it saves the current board before loading — we must not save the board we are deleting.

### Updated: persistence middleware

- When saving cards/layout, read `state.boards.activeBoardId` to build the scoped key
- Save boards metadata on every `boardsActions.*` action
- On app init: load `boards` first, then load cards + layout for `activeBoardId` (if set)

---

## UI Components

### `BoardHeader` update

Adds a centered `<BoardSelector />` between the logo and the action buttons.

The `+ Add Card` and Edit/Done buttons are not rendered when `activeBoardId === null` (no board active).

### New: `BoardSelector` (`src/components/board/BoardSelector.tsx`)

Renders the active board name with a down-chevron (`My Board ▾`). Click opens `BoardDropdown`.

### New: `BoardDropdown` (`src/components/board/BoardDropdown.tsx`)

A positioned dropdown containing:

- **Board rows** — one per board:
  - Board name (click to switch; active board highlighted in violet)
  - Pencil icon → name becomes inline `<input>`; Enter or blur saves via `boardsActions.renameBoard`
  - Trash icon → dispatches `deleteBoard(id)` thunk
- **`+ New Board` row** at the bottom:
  - Click → shows inline `<input>` for the name
  - Enter or non-empty blur → dispatches `createAndSwitchBoard(name)` and closes dropdown

### New: `NoBoardsState` (`src/components/board/NoBoardsState.tsx`)

Shown when `activeBoardId === null`. Centered prompt with a board name `<input>` and "Create Board" button. "Create Board" is disabled when the input is empty. Dispatches `createAndSwitchBoard(name)`. Same dark aesthetic as `EmptyBoardState`.

### Updated: `CanvasBoardPage`

```
activeBoardId === null      →  <NoBoardsState />
activeBoardId set, no cards →  <EmptyBoardState />   (unchanged)
activeBoardId set, has cards →  <GridCanvas />        (unchanged)
```

---

## Files Changed

| File                                         | Change                                                                      |
| -------------------------------------------- | --------------------------------------------------------------------------- |
| `src/types/index.ts`                         | Add `Board`, `BoardsState`                                                  |
| `src/repositories/BoardRepository.ts`        | Update interface — board-scoped signatures + new methods                    |
| `src/repositories/LocalStorageRepository.ts` | Implement board-scoped keys + `deleteBoardData` + `loadBoards`/`saveBoards` |
| `src/store/boards/boardsSlice.ts`            | **New** — normalized boards slice                                           |
| `src/store/boards/boardsThunks.ts`           | **New** — `createAndSwitchBoard`, `switchBoard`, `deleteBoard`              |
| `src/store/index.ts`                         | Add `boardsReducer` to root store, update init logic                        |
| `src/store/cards/cardsSlice.ts`              | Add `setCards` action                                                       |
| `src/store/layout/layoutSlice.ts`            | Add `setLayout` action                                                      |
| `src/store/persistenceMiddleware.ts`         | Board-scoped save keys + save boards metadata                               |
| `src/components/board/BoardHeader.tsx`       | Add `<BoardSelector />`, hide add/edit buttons when no board                |
| `src/components/board/BoardSelector.tsx`     | **New** — active board name + chevron, opens dropdown                       |
| `src/components/board/BoardDropdown.tsx`     | **New** — board list, inline rename, delete, create                         |
| `src/components/board/NoBoardsState.tsx`     | **New** — first-load empty state                                            |
| `src/pages/CanvasBoardPage.tsx`              | Branch on `activeBoardId`                                                   |
