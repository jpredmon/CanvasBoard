# Code Quality Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Write a findings document capturing all code quality issues, then fix all Important-severity items.

**Architecture:** Three tasks: (1) write the findings doc, (2) add missing UI selectors and update all components that inline them, (3) remove dead constants, a redundant filter, and a missing focus ring. No new dependencies; all changes are in existing files.

**Tech Stack:** TypeScript, React 18, Redux Toolkit, Vite, Tailwind CSS

---

### Task 1: Write findings document

**Files:**

- Create: `docs/superpowers/reviews/2026-06-12-code-quality-findings.md`

- [ ] **Step 1: Create the findings document**

Create `docs/superpowers/reviews/2026-06-12-code-quality-findings.md` with this exact content:

````markdown
# Code Quality Audit Findings — 2026-06-12

**Scope:** All non-test source files in `src/`
**Standard:** CLAUDE.md conventions + TypeScript strict + WCAG 2.1 AA (already addressed)

---

## Important — Fix in this audit

### [I-1] Missing `uiSelectors.ts` — inline selectors in 4 components

**Category:** Redux patterns  
**Files:**

- `src/components/board/GridCanvas.tsx:21`
- `src/components/board/BoardHeader.tsx:12`
- `src/pages/CanvasBoardPage.tsx:13`
- `src/components/modals/AddCardModal.tsx:13`

`selectEditMode` and `selectAddCardModalOpen` are written as inline lambdas in each component rather than living in `src/store/ui/uiSelectors.ts`. CLAUDE.md states: "Selectors live in `src/store/<slice>/` alongside the slice file." The pattern is consistent in every other slice (`boardsSelectors.ts`, `cardsSelectors.ts`, `layoutSelectors.ts`) but missing for `ui`.

**Fix:** Create `src/store/ui/uiSelectors.ts` with both selectors, update all four components to import from it.

---

### [I-2] Dead exports in `STORAGE_KEYS`

**Category:** Dead code  
**File:** `src/constants/index.ts:13-17`

`STORAGE_KEYS.cards` (`'canvasboard:cards'`) and `STORAGE_KEYS.layout` (`'canvasboard:layout'`) are never referenced anywhere in the codebase. `LocalStorageRepository` builds dynamic per-board keys (`canvasboard:board:${boardId}:cards`) rather than using these constants. Only `STORAGE_KEYS.boards` is actually used.

**Fix:** Remove the `cards` and `layout` keys from `STORAGE_KEYS`.

---

### [I-3] Redundant null filter in `BoardDropdown`

**Category:** Dead code  
**File:** `src/components/board/BoardDropdown.tsx:81`

```tsx
// Current (redundant):
boards.filter((b): b is NonNullable<typeof b> => b != null).map(...)

// selectAllBoards already does this:
export const selectAllBoards = createSelector(
  (state) => state.boards.ids,
  (state) => state.boards.entities,
  (ids, entities) => ids.map((id) => entities[id]).filter((b): b is NonNullable<typeof b> => b != null),
);
```
````

`selectAllBoards` already filters out null/undefined entries. The second filter in `BoardDropdown` is dead code that TypeScript accepts but never evaluates to anything.

**Fix:** Remove the `.filter(...)` wrapper, iterate `boards.map(...)` directly.

---

### [I-4] Missing focus ring on `BoardSelector` trigger button

**Category:** Component design / accessibility  
**File:** `src/components/board/BoardSelector.tsx:27`

The dropdown trigger button has `focus:outline-none` with no replacement focus indicator:

```tsx
className = '... focus:outline-none';
```

Every other interactive element in the app uses either `focus-visible:ring-2 focus-visible:ring-violet-500` (via `Button`) or an explicit `focus:ring-2` class. This button is the only one that removes the outline with no replacement, leaving keyboard users with no visible focus indicator on this control.

**Fix:** Replace `focus:outline-none` with `focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500`.

---

## Minor — Document only

### [M-1] Ad-hoc type cast in `persistenceMiddleware`

**Category:** TypeScript type safety  
**File:** `src/store/middleware/persistenceMiddleware.ts:31`

```ts
const actionType = (action as { type: string }).type;
```

RTK exports `UnknownAction` (which has `type: string`) for exactly this pattern. Using `action as UnknownAction` would be more idiomatic. This is not a bug — both forms are type-safe — but `UnknownAction` communicates intent better.

---

### [M-2] `App.tsx` is a pure passthrough

**Category:** Dead code  
**File:** `src/App.tsx`

`App` does nothing except render `CanvasBoardPage`. `main.tsx` could import `CanvasBoardPage` directly. Harmless convention; a future `App` might gain a router or provider, so leaving it is reasonable.

---

### [M-3] `ErrorBoundary` has no error logging

**Category:** Error handling  
**File:** `src/components/ui/ErrorBoundary.tsx`

`getDerivedStateFromError` is implemented (shows fallback UI) but `componentDidCatch` is not, so render errors fail silently with no console output in production. This matters when diagnosing field issues. Not a blocking concern for MVP.

````

- [ ] **Step 2: Verify the file was written**

Run: `Get-Content "docs/superpowers/reviews/2026-06-12-code-quality-findings.md" | Measure-Object -Line`

Expected: at least 80 lines.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/reviews/2026-06-12-code-quality-findings.md
git commit -m "docs: add code quality audit findings"
````

---

### Task 2: Add `uiSelectors.ts` and fix inline selectors (finding I-1)

**Files:**

- Create: `src/store/ui/uiSelectors.ts`
- Modify: `src/components/board/GridCanvas.tsx`
- Modify: `src/components/board/BoardHeader.tsx`
- Modify: `src/pages/CanvasBoardPage.tsx`
- Modify: `src/components/modals/AddCardModal.tsx`

