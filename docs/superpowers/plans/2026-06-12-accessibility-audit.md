# Accessibility Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Achieve WCAG 2.1 AA compliance by installing permanent static analysis and automated test tooling, then fixing all violations found across three audit layers.

**Architecture:** Three layers — eslint-plugin-jsx-a11y catches structural issues at lint time, vitest-axe catches runtime violations in tests, manual browser audit catches color contrast and real keyboard flow. Each layer runs independently; fixes from earlier layers carry forward.

**Tech Stack:** eslint-plugin-jsx-a11y, vitest-axe, axe DevTools browser extension (manual), React 18, Vitest, React Testing Library

---

## Files

| File                                          | Change                                                    |
| --------------------------------------------- | --------------------------------------------------------- |
| `package.json`                                | Add eslint-plugin-jsx-a11y, vitest-axe to devDependencies |
| `eslint.config.js`                            | Add jsx-a11y plugin and recommended rules                 |
| `src/test/setup.ts`                           | Add vitest-axe toHaveNoViolations extension               |
| `src/components/board/NoBoardsState.test.tsx` | Add axe test                                              |
| `src/components/board/BoardDropdown.test.tsx` | Add axe test                                              |
| `src/components/modals/AddCardModal.test.tsx` | Add axe test                                              |
| `src/pages/CanvasBoardPage.tsx`               | Add `<main>` landmark                                     |
| `src/components/ui/Input.tsx`                 | Add `role="alert"` to error paragraph                     |
| `src/components/board/NoBoardsState.tsx`      | Add visible focus ring to inline input                    |
| `src/components/board/BoardDropdown.tsx`      | Add visible focus rings to inline inputs                  |

---

### Task 1: Install eslint-plugin-jsx-a11y and fix lint violations

**Files:**

- Modify: `package.json` (via npm install)
- Modify: `eslint.config.js`

- [ ] **Step 1: Install the package**

```bash
npm install --save-dev eslint-plugin-jsx-a11y
```

Expected: package added to devDependencies in package.json.

- [ ] **Step 2: Update eslint.config.js**

Replace the entire file with:

```js
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      ...jsxA11y.configs.recommended.rules,
    },
  }
);
```

- [ ] **Step 3: Run lint and capture violations**

```bash
npm run lint 2>&1
```

Review every jsx-a11y error. Fix each one. Common findings for this codebase:

- `jsx-a11y/no-noninteractive-element-interactions` — non-interactive element with onClick
- `jsx-a11y/click-events-have-key-events` — onClick without onKeyDown
- `jsx-a11y/interactive-supports-focus` — interactive element not in tab order

- [ ] **Step 4: Verify lint passes**

```bash
npm run lint
```

Expected: zero errors (warnings are OK).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json eslint.config.js src/
git commit -m "feat(a11y): install eslint-plugin-jsx-a11y and fix all lint violations"
```

---

### Task 2: Install vitest-axe and add axe tests

**Files:**

- Modify: `package.json` (via npm install)
- Modify: `src/test/setup.ts`
- Modify: `src/components/board/NoBoardsState.test.tsx`
- Modify: `src/components/board/BoardDropdown.test.tsx`
- Modify: `src/components/modals/AddCardModal.test.tsx`

- [ ] **Step 1: Install vitest-axe**

```bash
npm install --save-dev vitest-axe
```

- [ ] **Step 2: Extend Vitest expect in setup file**

Current `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom';
```

Replace with:

```ts
import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'vitest-axe';

expect.extend(toHaveNoViolations);
```

- [ ] **Step 3: Add axe test to NoBoardsState.test.tsx**

Current file has one test. Add below it:

```tsx
import { axe } from 'vitest-axe';

