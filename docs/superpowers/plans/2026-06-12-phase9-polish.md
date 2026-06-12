# Phase 9 Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Four targeted polish fixes — body flash prevention, three accessibility aria-label additions, and auto-enabling edit mode when a user adds their first card.

**Architecture:** Minimal surgical changes across 5 files. `setEditMode` is added as a new reducer action to `uiSlice` (alongside `toggleEditMode`). `AddCardModal` reads `cardCount` before submit and dispatches `setEditMode(true)` if it was 0. Aria-labels are added as HTML attributes only — no layout changes.

**Tech Stack:** React 18, TypeScript, Redux Toolkit, Vitest, React Testing Library, Tailwind CSS

---

## File Map

| File | Change |
|------|--------|
| `src/index.css` | Add `body { background-color: #09090b; }` |
| `src/store/ui/uiSlice.ts` | Add `setEditMode(state, action: PayloadAction<boolean>)` reducer |
| `src/store/ui/uiSlice.test.ts` | New — unit tests for `setEditMode` |
| `src/components/board/NoBoardsState.tsx` | Add `aria-label="Board name"` to input |
| `src/components/board/NoBoardsState.test.tsx` | New — verifies aria-label is present |
| `src/components/board/BoardDropdown.tsx` | Add `aria-label` to rename and new-board inputs |
| `src/components/board/BoardDropdown.test.tsx` | New — verifies both aria-labels are present |
| `src/components/modals/AddCardModal.tsx` | Read `cardCount`, dispatch `setEditMode(true)` on first add |
| `src/components/modals/AddCardModal.test.tsx` | New — verifies edit mode is enabled after first card |

---

## Task 1: Body Flash Fix

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Add body background color**

Open `src/index.css`. It currently contains only Tailwind directives. Add a `body` rule directly after them:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #09090b;
}
```

`#09090b` is Tailwind's `zinc-950` — matching `bg-zinc-950` on `CanvasBoardPage`.

- [ ] **Step 2: Verify manually**

Run `npm run dev`, open the app, do a hard refresh (Ctrl+Shift+R). The page should no longer flash white before React mounts.

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "fix: prevent white flash before React mounts"
```

---

## Task 2: Add setEditMode Reducer

**Files:**
- Modify: `src/store/ui/uiSlice.ts`
- Create: `src/store/ui/uiSlice.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/store/ui/uiSlice.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/store/ui/uiSlice.test.ts
```

Expected: FAIL — `uiActions.setEditMode is not a function`

- [ ] **Step 3: Add setEditMode to uiSlice**

Open `src/store/ui/uiSlice.ts`. Add `PayloadAction` to the import and the new reducer:

```typescript
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { UIState } from '../../types';

const initialState: UIState = {
  addCardModalOpen: false,
  editMode: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openAddCardModal(state) {
      state.addCardModalOpen = true;
    },
    closeAddCardModal(state) {
      state.addCardModalOpen = false;
    },
    toggleEditMode(state) {
      state.editMode = !state.editMode;
    },
    setEditMode(state, action: PayloadAction<boolean>) {
      state.editMode = action.payload;
    },
  },
});

export const uiActions = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/store/ui/uiSlice.test.ts
```

Expected: 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/store/ui/uiSlice.ts src/store/ui/uiSlice.test.ts
git commit -m "feat: add setEditMode reducer to uiSlice"
```

---

## Task 3: aria-label on NoBoardsState Input

**Files:**
- Modify: `src/components/board/NoBoardsState.tsx`
- Create: `src/components/board/NoBoardsState.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/board/NoBoardsState.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/components/board/NoBoardsState.test.tsx
```

Expected: FAIL — unable to find textbox with name "Board name"

- [ ] **Step 3: Add aria-label to the input**

Open `src/components/board/NoBoardsState.tsx`. Find the `<input>` element and add `aria-label="Board name"`:

```tsx
<input
  type="text"
  value={name}
  onChange={(e) => setName(e.target.value)}
  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
  placeholder="Board name..."
  autoFocus
  aria-label="Board name"
  className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none"
/>
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/components/board/NoBoardsState.test.tsx
```

Expected: 1 test PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/board/NoBoardsState.tsx src/components/board/NoBoardsState.test.tsx
git commit -m "fix(a11y): add aria-label to NoBoardsState board name input"
```

---

## Task 4: aria-labels on BoardDropdown Inputs

**Files:**
- Modify: `src/components/board/BoardDropdown.tsx`
- Create: `src/components/board/BoardDropdown.test.tsx`

`BoardDropdown` has two inline inputs that only appear conditionally:
- **Rename input** — shown when a rename button is clicked
- **New board input** — shown when "+ New Board" is clicked

- [ ] **Step 1: Write the failing tests**

Create `src/components/board/BoardDropdown.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BoardDropdown } from './BoardDropdown';
import { createStore } from '../../store';
import { LocalStorageRepository } from '../../repositories/LocalStorageRepository';
import { boardsActions } from '../../store/boards/boardsSlice';

function renderDropdownWithBoard() {
  const store = createStore(new LocalStorageRepository());
  store.dispatch(
    boardsActions.addBoard({ id: 'b1', name: 'Test Board', createdAt: 1700000000000 })
  );
  store.dispatch(boardsActions.setActiveBoardId('b1'));
  render(
    <Provider store={store}>
      <BoardDropdown onClose={() => {}} />
    </Provider>
  );
  return store;
}

it('rename input has an accessible label', () => {
  renderDropdownWithBoard();
  fireEvent.click(screen.getByRole('button', { name: 'Rename Test Board' }));
  expect(screen.getByRole('textbox', { name: 'Rename board' })).toBeInTheDocument();
});

