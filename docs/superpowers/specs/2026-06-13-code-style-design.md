# Code Style Standards — Design Spec

**Date:** 2026-06-13
**Phase:** 5 (final roadmap phase)

## Context

CanvasBoard has consistent code style in practice — naming conventions, import ordering, and type import discipline are all present in the codebase. However, none of it is machine-enforced. A new contributor (or an AI assistant) could violate these conventions without any lint error. Phase 5 formalizes the implicit standards: ESLint rules enforce import ordering and naming, and both CLAUDE.md files document the conventions so they apply to AI-assisted work as well.

## Scope

- Import ordering: enforce groups + alphabetical sort
- Naming conventions: enforce PascalCase/camelCase/SCREAMING_SNAKE_CASE per identifier type
- `import type` discipline: enforce type-only imports use the `import type` syntax
- Document all of the above in global `~/.claude/CLAUDE.md` and project `canvasboard/CLAUDE.md`

Out of scope: file naming (ESLint can't enforce it; captured in CLAUDE.md only), default export ban, Redux action naming rules.

## ESLint Changes

**New package:** `eslint-plugin-simple-import-sort`

**Changes to `eslint.config.js`:**

```js
import simpleImportSort from 'eslint-plugin-simple-import-sort';

// plugins object:
'simple-import-sort': simpleImportSort,

// rules object:
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

`simple-import-sort/imports` and `simple-import-sort/exports` are auto-fixable via `eslint --fix`. The naming-convention and consistent-type-imports rules are not auto-fixable but surface as errors.

**Default grouping for simple-import-sort:**
External packages first, then relative imports, alphabetical within each group, blank line between groups. The plugin's defaults should match existing practice; if not, a custom `groups` array can be added to the rule config. Verify after install by running `eslint --fix` on a sample file and inspecting the result.

## CLAUDE.md Changes

### Global `~/.claude/CLAUDE.md`

Add two sections under (or adjacent to) the TypeScript section:

```markdown
## Imports

- External imports before relative imports, alphabetical within each group, blank line between groups.
- Use `import type` for type-only imports.

## Naming

- PascalCase: components, classes, interfaces, type aliases.
- camelCase: variables, functions, parameters.
- SCREAMING_SNAKE_CASE: module-level constants (e.g. `GRID_COLS`, `MAX_RETRIES`).
```

### Project `canvasboard/CLAUDE.md`

Add a "Naming & Imports" section:

```markdown
## Naming & Imports

Follow global naming and import conventions (see global CLAUDE.md).

File naming: components = PascalCase (`GridCanvas.tsx`), slices/utilities = camelCase (`boardsSlice.ts`), hooks = `use*` prefix camelCase (`useAppDispatch.ts`).
```

## Verification

1. `npm install` — installs `eslint-plugin-simple-import-sort`
2. `npm run lint` — should surface import order and naming violations across existing files
3. `npx eslint --fix src/` — auto-fixes import ordering; review naming violations manually
4. `npm run lint` again — should be clean after fixes
5. `npm test` — confirm no regressions
6. `npm run build` — confirm TypeScript still compiles clean
