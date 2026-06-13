# CanvasBoard — Phase 1: Architecture & Design

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Define the complete architecture for CanvasBoard — a local-first visual media board where users curate embedded YouTube content on a free-placement, grid-snapped canvas.

**Architecture:** React + Redux Toolkit SPA with a normalized card entity model, a free-placement React Grid Layout canvas, a repository-pattern persistence layer (`BoardRepository` interface / `LocalStorageRepository` implementation), and a Vitest + React Testing Library test suite targeting pure functions, Redux slices, and the repository layer.

**Tech Stack:** React 18, TypeScript (strict), Vite, Tailwind CSS, Redux Toolkit, React Grid Layout, nanoid, Vitest, React Testing Library, ESLint, Prettier

---

## Decisions Log

All open architectural questions were resolved before this document was written.

| #   | Question           | Decision                                                                                                                             |
| --- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | View/Edit mode     | Toggle button — "Edit" unlocks drag/resize/delete; "View" locks the board for clean presentation                                     |
| 2   | Grid compaction    | Free placement — `compactType: null`, `preventCollision: true`. Cards snap to grid but stay exactly where dropped. No auto-floating. |
| 3   | Card aspect ratio  | Auto-detected from URL. Standard YouTube → 16:9. YouTube Shorts (`/shorts/`) → 9:16. Enforced on resize.                             |
| 4   | New card placement | Top-left available cell via `findTopLeftCell()`. Max 50 cards per board.                                                             |
| 5   | Delete             | Requires inline confirmation before removing.                                                                                        |
| 6   | URL validation     | On submit only. Clear inline error message on failure.                                                                               |
| 7   | Mobile             | Ignored for MVP. Desktop only.                                                                                                       |
| 8   | Drag               | Restricted to a handle strip at the top of each card. Iframe remains fully clickable.                                                |
| 9   | Storage            | `BoardRepository` interface. `LocalStorageRepository` implementation. Redux middleware depends on the interface only.                |
| 10  | Multi-board        | Single board for MVP. No board switching, no board list.                                                                             |

---

## 1. Product Analysis

### Risks

| Risk                                                                                            | Severity | Mitigation                                                                                             |
| ----------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------ |
| React Grid Layout TypeScript types are community-maintained and sometimes lag behind the JS API | Medium   | Pin to `^2.2.3` which ships bundled types. Add a local shim if needed. Do not upgrade without testing. |
| YouTube embeds require an active internet connection even though the app is local-first         | Low      | Acceptable for MVP. Document clearly in README.                                                        |
| `localStorage` 5–10 MB browser limit                                                            | Low      | Each card stores only metadata. 50 cards is well under 1 MB.                                           |
| Free placement (`compactType: null`) means gaps remain after card deletion                      | Low      | Intentional — this is a canvas, not a dashboard. Gaps are a design feature.                            |
| React Grid Layout requires an explicit pixel `width` prop — no pure CSS sizing                  | Medium   | Measure the container via `ResizeObserver` and pass the result as the `width` prop.                    |
| YouTube iframe blocks pointer events during drag (browser security model)                       | High     | Solved by restricting drag to the handle strip. The iframe is never the drag target.                   |

### Assumptions

- Single board, single user — no multi-board, no auth
- Desktop-primary UX; mobile layout not required for MVP
- YouTube URL formats: `youtube.com/watch?v=ID`, `youtu.be/ID` (standard); `youtube.com/shorts/ID` (Shorts)
- Users have a modern Chromium or Firefox browser
- Cards do not overlap (`preventCollision: true`)

### Missing Requirements — Resolved by Design

| Gap                                 | Resolution                                                                     |
| ----------------------------------- | ------------------------------------------------------------------------------ |
| How many cards max?                 | 50. Enforced in the add-card thunk. Defined in `src/constants/index.ts`.       |
| Default card size                   | 16:9 → `w: 4, h: 3`. 9:16 → `w: 2, h: 4`. Defined in `CARD_DEFAULTS` constant. |
| Min card resize                     | `minW: 2, minH: 2` for both aspect ratios.                                     |
| How to delete a card?               | Hover-revealed delete button in edit mode only. Inline confirmation required.  |
| Can a URL be edited after creation? | No — delete and re-add for MVP.                                                |
| Invalid YouTube URL?                | Inline error below the input on submit. Modal stays open.                      |
| Board background                    | Dark neutral (`zinc-900`) so media cards pop.                                  |
| Empty state                         | Centered prompt with instructions when `cards.ids.length === 0`.               |

