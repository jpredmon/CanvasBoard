# Code Style Standards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add ESLint enforcement for import ordering and naming conventions, and document these standards in both CLAUDE.md files.

**Architecture:** Three phases: (1) install plugin + configure ESLint rules, (2) auto-fix then manually fix existing violations, (3) update CLAUDE.md files. All changes are additive — no existing rules removed.

**Tech Stack:** ESLint flat config (`eslint.config.js`), `eslint-plugin-simple-import-sort`, `@typescript-eslint/naming-convention`, `@typescript-eslint/consistent-type-imports`

**Spec:** `docs/superpowers/specs/2026-06-13-code-style-design.md`

---

### Task 1: Install plugin and configure ESLint rules

**Files:**

- Modify: `package.json` (devDependency added via npm)
- Modify: `eslint.config.js`

- [ ] **Step 1: Install the plugin**

```bash
npm install -D eslint-plugin-simple-import-sort
```

Expected: `eslint-plugin-simple-import-sort` appears in `devDependencies` in `package.json`.

- [ ] **Step 2: Read the current eslint.config.js**

Read `eslint.config.js` in full before editing — you need to know the exact structure (where `plugins` and `rules` live).

- [ ] **Step 3: Add the import at the top of eslint.config.js**

Add alongside the other plugin imports at the top of the file:

```js
import simpleImportSort from 'eslint-plugin-simple-import-sort';
```

- [ ] **Step 4: Register the plugin**

Add to the `plugins` object inside the main config object:

```js
'simple-import-sort': simpleImportSort,
```

- [ ] **Step 5: Add the four new rules**

Add to the `rules` object:

```js
'simple-import-sort/imports': 'error',
'simple-import-sort/exports': 'error',
'@typescript-eslint/naming-convention': [
  'error',
  { selector: 'variable', format: ['camelCase', 'UPPER_CASE', 'PascalCase'] },
  { selector: 'function', format: ['camelCase', 'PascalCase'] },
  { selector: 'typeLike', format: ['PascalCase'] },
],
'@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
```

- [ ] **Step 6: Run lint to see what violations exist**

```bash
npm run lint
```

Expected: Errors for import ordering and/or type imports across existing files. Naming violations should be minimal — the codebase already follows conventions. Note the error count; this is the baseline to eliminate.

- [ ] **Step 7: Commit the config change**

```bash
git add eslint.config.js package.json package-lock.json
git commit -m "chore: add simple-import-sort and naming-convention ESLint rules"
```

---

### Task 2: Auto-fix import order and type import violations

**Files:**

- Modify: All `src/**/*.ts` and `src/**/*.tsx` files with violations (via `eslint --fix`)

- [ ] **Step 1: Run auto-fix**

```bash
npx eslint --fix src/
```

This auto-fixes:

- `simple-import-sort/imports` — reorders and groups imports alphabetically
- `simple-import-sort/exports` — reorders named exports
- `@typescript-eslint/consistent-type-imports` — converts `import { Foo }` to `import type { Foo }` where the value is only used as a type

- [ ] **Step 2: Verify the default grouping looks correct**

Open one fixed file (e.g. `src/main.tsx` or `src/store/boards/boardsSlice.ts`) and confirm:

- External imports (e.g. `react`, `@reduxjs/toolkit`) appear **before** relative imports (e.g. `../../store`)
- A blank line separates external from relative groups
- Imports are alphabetical within each group

If grouping is wrong (e.g. all imports merged into one block with no blank line), replace the rule with a custom groups config:

```js
'simple-import-sort/imports': ['error', {
  groups: [
    ['^\\u0000'],                                                       // side-effect imports
    ['^react', '^@?\\w'],                                               // external packages
    ['^\\.\\.(?!/?$)', '^\\.\\./?$'],                                   // parent imports (../)
    ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],                  // sibling imports (./)
  ],
}],
```

- [ ] **Step 3: Run lint to confirm import and type-import errors are gone**

```bash
npm run lint
```

Expected: No `simple-import-sort` or `consistent-type-imports` errors. Only `naming-convention` errors remain (if any).

- [ ] **Step 4: Run tests to confirm no regressions**

```bash
npm test
```