- [ ] **Step 1: Create `src/store/ui/uiSelectors.ts`**

```ts
import type { RootState } from '../index';

export const selectEditMode = (state: RootState) => state.ui.editMode;
export const selectAddCardModalOpen = (state: RootState) => state.ui.addCardModalOpen;
```

- [ ] **Step 2: Update `GridCanvas.tsx`**

File: `src/components/board/GridCanvas.tsx`

Replace the import block (lines 1-12) — add `selectEditMode` import:

```ts
import { useEffect, useRef, useState } from 'react';
import ReactGridLayout, { type Layout, type Compactor, noCompactor } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { selectAllCards } from '../../store/cards/cardsSelectors';
import { selectLayout } from '../../store/layout/layoutSelectors';
import { selectEditMode } from '../../store/ui/uiSelectors';
import { layoutActions } from '../../store/layout/layoutSlice';
import { MediaCard } from '../cards/MediaCard';
import type { CardLayout } from '../../types';
import { GRID_COLS, GRID_ROW_HEIGHT, GRID_MARGIN, GRID_CONTAINER_PADDING } from '../../constants';
```

Then replace the inline selector on the `editMode` line:

Old:

```tsx
const editMode = useAppSelector((state) => state.ui.editMode);
```

New:

```tsx
const editMode = useAppSelector(selectEditMode);
```

- [ ] **Step 3: Update `BoardHeader.tsx`**

File: `src/components/board/BoardHeader.tsx`

Add import:

```ts
import { selectEditMode } from '../../store/ui/uiSelectors';
```

Replace:

```tsx
const editMode = useAppSelector((state) => state.ui.editMode);
```

With:

```tsx
const editMode = useAppSelector(selectEditMode);
```

- [ ] **Step 4: Update `CanvasBoardPage.tsx`**

File: `src/pages/CanvasBoardPage.tsx`

Add import:

```ts
import { selectEditMode } from '../store/ui/uiSelectors';
```

Replace:

```tsx
const editMode = useAppSelector((state) => state.ui.editMode);
```

With:

```tsx
const editMode = useAppSelector(selectEditMode);
```

- [ ] **Step 5: Update `AddCardModal.tsx`**

File: `src/components/modals/AddCardModal.tsx`

Add import:

```ts
import { selectAddCardModalOpen } from '../../store/ui/uiSelectors';
```

Replace:

```tsx
const open = useAppSelector((state) => state.ui.addCardModalOpen);
```

With:

```tsx
const open = useAppSelector(selectAddCardModalOpen);
```

- [ ] **Step 6: Run TypeScript check**

Run: `npx tsc -b`

Expected: no errors.

- [ ] **Step 7: Run tests**

Run: `npx vitest run`

Expected: 50/50 passing.

- [ ] **Step 8: Commit**

```bash
git add src/store/ui/uiSelectors.ts src/components/board/GridCanvas.tsx src/components/board/BoardHeader.tsx src/pages/CanvasBoardPage.tsx src/components/modals/AddCardModal.tsx
git commit -m "refactor(store): add uiSelectors and replace inline selectors in components"
```

---

### Task 3: Remove dead `STORAGE_KEYS`, redundant filter, and missing focus ring (findings I-2, I-3, I-4)

**Files:**

- Modify: `src/constants/index.ts`
- Modify: `src/components/board/BoardDropdown.tsx`
- Modify: `src/components/board/BoardSelector.tsx`

- [ ] **Step 1: Remove dead keys from `STORAGE_KEYS`**

File: `src/constants/index.ts`

Replace:

```ts
export const STORAGE_KEYS = {
  cards: 'canvasboard:cards',
  layout: 'canvasboard:layout',
  boards: 'canvasboard:boards',
} as const;
```

With:

```ts
export const STORAGE_KEYS = {
  boards: 'canvasboard:boards',
} as const;
```

- [ ] **Step 2: Run TypeScript check to confirm nothing referenced the removed keys**

Run: `npx tsc -b`

Expected: no errors. If errors appear, a file was importing the removed keys — find it with `grep -r "STORAGE_KEYS.cards\|STORAGE_KEYS.layout" src/` and remove those references too.

- [ ] **Step 3: Remove redundant filter in `BoardDropdown`**

File: `src/components/board/BoardDropdown.tsx`

Replace:

```tsx
{boards.filter((b): b is NonNullable<typeof b> => b != null).map((board) => (
```

With:

```tsx
{boards.map((board) => (
```

- [ ] **Step 4: Add focus ring to `BoardSelector` trigger button**

File: `src/components/board/BoardSelector.tsx`

Replace:

```tsx
className =
  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold text-zinc-100 hover:bg-zinc-800 focus:outline-none';
```

With:

```tsx
className =
  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold text-zinc-100 hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500';
```

- [ ] **Step 5: Run TypeScript check**

Run: `npx tsc -b`

Expected: no errors.

- [ ] **Step 6: Run tests**

Run: `npx vitest run`

Expected: 50/50 passing.

- [ ] **Step 7: Commit**

```bash
git add src/constants/index.ts src/components/board/BoardDropdown.tsx src/components/board/BoardSelector.tsx
git commit -m "refactor(cleanup): remove dead STORAGE_KEYS entries, redundant filter, and missing focus ring"
```

---

## Post-execution

After all three tasks are committed:

```bash
git push origin master
```

Run a final check:

```bash
npx tsc -b && npx vitest run
```

Expected: clean build, 50/50 tests passing.