---

## 2. MVP Scope — Included Additions

Small additions that prevent the MVP from feeling broken — all in scope:

1. **Delete confirmation** — Inline two-step "×" → "Confirm?" pattern on the card. Not a separate modal.
2. **URL validation with feedback** — Clear inline error for unrecognized URLs. Shown on submit only.
3. **Empty state** — "Add your first video" prompt when the board has no cards.
4. **View/Edit mode toggle** — Clean presentation mode (board locked). Edit mode shows drag handles and delete buttons.
5. **Auto aspect ratio detection** — Removes a decision from the user. Paste URL, card appears in the correct shape.
6. **Error boundary per card** — A corrupted or failed card does not crash the board.
7. **Accessibility baseline** — Modal focus trap, `aria-label` on icon-only buttons, keyboard-dismissible modal.

Explicitly out of scope: card titles, multiple boards, keyboard shortcuts for drag, share links, mobile layout.

---

## 3. Overall Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                            App                               │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                  CanvasBoardPage                       │  │
│  │                                                        │  │
│  │  ┌─────────────────────────┐  ┌─────────────────────┐  │  │
│  │  │      BoardHeader        │  │    AddCardModal      │  │  │
│  │  │  [Title] [+] [Edit ▶]  │  │  [URL] [Add Card]   │  │  │
│  │  └─────────────────────────┘  └─────────────────────┘  │  │
│  │                                                        │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │                   GridCanvas                     │  │  │
│  │  │  ┌──────────────────┐  ┌──────────────────┐      │  │  │
│  │  │  │    MediaCard     │  │    MediaCard     │ ...  │  │  │
│  │  │  │ ┌──drag handle─┐ │  │                  │      │  │  │
│  │  │  │ │  ⠿      [×]  │ │  │                  │      │  │  │
│  │  │  │ └──────────────┘ │  │                  │      │  │  │
│  │  │  │ ┌──────────────┐ │  │                  │      │  │  │
│  │  │  │ │ YouTubeEmbed │ │  │                  │      │  │  │
│  │  │  │ └──────────────┘ │  │                  │      │  │  │
│  │  │  └──────────────────┘  └──────────────────┘      │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘

Redux Store
  ├── cards     — normalized entity map of MediaCard
  ├── layout    — CardLayout[] (React Grid Layout items)
  └── ui        — modal open/close, edit mode on/off

Repository Layer
  BoardRepository (interface)
  └── LocalStorageRepository (implementation)
        keys: canvasboard:cards, canvasboard:layout

Middleware
  persistenceMiddleware — depends on BoardRepository interface only
  Injected at app entry point (main.tsx) — UI never imports a concrete repository
