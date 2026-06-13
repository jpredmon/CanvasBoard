# CanvasBoard — Accessibility Audit Design Spec

**Date:** 2026-06-12
**Status:** Approved
**Standard:** WCAG 2.1 AA

## Overview

Three-layer accessibility audit: static analysis at lint time, automated axe checks in the test suite, and a one-time manual browser audit against the live app. All three layers produce findings; all findings get fixed. Tooling stays behind permanently.

---

## Layer 1: Static Analysis — eslint-plugin-jsx-a11y

Install `eslint-plugin-jsx-a11y` and add it to `eslint.config.js`. This catches missing labels, invalid ARIA roles, bad attribute usage, and other structural issues at lint time — before the browser ever sees the code.

**Install:**

```bash
npm install --save-dev eslint-plugin-jsx-a11y
```

**Config change (`eslint.config.js`):**

```js
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: { ecmaVersion: 2020, globals: globals.browser },
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

**Process:** Run `npm run lint`, fix all jsx-a11y violations before proceeding to Layer 2.

---

## Layer 2: Automated Runtime Checks — vitest-axe

Install `vitest-axe` and extend the Vitest setup file with `toHaveNoViolations`. Add an axe assertion to each existing component test. This catches runtime accessibility tree violations — role hierarchy, aria relationships, contrast issues detectable in jsdom — and blocks CI if they regress.

**Install:**

```bash
npm install --save-dev vitest-axe
```

**Setup file (`src/test/setup.ts` — already exists, add one line):**

```ts
import { configureAxe, toHaveNoViolations } from 'vitest-axe';
expect.extend(toHaveNoViolations);
```

**Pattern for each component test:**

```tsx
import { axe } from 'vitest-axe';

it('has no accessibility violations', async () => {
  const { container } = renderWithStore(<ComponentUnderTest />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

Add this test to each of the three existing test files:

- `src/components/board/NoBoardsState.test.tsx`
- `src/components/board/BoardDropdown.test.tsx`
- `src/components/modals/AddCardModal.test.tsx`

**Process:** Run `npm test`, fix all axe violations before proceeding to Layer 3.

---

## Layer 3: Manual Browser Audit

Run the axe DevTools browser extension against the live app at https://canvasboard.jpredmon.com. Document findings. Fix all issues.

**WCAG 2.1 AA checklist to verify manually:**

| Check                                                                      | How to verify                       |
| -------------------------------------------------------------------------- | ----------------------------------- |
| Color contrast — normal text (4.5:1)                                       | axe DevTools auto-detects           |
| Color contrast — large text (3:1)                                          | axe DevTools auto-detects           |
| Keyboard navigation — all interactive elements reachable                   | Tab through entire app              |
| Focus indicators visible on all interactive elements                       | Tab through, check for visible ring |
| Landmark structure (`<main>`, `<header>`, `<nav>`)                         | axe DevTools + screen reader        |
| Modal focus trap — focus stays inside modal when open                      | Open AddCardModal, Tab repeatedly   |
| Modal focus return — focus returns to trigger on close                     | Close modal, verify focus           |
| Error messages announced to screen readers (`role="alert"` or `aria-live`) | AddCardModal URL error              |
| Headings hierarchy — no skipped levels                                     | axe DevTools                        |
| iframe titles present                                                      | Already added (YouTubeEmbed)        |

**Known likely findings (from code review):**

- `focus:outline-none` on inputs breaks visible focus indicator — replace with focus ring styles
- zinc-500 placeholder text likely fails 4.5:1 contrast against zinc-800 background
- No `<main>` landmark wrapping the page content
- AddCardModal error message may not be announced by screen readers (needs `role="alert"`)
- BoardDropdown may not be fully keyboard navigable

---

## Files Changed

| File                                          | Change                                                        |
| --------------------------------------------- | ------------------------------------------------------------- |
| `package.json`                                | Add `eslint-plugin-jsx-a11y`, `vitest-axe` to devDependencies |
| `eslint.config.js`                            | Add jsx-a11y plugin and recommended rules                     |
| `src/test/setup.ts`                           | Extend expect with `toHaveNoViolations`                       |
| `src/components/board/NoBoardsState.test.tsx` | Add axe test                                                  |
| `src/components/board/BoardDropdown.test.tsx` | Add axe test                                                  |
| `src/components/modals/AddCardModal.test.tsx` | Add axe test                                                  |
| Various component files                       | Fix lint and axe violations found during audit                |

> Note: The exact component files changed depends on audit findings. Known likely targets: `src/components/ui/Input.tsx` (focus styles), `src/pages/CanvasBoardPage.tsx` (landmark structure), `src/components/modals/AddCardModal.tsx` (error live region).

---

## Out of Scope

- WCAG 2.1 AAA (beyond AA)
- Screen reader testing with NVDA/JAWS (manual browser audit covers axe + keyboard only)
- Mobile accessibility (mobile layout not yet built)
- Playwright-based automated keyboard navigation tests (deferred to the Testing phase)
