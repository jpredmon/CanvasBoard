# Code Quality Audit Design

## Goal

Identify and fix code quality issues across all non-test source files in `src/`. Produce a findings document and fix all Critical and Important items.

## Scope

**In scope:** All non-test source files under `src/` — components, pages, store slices/selectors/thunks/middleware, repositories, utils, types.

**Out of scope:** Test files (covered in the upcoming testing phase), config files (`vite.config.ts`, `eslint.config.js`, `tailwind.config.js`), `node_modules`.

## Review Categories

| Category               | What to look for                                                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| TypeScript type safety | Inline `any`, non-null assertions (`!`), missing return types, unsafe casts                                                                |
| Component design       | Single responsibility, prop shape clarity, excessive complexity, inline logic that belongs in a selector or util                           |
| Redux patterns         | Raw `useSelector`/`useDispatch` instead of typed wrappers, inline selectors in components (should live in `store/<slice>/` selector files) |
| Error handling         | Uncaught async errors, silent `catch` blocks, missing error boundaries                                                                     |
| Dead code              | Unused exports, unreachable branches, stale imports                                                                                        |
| Naming/consistency     | Matches CLAUDE.md conventions (`useAppSelector`, `useAppDispatch`, `sliceActions.verbNoun`)                                                |

## Severity Framework

| Level     | Definition                                  | Action                |
| --------- | ------------------------------------------- | --------------------- |
| Critical  | Correctness bug or data loss risk           | Fix in this audit     |
| Important | Degrades maintainability or user experience | Fix in this audit     |
| Minor     | Style or preference issue                   | Document only, no fix |

## Output Artifacts

- **Findings doc:** `docs/superpowers/reviews/2026-06-12-code-quality-findings.md` — one entry per finding with file, line, category, severity, description, and recommended fix
- **Fixes:** committed to `master` after findings doc is approved; grouped logically (one commit per thematic area or per file, not one mega-commit)

## Files to Review

### Store

- `src/store/index.ts`
- `src/store/boards/boardsSlice.ts`
- `src/store/boards/boardsSelectors.ts`
- `src/store/boards/boardsThunks.ts`
- `src/store/cards/cardsSlice.ts`
- `src/store/cards/cardsSelectors.ts`
- `src/store/cards/cardsThunks.ts`
- `src/store/layout/layoutSlice.ts`
- `src/store/layout/layoutSelectors.ts`
- `src/store/ui/uiSlice.ts`
- `src/store/middleware/persistenceMiddleware.ts`

### Components & Pages

- `src/pages/CanvasBoardPage.tsx`
- `src/components/board/BoardHeader.tsx`
- `src/components/board/BoardSelector.tsx`
- `src/components/board/BoardDropdown.tsx`
- `src/components/board/GridCanvas.tsx`
- `src/components/board/EditModeBanner.tsx`
- `src/components/board/NoBoardsState.tsx`
- `src/components/board/EmptyBoardState.tsx`
- `src/components/cards/MediaCard.tsx`
- `src/components/cards/CardControls.tsx`
- `src/components/cards/embeds/YouTubeEmbed.tsx`
- `src/components/modals/AddCardModal.tsx`
- `src/components/ui/Button.tsx`
- `src/components/ui/Input.tsx`
- `src/components/ui/Modal.tsx`
- `src/components/ui/ErrorBoundary.tsx`

### Repositories & Utils

- `src/repositories/BoardRepository.ts`
- `src/repositories/LocalStorageRepository.ts`
- `src/utils/youtube.ts`
- `src/utils/layout.ts`
- `src/types/index.ts`
- `src/constants/index.ts`
- `src/hooks/useAppDispatch.ts`
- `src/hooks/useAppSelector.ts`
- `src/App.tsx`
- `src/main.tsx`