```

**Data flow — adding a card:**

1. User clicks "Add Card" → dispatches `openAddCardModal`
2. User pastes URL and submits → `parseYouTubeUrl()` validates, extracts `videoId` and `aspectRatio`
3. `addYouTubeCard(url)` thunk dispatches to `cardsSlice` and `layoutSlice` atomically
4. `persistenceMiddleware` intercepts → calls `repository.saveCards()` and `repository.saveLayout()`
5. `GridCanvas` re-renders; card appears at top-left available cell

**Data flow — page load:**

1. `repository.loadStateSync()` called in `main.tsx` before store is created
2. Result passed as `preloadedState` to `configureStore`
3. Board renders with persisted state — no flash, no loading spinner needed

---

## 4. Folder Structure

```
CanvasBoard/
├── docs/
│   └── superpowers/
│       └── plans/
│           └── 2026-06-10-canvasboard-phase1.md
├── public/
├── src/
│   ├── components/
│   │   ├── board/
│   │   │   ├── BoardHeader.tsx          # Title + "Add Card" button + Edit/View toggle
│   │   │   ├── GridCanvas.tsx           # ReactGridLayout wrapper, wired to Redux
│   │   │   └── EmptyBoardState.tsx      # Shown when cards.ids.length === 0
│   │   ├── cards/
│   │   │   ├── MediaCard.tsx            # Card shell — switch on type → correct embed
│   │   │   ├── CardControls.tsx         # Drag handle + delete button + confirmation
│   │   │   └── embeds/
│   │   │       ├── YouTubeEmbed.tsx     # <iframe> embed, accepts videoId + aspectRatio
│   │   │       ├── InstagramEmbed.tsx   # Future
│   │   │       ├── ImageEmbed.tsx       # Future
│   │   │       └── ExternalLinkEmbed.tsx # Future
│   │   ├── modals/
│   │   │   └── AddCardModal.tsx         # URL input, submit-only validation, error display
│   │   └── ui/
│   │       ├── Button.tsx               # Shared button primitive
│   │       ├── Input.tsx                # Shared input primitive
│   │       ├── Modal.tsx                # Shared modal shell (backdrop, panel, focus trap)
│   │       └── ErrorBoundary.tsx        # Per-card error boundary
│   ├── store/
│   │   ├── index.ts                     # configureStore, RootState, AppDispatch
│   │   ├── cards/
│   │   │   ├── cardsSlice.ts            # addCard, removeCard, createEntityAdapter
│   │   │   ├── cardsSlice.test.ts       # reducer unit tests
│   │   │   ├── cardsSelectors.ts        # selectAllCards, selectCardById, selectCardCount
│   │   │   └── cardsThunks.ts           # addYouTubeCard thunk
│   │   ├── layout/
│   │   │   ├── layoutSlice.ts           # addLayoutItem, removeLayoutItem, updateLayout
│   │   │   ├── layoutSlice.test.ts      # reducer unit tests
│   │   │   └── layoutSelectors.ts       # selectLayout
│   │   ├── ui/
│   │   │   └── uiSlice.ts               # openAddCardModal, closeAddCardModal, toggleEditMode
│   │   └── middleware/
│   │       └── persistenceMiddleware.ts  # calls repository after every dispatch
│   ├── repositories/
│   │   ├── BoardRepository.ts           # interface — the only thing the middleware imports
│   │   ├── LocalStorageRepository.ts    # localStorage implementation
│   │   └── LocalStorageRepository.test.ts # repository unit tests
│   ├── hooks/
│   │   ├── useAppDispatch.ts            # typed AppDispatch hook
│   │   └── useAppSelector.ts            # typed RootState selector hook
│   ├── utils/
│   │   ├── youtube.ts                   # URL parsing → { videoId, aspectRatio }
│   │   ├── youtube.test.ts              # pure function unit tests
│   │   ├── layout.ts                    # findTopLeftCell + rectsOverlap
│   │   └── layout.test.ts              # unit tests for layout utilities
│   ├── constants/
│   │   └── index.ts                     # MAX_CARDS, GRID_*, CARD_DEFAULTS, STORAGE_KEYS
│   ├── types/
│   │   └── index.ts                     # all shared TypeScript types
│   ├── pages/
│   │   └── CanvasBoardPage.tsx          # top-level page, composes board components
│   ├── App.tsx
│   └── main.tsx                         # injects repository, creates store, mounts app
├── .prettierrc
├── eslint.config.js
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
└── vite.config.ts
```

**Extension pattern for future card types:**
Adding Instagram requires touching exactly these files:

- `src/types/index.ts` — add `'instagram'` to `MediaType`, add `InstagramCard` interface, extend `MediaCard` union
- `src/utils/instagram.ts` — new URL parser
- `src/utils/instagram.test.ts` — new parser tests
- `src/components/cards/embeds/InstagramEmbed.tsx` — new embed component
- `src/components/cards/MediaCard.tsx` — add `case 'instagram':` to render switch
- `src/components/modals/AddCardModal.tsx` — detect Instagram URLs

Nothing else changes. TypeScript's exhaustive type checking will produce a compile error if a new `MediaType` is added but not handled in `MediaCard.tsx`.

---

## 5. Domain Model

```
MediaCard (discriminated union — grows with new providers)
  ├── id: string              nanoid, unique, immutable after creation
  ├── type: MediaType         'youtube' today; union grows with new providers
  ├── url: string             original URL the user pasted
  ├── aspectRatio: AspectRatio  '16:9' | '9:16' — auto-detected, enforced on resize
  └── createdAt: number       Date.now() at creation time

