# CanvasBoard — Contributor Guide

## Architecture

**Repository pattern** — `BoardRepository` is the interface; `LocalStorageRepository` is the only implementation. The UI layer never touches `localStorage` directly. `persistenceMiddleware` depends only on the interface — swapping to a cloud backend requires changing one line in `main.tsx`.

**Redux store** — four slices: `boards`, `cards`, `layout`, `ui`. Each slice owns its own actions and selectors. No cross-slice imports except through selectors.

**Card placement** — new cards go to the top-left available cell via `findTopLeftCell()`. `compactType: null`, `preventCollision: true` — cards stay where dropped. This is intentional: it's an artistic canvas, not an auto-arranged list.

## Redux Conventions

- Always use `useAppSelector` and `useAppDispatch` (typed wrappers in `src/store/hooks.ts`), never the raw `useSelector`/`useDispatch`.
- Action naming: `sliceActions.verbNoun` — e.g. `boardsActions.addBoard`, `uiActions.openAddCardModal`.
- Selectors live in `src/store/<slice>/` alongside the slice file.

## Testing

Tests are co-located with source files (`*.test.ts` / `*.test.tsx`). Vitest + React Testing Library with jsdom.

**Required pattern for all component tests:**

```tsx
import { it, expect } from 'vitest';  // always explicit — never rely on globals
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from '../../store';
import { LocalStorageRepository } from '../../repositories/LocalStorageRepository';
import { boardsActions } from '../../store/boards/boardsSlice';

function renderWithStore(ui: React.ReactElement) {
  const store = createStore(new LocalStorageRepository());
  store.dispatch(
    boardsActions.addBoard({ id: 'b1', name: 'Test Board', createdAt: 1700000000000 })
  );
  store.dispatch(boardsActions.setActiveBoardId('b1'));
  return { store, ...render(<Provider store={store}>{ui}</Provider>) };
}
```

**Gotchas:**
- Vitest config has `globals: true` but **always use explicit imports** (`import { it, expect } from 'vitest'`). Implicit globals will pass but violate project convention.
- `LocalStorageRepository` reads from `localStorage` at construction time. Use unique IDs in tests (e.g. `'b1'`, `'b2'`) to avoid key collisions across tests.
- Dispatch store state (boards, cards) **before** calling `render`, not after — dispatching after render causes `act()` warnings.

## Code Style

- Prettier: single quotes, 2-space indent, trailing commas (es5), 100-char print width, semicolons.
- No comments on obvious code. Only comment when the *why* is non-obvious: a hidden constraint, a workaround, a subtle invariant.
- No multi-line comment blocks or docstrings.

## Naming & Imports

Follow global naming and import conventions (see global CLAUDE.md).

File naming: components = PascalCase (`GridCanvas.tsx`), slices/utilities = camelCase (`boardsSlice.ts`), hooks = `use*` prefix camelCase (`useAppDispatch.ts`).

## Dev Workflow

Structured AI-assisted process:

1. **Brainstorm** — clarify requirements, explore approaches, agree on design
2. **Spec** — write a design doc to `docs/superpowers/specs/`
3. **Plan** — write a task-by-task implementation plan to `docs/superpowers/plans/`
4. **Execute** — fresh subagent per task, TDD throughout
5. **Review** — spec compliance + code quality review after each task
6. **Deploy** — push to `master`, auto-deploys to [canvasboard.jpredmon.com](https://canvasboard.jpredmon.com)

Plans and specs live in `docs/superpowers/`. Do not delete them — they are the record of why decisions were made.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:5173
npm test         # Run all tests
npm run build    # Production build
npm run lint     # ESLint
npm run format   # Prettier
```