it('has no accessibility violations', async () => {
  const { container } = renderWithStore(<NoBoardsState />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

Full file after edit:

```tsx
import { it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
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

it('has no accessibility violations', async () => {
  const { container } = renderWithStore(<NoBoardsState />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

- [ ] **Step 4: Add axe test to BoardDropdown.test.tsx**

Add after the existing 2 tests:

```tsx
import { axe } from 'vitest-axe';

it('has no accessibility violations', async () => {
  renderDropdownWithBoard();
  const container = document.body;
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

Full file after edit:

```tsx
import { it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'vitest-axe';
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

it('has no accessibility violations', async () => {
  renderDropdownWithBoard();
  const results = await axe(document.body);
  expect(results).toHaveNoViolations();
});
```

- [ ] **Step 5: Add axe test to AddCardModal.test.tsx**

Add after the existing 2 tests:

```tsx
import { axe } from 'vitest-axe';

it('has no accessibility violations', async () => {
  const { container } = renderModalWithBoard();
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

Where `renderModalWithBoard` returns `{ store, container }` — update the helper to return the container:

Full file after edit:

```tsx
import { it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { Provider } from 'react-redux';
import { AddCardModal } from './AddCardModal';
import { createStore } from '../../store';
import { LocalStorageRepository } from '../../repositories/LocalStorageRepository';
import { boardsActions } from '../../store/boards/boardsSlice';
import { uiActions } from '../../store/ui/uiSlice';
import { cardsActions } from '../../store/cards/cardsSlice';

function renderModalWithBoard() {
  const store = createStore(new LocalStorageRepository());
  store.dispatch(
    boardsActions.addBoard({ id: 'b1', name: 'Test Board', createdAt: 1700000000000 })
  );
  store.dispatch(boardsActions.setActiveBoardId('b1'));
  store.dispatch(uiActions.openAddCardModal());
  const { container } = render(
    <Provider store={store}>
      <AddCardModal />
    </Provider>
  );
  return { store, container };
}

it('submitting first card enables edit mode', () => {
  const { store } = renderModalWithBoard();
  fireEvent.change(screen.getByRole('textbox'), {
    target: { value: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  });
  fireEvent.click(screen.getByRole('button', { name: /add/i }));
  const state = store.getState();
  expect(state.ui.editMode).toBe(true);
});

it('submitting subsequent card does not change edit mode', () => {
  const store = createStore(new LocalStorageRepository());
  store.dispatch(
    boardsActions.addBoard({ id: 'b1', name: 'Test Board', createdAt: 1700000000000 })
  );
  store.dispatch(boardsActions.setActiveBoardId('b1'));
  store.dispatch(
    cardsActions.addCard({
      id: 'existing-card',
      type: 'youtube',
      url: 'https://www.youtube.com/watch?v=existing',
      videoId: 'existing',
      aspectRatio: '16:9',
      createdAt: 1700000000000,
    })
  );
  store.dispatch(uiActions.setEditMode(false));
  store.dispatch(uiActions.openAddCardModal());
  render(
    <Provider store={store}>
      <AddCardModal />
    </Provider>
  );

  fireEvent.change(screen.getByRole('textbox'), {
    target: { value: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  });
  fireEvent.click(screen.getByRole('button', { name: /add/i }));
  const state = store.getState();
  expect(state.ui.editMode).toBe(false);
});

it('has no accessibility violations', async () => {
  const { container } = renderModalWithBoard();
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

- [ ] **Step 6: Run all tests**

```bash
npm test
```

If axe tests fail, read the violation messages — each one names the rule and the offending element. Fix the violation in the source component, then re-run.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/test/setup.ts src/components/board/NoBoardsState.test.tsx src/components/board/BoardDropdown.test.tsx src/components/modals/AddCardModal.test.tsx
git commit -m "feat(a11y): install vitest-axe and add toHaveNoViolations to component tests"
```

---

### Task 3: Fix pre-identified WCAG AA issues

These are known violations from code review — fix them before the browser audit.

**Files:**

- Modify: `src/pages/CanvasBoardPage.tsx`
- Modify: `src/components/ui/Input.tsx`
- Modify: `src/components/board/NoBoardsState.tsx`
- Modify: `src/components/board/BoardDropdown.tsx`

- [ ] **Step 1: Add `<main>` landmark to CanvasBoardPage**

Current `src/pages/CanvasBoardPage.tsx`:

```tsx
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
```

Replace with:

```tsx
return (
  <div className="flex h-screen flex-col bg-zinc-950">
    <BoardHeader />
    <EditModeBanner visible={editMode} />
    <main className="flex flex-1 flex-col overflow-hidden">
      {activeBoardId === null ? (
        <NoBoardsState />
      ) : cardCount === 0 ? (
        <EmptyBoardState />
      ) : (
        <GridCanvas />
      )}
    </main>
    <AddCardModal />
  </div>
);
```

- [ ] **Step 2: Add `role="alert"` to Input error paragraph**

Current error paragraph in `src/components/ui/Input.tsx` (line 25):

```tsx
{
  error && (
    <p id={errorId} className="text-xs text-red-400">
      {error}
    </p>
  );
}
```

Replace with:

```tsx
{
  error && (
    <p id={errorId} role="alert" className="text-xs text-red-400">
      {error}
    </p>
  );
}
```

This makes validation errors announced immediately by screen readers when they appear, without requiring the user to re-focus the input.

- [ ] **Step 3: Add visible focus ring to NoBoardsState inline input**

Current input className in `src/components/board/NoBoardsState.tsx` (line 49):

```
"rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none"
```

Replace with:

```
"rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
```

- [ ] **Step 4: Add visible focus rings to BoardDropdown inline inputs**

In `src/components/board/BoardDropdown.tsx`, there are two inputs with `focus:outline-none` and no ring.

**Rename input** (line 92):

```
"flex-1 rounded border border-violet-500 bg-zinc-800 px-2 py-0.5 text-sm text-zinc-100 focus:outline-none"
```

Replace with:

```
"flex-1 rounded border border-violet-500 bg-zinc-800 px-2 py-0.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-1 focus:ring-offset-zinc-900"
```

**New board input** (line 149):

```
"flex-1 rounded border border-violet-500 bg-zinc-800 px-2 py-1 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
```

Replace with:

```
"flex-1 rounded border border-violet-500 bg-zinc-800 px-2 py-1 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-1 focus:ring-offset-zinc-900"
```

- [ ] **Step 5: Fix text contrast — zinc-500 body text**

`text-zinc-500` (#71717a) on dark backgrounds fails the 4.5:1 AA ratio for normal-sized text. Placeholder text is exempt, but visible body text is not.

In `src/components/board/NoBoardsState.tsx`, line 37 uses `text-zinc-500` for the description paragraph:

```tsx
<p className="max-w-xs text-sm text-zinc-500">
  Name your board and start curating your video world
</p>
```

Replace with:

```tsx
<p className="max-w-xs text-sm text-zinc-400">
  Name your board and start curating your video world
</p>
```

Check all other component files for `text-zinc-500` used on visible (non-placeholder) text. For each instance, verify whether it's placeholder text (exempt) or body text (must be at least zinc-400).

Run: `npx grep -r "text-zinc-500" src --include="*.tsx" | grep -v placeholder`

For each non-placeholder `text-zinc-500` result, change to `text-zinc-400`.

- [ ] **Step 6: Run full test suite**

```bash
npm test
```

Expected: all tests pass including axe assertions.

- [ ] **Step 7: Run lint**

```bash
npm run lint
```

Expected: zero errors.

- [ ] **Step 8: Commit**

```bash
git add src/pages/CanvasBoardPage.tsx src/components/ui/Input.tsx src/components/board/NoBoardsState.tsx src/components/board/BoardDropdown.tsx
git commit -m "fix(a11y): add main landmark, alert role, focus rings, and contrast fixes"
```

---

### Task 4: Manual Browser Audit and Final Fixes

Run axe DevTools against the live app to catch what jsdom cannot: real color contrast across all states, keyboard flow, and screen reader landmarks in context.

**Prerequisites:** Push all previous commits so Cloudflare redeploys. Wait ~2 minutes for deployment.

```bash
git push origin master
```

- [ ] **Step 1: Install axe DevTools browser extension**

Install the free "axe DevTools" extension for Chrome or Firefox:

- Chrome: search "axe DevTools" in the Chrome Web Store
- Firefox: search "axe" in Firefox Add-ons

- [ ] **Step 2: Audit the default state**

1. Open https://canvasboard.jpredmon.com
2. Open DevTools → axe DevTools tab
3. Click "Analyze"
4. Record all violations. For each: note the rule, the element, and the recommended fix.

- [ ] **Step 3: Audit the modal state**

1. Click "+ Add Card" to open the modal
2. Run axe DevTools again with modal open
3. Record any additional violations

- [ ] **Step 4: Audit the board dropdown state**

1. Click the board selector to open BoardDropdown
2. Run axe DevTools again
3. Record any additional violations

- [ ] **Step 5: Keyboard navigation check**

Tab through the entire app from the top. Verify:

- Every interactive element receives focus in a logical order
- The focused element always has a visible focus indicator (violet ring)
- Escape closes modals and dropdowns
- Enter activates buttons and submits forms

- [ ] **Step 6: Fix all violations found**

For each violation from Steps 2-4, apply the fix in the relevant source file. Common findings:

**Color contrast on violet-400 text:**
`text-violet-400` (#a78bfa) on zinc-950 (#09090b) = ~9.5:1 ✓
`text-violet-400` (#a78bfa) on zinc-900 (#18181b) = ~8.6:1 ✓
`text-violet-500` (#8b5cf6) on zinc-950 (#09090b) = ~5.9:1 ✓

**Color contrast on zinc text (approximate ratios, verify with axe):**
`text-zinc-400` (#a1a1aa) on zinc-950 (#09090b) = ~7.2:1 ✓
`text-zinc-300` (#d4d4d8) on zinc-800 (#27272a) = ~7.5:1 ✓
`text-zinc-400` (#a1a1aa) on zinc-800 (#27272a) = ~3.7:1 ✗ for normal text — upgrade to `text-zinc-300`

If axe flags `text-zinc-400` on zinc-800 backgrounds, change to `text-zinc-300`.

- [ ] **Step 7: Run full test suite after fixes**

```bash
npm test && npm run lint
```

Expected: all pass.

- [ ] **Step 8: Commit and push**

```bash
git add src/
git commit -m "fix(a11y): fix violations found in manual browser audit"
git push origin master
```

- [ ] **Step 9: Re-run axe DevTools**

After deployment (~2 min), run axe DevTools again against https://canvasboard.jpredmon.com. Confirm zero violations.
