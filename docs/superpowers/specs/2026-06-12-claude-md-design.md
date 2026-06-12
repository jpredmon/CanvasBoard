# CLAUDE.md Files — Design Spec

**Date:** 2026-06-12
**Status:** Approved

## Overview

Two CLAUDE.md files: one global (personal preferences for all projects), one repo-level (CanvasBoard conventions for human contributors and future Claude Code sessions).

---

## File 1: Global `~/.claude/CLAUDE.md`

Applies to every project opened in Claude Code. Contains personal working preferences and general frontend conventions.

### Communication Style

- Terse responses. No trailing "here's what I did" summaries — the user can read the diff.
- No emojis unless explicitly requested.
- One-sentence status updates while working. Silent is not acceptable; verbose is wasteful.
- When referencing code, include `file_path:line_number` so the user can navigate directly.

### Workflow

- Stop and wait for explicit approval after each major deliverable (design doc, phase completion, significant feature) before proceeding. Do not self-advance.
- Always write plans, specs, and design documents to disk as files before presenting or summarizing them. Never display a plan only in chat — if the session is interrupted, it's gone.
- Prefer editing existing files over creating new ones.
- Do not add features, refactors, or abstractions beyond what the task requires.

### TypeScript

- Strict mode always. No implicit `any`.
- Prefer named exports over default exports.
- No unnecessary type assertions (`as`). Fix the type properly.

### Commits

- Conventional commits: `feat:`, `fix:`, `test:`, `docs:`, `refactor:`, `chore:`
- Imperative subject line, present tense ("add feature" not "added feature")
- Always include `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>` trailer

---

## File 2: Repo-level `C:\dev\claude-practice\CanvasBoard\CLAUDE.md`

Written for human contributors. Also loaded by Claude Code when working in this repo.

### Architecture Decisions

- **Repository pattern** — `BoardRepository` is the interface; `LocalStorageRepository` is the only implementation. The UI layer never touches `localStorage` directly. `persistenceMiddleware` depends only on the interface — swapping to a cloud backend requires changing one line in `main.tsx`.
- **Redux store structure** — `boards`, `cards`, `layout`, `ui` slices. Each slice owns its own actions and selectors. No cross-slice imports except through selectors.
- **Card placement** — new cards go to the top-left available cell via `findTopLeftCell()`. `compactType: null`, `preventCollision: true` — cards stay where dropped (artistic canvas, not auto-arranged list).

### Redux Conventions

- Always use `useAppSelector` and `useAppDispatch` (typed wrappers in `src/store/hooks.ts`), never the raw `useSelector`/`useDispatch`.
- Action naming: `sliceActions.verbNoun` — e.g. `boardsActions.addBoard`, `uiActions.openAddCardModal`.
- Selectors live in `src/store/<slice>/` alongside the slice file.

### Testing Conventions

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

**Known gotchas:**
- Vitest config has `globals: true` but the project convention is always explicit imports (`import { it, expect } from 'vitest'`). Implicit globals will pass but violate convention.
- `LocalStorageRepository` reads from `localStorage` at construction time. Use unique board/card IDs in tests (e.g. `'b1'`, `'b2'`) to avoid key collisions across tests in the same file.
- Dispatch store state (boards, cards) *before* calling `render`, not after — dispatching after render causes `act()` warnings.

### Code Style

- Prettier config: single quotes, 2-space indent, trailing commas (es5), 100-char print width, semicolons.
- No comments on obvious code. Only comment when the *why* is non-obvious: a hidden constraint, a workaround, a subtle invariant.
- No multi-line comment blocks or docstrings.

### Dev Workflow

This project uses a structured AI-assisted development process:

1. **Brainstorm** — clarify requirements, explore approaches, agree on design
2. **Spec** — write a design doc to `docs/superpowers/specs/`
3. **Plan** — write a task-by-task implementation plan to `docs/superpowers/plans/`
4. **Execute** — fresh subagent per task, TDD throughout
5. **Review** — spec compliance review + code quality review after each task
6. **Deploy** — push to `master`, auto-deploys to Cloudflare Pages

Plans and specs live in `docs/superpowers/`. Do not delete them — they are the record of why decisions were made.

---

## Files Changed

| File | Action |
|------|--------|
| `~/.claude/CLAUDE.md` | Create |
| `CLAUDE.md` (repo root) | Create |
| `docs/superpowers/specs/2026-06-12-claude-md-design.md` | Create (this file) |
