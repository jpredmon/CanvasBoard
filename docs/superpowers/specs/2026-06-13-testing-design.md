# Testing Phase Design

**Date:** 2026-06-13
**Status:** Approved

## Goal

Fill RTL component test gaps and add Playwright E2E coverage for the three core user flows: golden path, board management, and persistence.

## Approach

Two-layer strategy:

- **RTL** — behavioral component tests co-located with source, following the existing `renderWithStore` pattern. Targets components with real logic; skips UI primitives (Button/Input/Modal, exercised implicitly) and untestable components (GridCanvas, YouTubeEmbed).
- **Playwright** — full-browser E2E tests in `e2e/` at project root, auto-starting the dev server via `webServer` config. Chromium only.

## Tech Stack

TypeScript, React 18, Redux Toolkit, Vitest + React Testing Library (existing), Playwright 1.60 (already installed, no config yet).

---

## Layer 1: RTL Component Tests

### Files and Behaviors

**`src/components/board/BoardHeader.test.tsx`**

- Renders "+ Add Card" and "Edit" buttons when a board is active
- "+ Add Card" is disabled when card count is at MAX_CARDS (50)
- Clicking "Edit" dispatches `uiActions.toggleEditMode`
- Clicking "+ Add Card" dispatches `uiActions.openAddCardModal`
- Neither button renders when no board is active (`activeBoardId === null`)

**`src/components/cards/CardControls.test.tsx`**

- Renders nothing when `editMode=false`
- Shows "×" delete button when `editMode=true`
- Clicking "×" shows Cancel and Delete confirm buttons
- Clicking Cancel returns to the single "×" button (no delete fired)
- Clicking Delete calls the `onDeleteStart` callback and dispatches `cardsActions.removeCard` + `layoutActions.removeLayoutItem` after 150ms

**`src/components/board/EmptyBoardState.test.tsx`**

- Renders the h2 "Curate your video world" heading
- Renders a "+ Add Card" button
- Clicking "+ Add Card" dispatches `uiActions.openAddCardModal`

**`src/components/board/EditModeBanner.test.tsx`**

- Renders the banner content when `visible=true`
- Renders nothing when `visible=false`

**`src/store/cards/cardsThunks.test.ts`**

- `addYouTubeCard` dispatches card + layout item for a valid YouTube URL
- Throws for an invalid / non-YouTube URL
- Throws when card count is at MAX_CARDS

### Conventions

- Explicit Vitest imports: `import { it, expect, vi } from 'vitest'`
- `renderWithStore` helper per CLAUDE.md pattern; dispatch board state before `render`
- For `CardControls`, render directly with props (no Redux needed for `editMode`/`cardId`); wrap with store only when testing dispatched actions
- For `cardsThunks`, use `createStore(new LocalStorageRepository())` with a board pre-seeded; `localStorage.clear()` in `beforeEach`

---

## Layer 2: Playwright E2E

### Config

**`playwright.config.ts`** at project root:

- `testDir: './e2e'`
- `baseURL: 'http://localhost:5173'`
- Single project: Chromium desktop
- `webServer: { command: 'npm run dev', url: 'http://localhost:5173', reuseExistingServer: true }`
- `use: { screenshot: 'only-on-failure', video: 'off' }`

### Directory Structure

```
e2e/
  golden-path.spec.ts
  board-management.spec.ts
  persistence.spec.ts
```

### Test Isolation

Each test clears localStorage in `beforeEach`:

```ts
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});
```

### Test Files

**`e2e/golden-path.spec.ts`**

1. Page loads showing NoBoardsState ("Create your first board")
2. Fill board name input, click "Create Board"
3. Assert board name appears in the header selector trigger
4. Click "+ Add Card" button in header
5. Assert Add Card modal is open
6. Fill a valid YouTube URL (`https://www.youtube.com/watch?v=dQw4w9WgXcQ`)
7. Click "Add Card" submit button
8. Assert modal closes
9. Assert a card element is visible in the grid

**`e2e/board-management.spec.ts`**

1. Create "Board One", then create "Board Two" via dropdown "+ New Board"
2. **Rename:** Open dropdown, click rename icon on "Board One", type "Renamed Board", press Enter; assert trigger button shows "Renamed Board"
3. **Switch:** Open dropdown, click "Board Two"; assert trigger button shows "Board Two"
4. **Delete:** Open dropdown, click delete icon on "Board Two"; assert "Board Two" no longer appears in the dropdown

**`e2e/persistence.spec.ts`**

1. Create a board named "Persist Board"
2. Add a card (valid YouTube URL)
3. Assert card is visible
4. Call `page.reload()`
5. Assert "Persist Board" still appears in the header selector trigger
6. Assert a card element is still visible in the grid

### npm Script

Add to `package.json`:

```json
"test:e2e": "playwright test"
```

---

## Out of Scope

- `GridCanvas.tsx` — tightly coupled to react-grid-layout, ResizeObserver, and mouse events; not unit testable
- `YouTubeEmbed.tsx` — renders an iframe; no logic to verify at unit level
- `MediaCard.tsx` — thin wrapper over CardControls + YouTubeEmbed; covered by E2E
- `Button`, `Input`, `Modal`, `ErrorBoundary` — UI primitives tested implicitly through component consumers
- `BoardSelector.tsx` — covered implicitly by BoardDropdown tests
- Cross-browser E2E (Firefox, Safari) — Chromium only for this phase
- Mobile viewport testing
