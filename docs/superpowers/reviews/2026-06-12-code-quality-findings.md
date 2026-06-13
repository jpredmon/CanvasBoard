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