it('new board input has an accessible label', () => {
  renderDropdownWithBoard();
  fireEvent.click(screen.getByRole('button', { name: '+ New Board' }));
  expect(screen.getByRole('textbox', { name: 'New board name' })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/components/board/BoardDropdown.test.tsx
```

Expected: 2 tests FAIL — unable to find textboxes with those names

- [ ] **Step 3: Add aria-labels to both inputs**

Open `src/components/board/BoardDropdown.tsx`.

**Rename input** (inside the `renamingId === board.id` branch, around line 74):

```tsx
<input
  autoFocus
  value={renameValue}
  onChange={(e) => setRenameValue(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
    if (e.key === 'Escape') {
      renameCancelledRef.current = true;
      setRenamingId(null);
      setRenameValue('');
    }
  }}
  onBlur={commitRename}
  aria-label="Rename board"
  className="flex-1 rounded border border-violet-500 bg-zinc-800 px-2 py-0.5 text-sm text-zinc-100 focus:outline-none"
/>
```

**New board input** (inside the `creatingNew` branch, around line 135):

```tsx
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
  aria-label="New board name"
  className="flex-1 rounded border border-violet-500 bg-zinc-800 px-2 py-1 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
/>
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/components/board/BoardDropdown.test.tsx
```

Expected: 2 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/board/BoardDropdown.tsx src/components/board/BoardDropdown.test.tsx
git commit -m "fix(a11y): add aria-labels to BoardDropdown inline inputs"
```

---

## Task 5: Auto-Enable Edit Mode on First Card

**Files:**
- Modify: `src/components/modals/AddCardModal.tsx`
- Create: `src/components/modals/AddCardModal.test.tsx`

When `cardCount === 0` at the time the user submits the modal, dispatch `setEditMode(true)` after the card is added.

- [ ] **Step 1: Write the failing tests**

Create `src/components/modals/AddCardModal.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { AddCardModal } from './AddCardModal';
import { createStore } from '../../store';
import { LocalStorageRepository } from '../../repositories/LocalStorageRepository';
import { uiActions } from '../../store/ui/uiSlice';
import { cardsActions } from '../../store/cards/cardsSlice';
import type { MediaCard } from '../../types';

function renderModal() {
  const store = createStore(new LocalStorageRepository());
  store.dispatch(uiActions.openAddCardModal());
  render(
    <Provider store={store}>
      <AddCardModal />
    </Provider>
  );
  return store;
}

const VALID_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

const EXISTING_CARD: MediaCard = {
  id: 'existing-1',
  type: 'youtube',
  url: 'https://www.youtube.com/watch?v=existing123',
  videoId: 'existing123',
  aspectRatio: '16:9',
  createdAt: 1700000000000,
};

it('enables edit mode when the first card is added', () => {
  const store = renderModal();
  expect(store.getState().ui.editMode).toBe(false);

  fireEvent.change(screen.getByLabelText('YouTube URL'), {
    target: { value: VALID_URL },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Add Card' }));

  expect(store.getState().ui.editMode).toBe(true);
});

it('does not enable edit mode when adding a subsequent card', () => {
  const store = renderModal();
  store.dispatch(cardsActions.addCard(EXISTING_CARD));

  fireEvent.change(screen.getByLabelText('YouTube URL'), {
    target: { value: VALID_URL },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Add Card' }));

  expect(store.getState().ui.editMode).toBe(false);
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/components/modals/AddCardModal.test.tsx
```

Expected: first test FAIL — `editMode` is `false` after adding the first card

- [ ] **Step 3: Implement auto-edit in AddCardModal**

Open `src/components/modals/AddCardModal.tsx`. Add the `selectCardCount` import and `cardCount` selector, then dispatch `setEditMode(true)` when the first card is added:

```tsx
import { useState, type FormEvent } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { uiActions } from '../../store/ui/uiSlice';
import { addYouTubeCard } from '../../store/cards/cardsThunks';
import { selectCardCount } from '../../store/cards/cardsSelectors';

export function AddCardModal() {
  const dispatch = useAppDispatch();
  const open = useAppSelector((state) => state.ui.addCardModalOpen);
  const cardCount = useAppSelector(selectCardCount);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  function handleClose() {
    dispatch(uiActions.closeAddCardModal());
    setUrl('');
    setError('');
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const isFirstCard = cardCount === 0;
      dispatch(addYouTubeCard(url));
      if (isFirstCard) {
        dispatch(uiActions.setEditMode(true));
      }
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Add a video">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="card-url"
          label="YouTube URL"
          placeholder="https://www.youtube.com/watch?v=..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          error={error}
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={url.trim() === ''}>
            Add Card
          </Button>
        </div>
      </form>
    </Modal>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/components/modals/AddCardModal.test.tsx
```

Expected: 2 tests PASS

- [ ] **Step 5: Run the full test suite**

```bash
npx vitest run
```

Expected: all tests PASS (existing + 8 new)

- [ ] **Step 6: Commit**

```bash
git add src/components/modals/AddCardModal.tsx src/components/modals/AddCardModal.test.tsx
git commit -m "feat: auto-enable edit mode when first card is added"
```

---

## Final Verification

- [ ] Run `npx tsc --noEmit` — expect no type errors
- [ ] Run `npx vitest run` — expect all tests pass
- [ ] Run `npm run dev`, open the app, verify:
  - No white flash on hard refresh
  - Creating a new board works and the input is accessible
  - Adding a first card auto-enables edit mode (drag handle appears)
  - Adding a second card does NOT toggle edit mode again
  - Board rename and new-board inputs are accessible via keyboard
- [ ] Commit if anything was adjusted, then push to `master`