YouTubeCard (type === 'youtube')
  └── videoId: string         extracted from URL by parseYouTubeUrl()

CardLayout  (mirrors React Grid Layout's Layout item)
  ├── i: string               matches MediaCard.id
  ├── x: number               column position (0–11)
  ├── y: number               row position
  ├── w: number               width in columns
  ├── h: number               height in rows
  ├── minW: number            enforces minimum resize width
  └── minH: number            enforces minimum resize height
```

---

## 6. TypeScript Types (`src/types/index.ts`)

```typescript
// ─── Media ────────────────────────────────────────────────────────────────────

export type MediaType = 'youtube';
// Future: | 'instagram' | 'tiktok' | 'image' | 'text' | 'link'

export type AspectRatio = '16:9' | '9:16';

interface BaseCard {
  id: string;
  type: MediaType;
  url: string;
  aspectRatio: AspectRatio;
  createdAt: number;
}

export interface YouTubeCard extends BaseCard {
  type: 'youtube';
  videoId: string;
}

// Discriminated union — extend this as new providers are added
export type MediaCard = YouTubeCard;

// ─── Layout ───────────────────────────────────────────────────────────────────

export interface CardLayout {
  i: string; // matches MediaCard.id
  x: number;
  y: number;
  w: number;
  h: number;
  minW: number;
  minH: number;
}

// ─── Store State ──────────────────────────────────────────────────────────────

export interface CardsState {
  ids: string[];
  entities: Record<string, MediaCard>;
}

export interface LayoutState {
  items: CardLayout[];
}

export interface UIState {
  addCardModalOpen: boolean;
  editMode: boolean;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

export type YouTubeParseResult =
  | { valid: true; videoId: string; aspectRatio: AspectRatio }
  | { valid: false; error: string };
```

---

## 7. Constants (`src/constants/index.ts`)

All magic numbers live here. Nothing else in the codebase uses literal values for these.

```typescript
export const MAX_CARDS = 50;

export const GRID_COLS = 12;
export const GRID_ROW_HEIGHT = 80; // px per row unit
export const GRID_MARGIN: [number, number] = [16, 16];
export const GRID_CONTAINER_PADDING: [number, number] = [24, 24];

// Default and minimum card dimensions per aspect ratio (in grid units)
export const CARD_DEFAULTS = {
  '16:9': { w: 4, h: 3, minW: 2, minH: 2 },
  '9:16': { w: 2, h: 4, minW: 2, minH: 2 },
} as const satisfies Record<string, { w: number; h: number; minW: number; minH: number }>;

export const STORAGE_KEYS = {
  cards: 'canvasboard:cards',
  layout: 'canvasboard:layout',
} as const;
```

**`rowHeight: 80` math:**

- 16:9 default `h: 3` → 3 × 80 = 240px ✓ (good for embedded video)
- 9:16 default `h: 4` → 4 × 80 = 320px ✓ (good for Shorts/portrait)
- Minimum `h: 2` → 160px — still usable ✓

---

## 8. Redux Toolkit Store Design

### `cardsSlice` — `src/store/cards/cardsSlice.ts`

Uses `createEntityAdapter<MediaCard>` for normalized state. O(1) lookup by id. Shape is already compatible with server responses if a backend is added later.

```typescript
const adapter = createEntityAdapter<MediaCard>();

// Reducers:
addCard(state, action: PayloadAction<MediaCard>)
removeCard(state, action: PayloadAction<string>)  // payload = card id
```

### `layoutSlice` — `src/store/layout/layoutSlice.ts`

```typescript
// Reducers:
addLayoutItem(state, action: PayloadAction<CardLayout>)
removeLayoutItem(state, action: PayloadAction<string>)    // payload = card id
updateLayout(state, action: PayloadAction<CardLayout[]>)  // from RGL onLayoutChange
```

### `uiSlice` — `src/store/ui/uiSlice.ts`

```typescript
// Reducers:
openAddCardModal(state);
closeAddCardModal(state);
toggleEditMode(state);
```

### `store/index.ts`

```typescript
// repository is created in main.tsx and passed in — store never imports a concrete repo
export function createStore(repository: BoardRepository) {
  return configureStore({
    reducer: {
      cards: cardsReducer,
      layout: layoutReducer,
      ui: uiReducer,
    },
    preloadedState: repository.loadStateSync(),
    middleware: (getDefault) => getDefault().concat(createPersistenceMiddleware(repository)),
  });
}

export type RootState = ReturnType<ReturnType<typeof createStore>['getState']>;
export type AppDispatch = ReturnType<typeof createStore>['dispatch'];
```

### `addYouTubeCard` thunk — `src/store/cards/cardsThunks.ts`

Card creation requires URL parsing, id generation, and dispatching to two slices atomically.

```typescript
export const addYouTubeCard =
  (url: string): AppThunk =>
  (dispatch, getState) => {
    const result = parseYouTubeUrl(url);
    if (!result.valid) throw new Error(result.error);

    const { cards, layout } = getState();
    if (cards.ids.length >= MAX_CARDS) {
      throw new Error(`Board is full (${MAX_CARDS} card maximum).`);
    }

    const id = nanoid();
    const defaults = CARD_DEFAULTS[result.aspectRatio];

    const card: YouTubeCard = {
      id,
      type: 'youtube',
      url,
      videoId: result.videoId,
      aspectRatio: result.aspectRatio,
      createdAt: Date.now(),
    };

    const layoutItem: CardLayout = {
      i: id,
      ...defaults,
      ...findTopLeftCell(layout.items, defaults.w),
    };

    dispatch(cardsActions.addCard(card));
    dispatch(layoutActions.addLayoutItem(layoutItem));
  };
```

---

## 9. Repository Pattern & Persistence Strategy

### `BoardRepository` interface — `src/repositories/BoardRepository.ts`

```typescript
import type { CardsState, LayoutState } from '../types';

export interface BoardRepository {
  saveCards(state: CardsState): void;
  loadCards(): CardsState | null;
  saveLayout(state: LayoutState): void;
  loadLayout(): LayoutState | null;
  loadStateSync(): { cards?: CardsState; layout?: LayoutState };
}
```

Synchronous for MVP — `localStorage` is synchronous. When swapping to a cloud backend, this interface gains `Promise` return types and the middleware updates to `async/await`. Zero UI code changes.

### `LocalStorageRepository` — `src/repositories/LocalStorageRepository.ts`

```typescript
import { STORAGE_KEYS } from '../constants';
import type { BoardRepository } from './BoardRepository';
import type { CardsState, LayoutState } from '../types';

export class LocalStorageRepository implements BoardRepository {
  saveCards(state: CardsState): void {
    try {
      localStorage.setItem(STORAGE_KEYS.cards, JSON.stringify(state));
    } catch {
      console.warn('Failed to persist cards.');
    }
  }

  loadCards(): CardsState | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.cards);
      return raw ? (JSON.parse(raw) as CardsState) : null;
    } catch {
      return null;
    }
  }

  saveLayout(state: LayoutState): void {
    try {
      localStorage.setItem(STORAGE_KEYS.layout, JSON.stringify(state));
    } catch {
      console.warn('Failed to persist layout.');
    }
  }

  loadLayout(): LayoutState | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.layout);
      return raw ? (JSON.parse(raw) as LayoutState) : null;
    } catch {
      return null;
    }
  }

  loadStateSync() {
    return {
      cards: this.loadCards() ?? undefined,
      layout: this.loadLayout() ?? undefined,
    };
  }
}
```

### `persistenceMiddleware` — `src/store/middleware/persistenceMiddleware.ts`

```typescript
import type { Middleware } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import type { BoardRepository } from '../../repositories/BoardRepository';