Expected: All tests pass. Import reordering is cosmetic and does not affect runtime behavior.

- [ ] **Step 5: Commit the auto-fixed files**

```bash
git add src/
git commit -m "chore: auto-fix import order and type import violations"
```

---

### Task 3: Fix naming convention violations

**Files:**

- Modify: Any `src/**/*.ts` or `src/**/*.tsx` files flagged by `naming-convention`

- [ ] **Step 1: Collect naming violations**

```bash
npm run lint 2>&1 | findstr "naming-convention"
```

(On Mac/Linux use `grep` instead of `findstr`.) Review each violation before touching anything.

- [ ] **Step 2: Fix each violation**

Common patterns and their fixes:

**Type alias or interface not PascalCase:**

```ts
// Before
type boardState = { ... }
// After
type BoardState = { ... }
```

**Variable that's a React component but not PascalCase (rare):**

```ts
// Before
const myComponent = () => <div />;
// After
const MyComponent = () => <div />;
```

**Destructured variable from an external library using a non-conforming name:**
If an external library's destructured binding violates the rule (e.g. snake_case from a third-party API), add this override to the `@typescript-eslint/naming-convention` array in `eslint.config.js` rather than renaming the binding:

```js
{ selector: 'variable', modifiers: ['destructured'], format: null },
```

- [ ] **Step 3: Run lint to confirm zero errors**

```bash
npm run lint
```

Expected: 0 errors, 0 warnings.

- [ ] **Step 4: Run full test suite**

```bash
npm test
```

Expected: All 94+ RTL tests pass.

- [ ] **Step 5: Run production build**

```bash
npm run build
```

Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 6: Commit naming fixes**

```bash
git add src/
git commit -m "fix: resolve naming-convention ESLint violations"
```

---

### Task 4: Update CLAUDE.md files

**Files:**

- Modify: `C:\Users\Student\.claude\CLAUDE.md` (global — outside repo, no git commit needed)
- Modify: `CLAUDE.md` (project root)

- [ ] **Step 1: Read the global CLAUDE.md**

Read `C:\Users\Student\.claude\CLAUDE.md` in full to locate the `## TypeScript` section.

- [ ] **Step 2: Insert Imports and Naming sections into global CLAUDE.md**

Add the following two sections immediately after the `## TypeScript` section:

```markdown
## Imports

- External imports before relative imports, alphabetical within each group, blank line between groups.
- Use `import type` for type-only imports.

## Naming

- PascalCase: components, classes, interfaces, type aliases.
- camelCase: variables, functions, parameters.
- SCREAMING_SNAKE_CASE: module-level constants (e.g. `GRID_COLS`, `MAX_RETRIES`).
```

- [ ] **Step 3: Read the project CLAUDE.md**

Read `CLAUDE.md` in full to locate the `## Code Style` section.

- [ ] **Step 4: Insert Naming & Imports section into project CLAUDE.md**

Add the following section immediately after `## Code Style`:

```markdown
## Naming & Imports

Follow global naming and import conventions (see global CLAUDE.md).

File naming: components = PascalCase (`GridCanvas.tsx`), slices/utilities = camelCase (`boardsSlice.ts`), hooks = `use*` prefix camelCase (`useAppDispatch.ts`).
```

- [ ] **Step 5: Commit project CLAUDE.md**

```bash
git add CLAUDE.md
git commit -m "docs: add naming and import conventions to project CLAUDE.md"
```

(The global `~/.claude/CLAUDE.md` lives outside the repo — no commit needed for it.)

---

### Task 5: Final verification

- [ ] **Step 1: Run full lint**

```bash
npm run lint
```

Expected: 0 errors, 0 warnings.

- [ ] **Step 2: Run all tests**

```bash
npm test
```

Expected: All 94+ RTL tests and 5 E2E tests pass.

- [ ] **Step 3: Run production build**

```bash
npm run build
```

Expected: Build completes cleanly.

- [ ] **Step 4: Spot-check a source file for import formatting**

Open `src/store/boards/boardsSlice.ts` and confirm:

- External imports (e.g. `@reduxjs/toolkit`) appear above relative imports
- Blank line between the two groups
- Each group is alphabetically sorted
- Type-only imports use `import type { ... }`