export const createPersistenceMiddleware =
  (repository: BoardRepository): Middleware<{}, RootState> =>
  (store) =>
  (next) =>
  (action) => {
    const result = next(action);
    const state = store.getState();
    repository.saveCards(state.cards);
    repository.saveLayout(state.layout);
    return result;
  };
```

### `main.tsx` — wiring

```typescript
const repository = new LocalStorageRepository();
const store = createStore(repository);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
```

**Future swap:** Replace `new LocalStorageRepository()` with `new CloudflareD1Repository()`. One line change. Nothing else in the codebase needs to know.

---

## 10. React Grid Layout Configuration

```tsx
// GridCanvas.tsx
<ReactGridLayout
  layout={layoutItems} // CardLayout[] from Redux
  cols={GRID_COLS} // 12
  rowHeight={GRID_ROW_HEIGHT} // 80px
  width={containerWidth} // measured via ResizeObserver (see below)
  margin={GRID_MARGIN} // [16, 16]
  containerPadding={GRID_CONTAINER_PADDING} // [24, 24]
  draggableHandle=".drag-handle" // only the handle strip initiates drag
  compactType={null} // free placement — no auto-floating
  preventCollision={true} // cards cannot overlap
  onLayoutChange={handleLayoutChange} // dispatches updateLayout(items)
  isDraggable={editMode} // locked in view mode
  isResizable={editMode} // locked in view mode
  useCSSTransforms={true} // GPU-accelerated drag
/>
```

**Width measurement:**

```tsx
const containerRef = useRef<HTMLDivElement>(null);
const [width, setWidth] = useState(1200);

useEffect(() => {
  if (!containerRef.current) return;
  const observer = new ResizeObserver(([entry]) => {
    setWidth(entry.contentRect.width);
  });
  observer.observe(containerRef.current);
  return () => observer.disconnect();
}, []);
```

---

## 11. Layout Utilities (`src/utils/layout.ts`)

```typescript
import type { CardLayout } from '../types';
import { GRID_COLS } from '../constants';

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function findTopLeftCell(
  items: CardLayout[],
  cardWidth: number,
  cols: number = GRID_COLS
): { x: number; y: number } {
  for (let y = 0; y < 1000; y++) {
    for (let x = 0; x <= cols - cardWidth; x++) {
      const candidate: Rect = { x, y, w: cardWidth, h: 1 };
      const blocked = items.some((item) => rectsOverlap(candidate, item));
      if (!blocked) return { x, y };
    }
  }
  return { x: 0, y: 0 };
}
```

---

## 12. YouTube URL Parsing (`src/utils/youtube.ts`)

```typescript
import type { YouTubeParseResult } from '../types';

export function parseYouTubeUrl(url: string): YouTubeParseResult {
  try {
    const parsed = new URL(url.trim());

    // YouTube Shorts: youtube.com/shorts/ID
    const shortsMatch = parsed.pathname.match(/^\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (shortsMatch) {
      return { valid: true, videoId: shortsMatch[1], aspectRatio: '9:16' };
    }

    // Standard: youtube.com/watch?v=ID
    if (parsed.hostname.includes('youtube.com') && parsed.searchParams.has('v')) {
      const videoId = parsed.searchParams.get('v')!;
      if (videoId.length === 11) {
        return { valid: true, videoId, aspectRatio: '16:9' };
      }
    }

    // Short URL: youtu.be/ID
    if (parsed.hostname === 'youtu.be') {
      const videoId = parsed.pathname.slice(1, 12);
      if (videoId.length === 11) {
        return { valid: true, videoId, aspectRatio: '16:9' };
      }
    }

    return { valid: false, error: 'Please paste a valid YouTube or YouTube Shorts URL.' };
  } catch {
    return { valid: false, error: 'Please paste a valid YouTube or YouTube Shorts URL.' };
  }
}
```

---

## 13. Testing Strategy

**Stack:** Vitest + React Testing Library. Co-located test files (`*.test.ts` / `*.test.tsx` next to the file under test).

**What gets tested in MVP:**

| File                                          | What to test                                                                                 |
| --------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `utils/youtube.test.ts`                       | Valid standard URL, valid short URL, valid Shorts URL, invalid URL, malformed URL            |
| `utils/layout.test.ts`                        | Empty board → `{ x: 0, y: 0 }`, occupied top-left → next available cell, full row → next row |
| `store/cards/cardsSlice.test.ts`              | `addCard` adds entity, `removeCard` removes entity, entity adapter ids array updates         |
| `store/layout/layoutSlice.test.ts`            | `addLayoutItem`, `removeLayoutItem`, `updateLayout` replaces items                           |
| `repositories/LocalStorageRepository.test.ts` | Save/load round-trip for cards and layout, handles corrupt JSON gracefully                   |

**What is not tested in MVP:** Component rendering, drag/resize interactions, Redux thunks with async behavior. These are integration/E2E territory and overkill for MVP scope.

**Vitest config addition to `vite.config.ts`:**

```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
```

---

## 14. Accessibility Baseline

These are the minimum a11y requirements for MVP — not optional:

| Component          | Requirement                                                                                                       |
| ------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `Modal.tsx`        | Focus trap on open. Focus returns to trigger on close. `aria-modal="true"`, `role="dialog"`. Dismiss on `Escape`. |
| `Button.tsx`       | Never icon-only without `aria-label`.                                                                             |
| `CardControls.tsx` | Delete button: `aria-label="Delete card"`. Confirm button: `aria-label="Confirm delete"`.                         |
| `BoardHeader.tsx`  | Edit/View toggle: `aria-pressed` reflects current mode.                                                           |
| `AddCardModal.tsx` | Input has associated `<label>`. Error message linked via `aria-describedby`.                                      |

---

## 15. Error Boundary (`src/components/ui/ErrorBoundary.tsx`)

Wraps each `MediaCard` in `GridCanvas`. A corrupted or failed card renders a fallback instead of crashing the board.

```tsx
import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full items-center justify-center rounded-lg border border-red-800 bg-red-950 text-sm text-red-400">
          Failed to load card
        </div>
      );
    }
    return this.props.children;
  }
}
```

---

## 16. Phased Implementation Roadmap

| Phase  | Description               | Exit Criteria                                                                                                                                     |
| ------ | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1**  | Architecture & Design     | This document approved                                                                                                                            |
| **2**  | Project Scaffold          | Vite + React + TS strict + Tailwind + ESLint + Prettier + Vitest configured; `npm run dev` serves blank page; `npm test` runs; initial git commit |
| **3**  | Types + Constants + Store | `types/index.ts`, `constants/index.ts`, all three slices, store wired with preloaded state; `tsc --noEmit` clean                                  |
| **4**  | Utilities + Tests         | `youtube.ts`, `layout.ts`, `LocalStorageRepository`; all unit tests written and passing                                                           |
| **5**  | Repository + Persistence  | `BoardRepository` interface, middleware wired; round-trip save/load verified manually                                                             |
| **6**  | Core UI Shell             | `Button`, `Input`, `Modal`, `ErrorBoundary`, `BoardHeader`, `EmptyBoardState`, Edit/View toggle; no card logic yet                                |
| **7**  | Add Card Flow             | `AddCardModal`, `addYouTubeCard` thunk, 50-card limit, submit-only validation, error display                                                      |
| **8**  | Grid Canvas + Cards       | `GridCanvas`, `MediaCard`, `YouTubeEmbed`, `CardControls`, drag handle, delete confirmation; full drag/resize/persist cycle working               |
| **9**  | Polish                    | Empty state UX, hydration flash prevention, Tailwind theme consistency, a11y audit pass                                                           |
| **10** | Final Review & Commit     | ESLint clean, `tsc --noEmit` clean, all tests passing, manual smoke test (add → refresh → drag → delete → refresh), tagged git commit `v0.1.0`    |

Each phase ends with a working, committable state of the application.

---

## Appendix: Dependency Versions

```json
{
  "dependencies": {
    "@reduxjs/toolkit": "^2.12.0",
    "nanoid": "^5.1.11",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-grid-layout": "^2.2.3",
    "react-redux": "^9.3.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.0.1",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.3",
    "autoprefixer": "^10.4.20",
    "jsdom": "^25.0.1",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.14",
    "typescript": "~5.6.2",
    "vite": "^5.4.10",
    "vitest": "^2.1.8"
  }
}
```

> `react-grid-layout ^2.2.3` ships bundled TypeScript types. Do not upgrade without verifying type compatibility.
