# Instagram Embed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Instagram post and Reel support as a second card type using plain iframe embeds, following the extension pattern from the Phase 1 architecture doc.

**Architecture:** New `InstagramCard` type added to the discriminated union. A `parseInstagramUrl` utility extracts shortcode and postType from URLs. A new `addInstagramCard` thunk and `AddInstagramModal` mirror their YouTube equivalents exactly. `InstagramEmbed` renders a plain iframe. The header gets a second "+ Instagram" button with its own modal open/close state in `uiSlice`.

**Tech Stack:** React 18, TypeScript (strict), Redux Toolkit, Vite, Vitest, Tailwind CSS

---

### Task 1: Types and constants

**Files:**

- Modify: `src/types/index.ts`
- Modify: `src/constants/index.ts`

- [ ] **Step 1: Replace `src/types/index.ts` with the expanded version**

```ts
export type MediaType = 'youtube' | 'instagram';

export type AspectRatio = '16:9' | '9:16' | '1:1';

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

export interface InstagramCard extends BaseCard {
  type: 'instagram';
  shortcode: string;
  postType: 'post' | 'reel';
}

export type MediaCard = YouTubeCard | InstagramCard;

export interface CardLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW: number;
  minH: number;
}

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

export type YouTubeParseResult =
  | { valid: true; videoId: string; aspectRatio: AspectRatio }
  | { valid: false; error: string };

export type InstagramParseResult =
  | { valid: true; shortcode: string; postType: 'post' | 'reel'; aspectRatio: AspectRatio }
  | { valid: false; error: string };
```

Note: `UIState` keeps only its current two fields here. `addInstagramModalOpen` is added in Task 3 alongside the uiSlice update to avoid an intermediate TypeScript error.

- [ ] **Step 2: Replace `src/constants/index.ts` with the version that adds `'1:1'`**

```ts
export const MAX_CARDS = 50;

export const GRID_COLS = 12;
export const GRID_ROW_HEIGHT = 80;
export const GRID_MARGIN: [number, number] = [16, 16];
export const GRID_CONTAINER_PADDING: [number, number] = [24, 24];

export const CARD_DEFAULTS = {
  '16:9': { w: 4, h: 3, minW: 2, minH: 2 },
  '9:16': { w: 2, h: 4, minW: 2, minH: 2 },
  '1:1': { w: 4, h: 4, minW: 2, minH: 2 },
} as const satisfies Record<string, { w: number; h: number; minW: number; minH: number }>;

export const STORAGE_KEYS = {
  cards: 'canvasboard:cards',
  layout: 'canvasboard:layout',
} as const;
```

- [ ] **Step 3: Verify TypeScript is clean**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/types/index.ts src/constants/index.ts
git commit -m "feat(instagram): add InstagramCard types and 1:1 card defaults"
```

---

### Task 2: Instagram URL parser (TDD)

**Files:**

- Create: `src/utils/instagram.test.ts`
- Create: `src/utils/instagram.ts`

- [ ] **Step 1: Create `src/utils/instagram.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { parseInstagramUrl } from './instagram';

describe('parseInstagramUrl', () => {
  it('parses a post URL with trailing slash', () => {
    const result = parseInstagramUrl('https://www.instagram.com/p/ABC123def45/');
    expect(result).toEqual({
      valid: true,
      shortcode: 'ABC123def45',
      postType: 'post',
      aspectRatio: '1:1',
    });
  });

  it('parses a post URL without trailing slash', () => {
    const result = parseInstagramUrl('https://www.instagram.com/p/ABC123def45');
    expect(result).toEqual({
      valid: true,
      shortcode: 'ABC123def45',
      postType: 'post',
      aspectRatio: '1:1',
    });
  });

  it('parses a reel URL with trailing slash', () => {
    const result = parseInstagramUrl('https://www.instagram.com/reel/ABC123def45/');
    expect(result).toEqual({
      valid: true,
      shortcode: 'ABC123def45',
      postType: 'reel',
      aspectRatio: '9:16',
    });
  });

  it('parses a reel URL without trailing slash', () => {
    const result = parseInstagramUrl('https://www.instagram.com/reel/ABC123def45');
    expect(result).toEqual({
      valid: true,
      shortcode: 'ABC123def45',
      postType: 'reel',
      aspectRatio: '9:16',
    });
  });

  it('rejects a non-Instagram URL', () => {
    const result = parseInstagramUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(result).toEqual({
      valid: false,
      error: 'Please paste a valid Instagram post or Reel URL.',
    });
  });

  it('rejects a malformed string', () => {
    const result = parseInstagramUrl('not a url');
    expect(result).toEqual({
      valid: false,
      error: 'Please paste a valid Instagram post or Reel URL.',
    });
  });

  it('rejects an Instagram profile URL (no /p/ or /reel/)', () => {
    const result = parseInstagramUrl('https://www.instagram.com/someuser/');
    expect(result).toEqual({
      valid: false,
      error: 'Please paste a valid Instagram post or Reel URL.',
    });
  });
});
```

- [ ] **Step 2: Run tests — confirm they fail**

Run: `npx vitest run src/utils/instagram.test.ts`
Expected: FAIL — `Cannot find module './instagram'`

- [ ] **Step 3: Create `src/utils/instagram.ts`**

```ts
import type { InstagramParseResult } from '../types';

export function parseInstagramUrl(url: string): InstagramParseResult {
  const invalid: InstagramParseResult = {
    valid: false,
    error: 'Please paste a valid Instagram post or Reel URL.',
  };

  try {
    const parsed = new URL(url.trim());

    if (parsed.hostname !== 'instagram.com' && parsed.hostname !== 'www.instagram.com') {
      return invalid;
    }

    const reelMatch = parsed.pathname.match(/^\/reel\/([A-Za-z0-9_-]+)/);
    if (reelMatch) {
      return { valid: true, shortcode: reelMatch[1], postType: 'reel', aspectRatio: '9:16' };
    }

    const postMatch = parsed.pathname.match(/^\/p\/([A-Za-z0-9_-]+)/);
    if (postMatch) {
      return { valid: true, shortcode: postMatch[1], postType: 'post', aspectRatio: '1:1' };
    }

    return invalid;
  } catch {
    return invalid;
  }
}
```

- [ ] **Step 4: Run tests — confirm they pass**

Run: `npx vitest run src/utils/instagram.test.ts`
Expected: 7 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/utils/instagram.ts src/utils/instagram.test.ts
git commit -m "feat(instagram): add Instagram URL parser with tests"
```

---

### Task 3: UI state for Instagram modal

**Files:**

- Modify: `src/types/index.ts` (UIState only)
- Modify: `src/store/ui/uiSlice.ts`

- [ ] **Step 1: Add `addInstagramModalOpen` to `UIState` in `src/types/index.ts`**

Replace the `UIState` interface:

```ts
export interface UIState {
  addCardModalOpen: boolean;
  addInstagramModalOpen: boolean;
  editMode: boolean;
}
```

- [ ] **Step 2: Replace `src/store/ui/uiSlice.ts` with the expanded version**

```ts
import { createSlice } from '@reduxjs/toolkit';
import type { UIState } from '../../types';

const initialState: UIState = {
  addCardModalOpen: false,
  addInstagramModalOpen: false,
  editMode: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openAddCardModal(state) {
      state.addCardModalOpen = true;
    },
    closeAddCardModal(state) {
      state.addCardModalOpen = false;
    },
    openAddInstagramModal(state) {
      state.addInstagramModalOpen = true;
    },
    closeAddInstagramModal(state) {
      state.addInstagramModalOpen = false;
    },
    toggleEditMode(state) {
      state.editMode = !state.editMode;
    },
  },
});

export const uiActions = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
```

- [ ] **Step 3: Verify TypeScript is clean**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/types/index.ts src/store/ui/uiSlice.ts
git commit -m "feat(instagram): add Instagram modal UI state"
```

---

### Task 4: `addInstagramCard` thunk

**Files:**

- Modify: `src/store/cards/cardsThunks.ts`

- [ ] **Step 1: Replace `src/store/cards/cardsThunks.ts` with the version that includes both thunks**

```ts
import { nanoid } from 'nanoid';
import type { AppThunk } from '../index';
import type { YouTubeCard, InstagramCard, CardLayout } from '../../types';
import { MAX_CARDS, CARD_DEFAULTS } from '../../constants';
import { parseYouTubeUrl } from '../../utils/youtube';
import { parseInstagramUrl } from '../../utils/instagram';
import { findTopLeftCell } from '../../utils/layout';
import { cardsActions } from './cardsSlice';
import { layoutActions } from '../layout/layoutSlice';

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

export const addInstagramCard =
  (url: string): AppThunk =>
  (dispatch, getState) => {
    const result = parseInstagramUrl(url);
    if (!result.valid) throw new Error(result.error);

    const { cards, layout } = getState();
    if (cards.ids.length >= MAX_CARDS) {
      throw new Error(`Board is full (${MAX_CARDS} card maximum).`);
    }

    const id = nanoid();
    const defaults = CARD_DEFAULTS[result.aspectRatio];

    const card: InstagramCard = {
      id,
      type: 'instagram',
      url,
      shortcode: result.shortcode,
      postType: result.postType,
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

- [ ] **Step 2: Verify TypeScript is clean**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/store/cards/cardsThunks.ts
git commit -m "feat(instagram): add addInstagramCard thunk"
```

---

### Task 5: `InstagramEmbed` component

**Files:**

- Create: `src/components/cards/embeds/InstagramEmbed.tsx`

- [ ] **Step 1: Create `src/components/cards/embeds/InstagramEmbed.tsx`**

```tsx
interface Props {
  shortcode: string;
  postType: 'post' | 'reel';
}

export function InstagramEmbed({ shortcode, postType }: Props) {
  const src =
    postType === 'reel'
      ? `https://www.instagram.com/reel/${shortcode}/embed`
      : `https://www.instagram.com/p/${shortcode}/embed`;

  return (
    <iframe
      className="h-full w-full rounded-b-lg"
      src={src}
      title={`Instagram ${postType}`}
      allowFullScreen
    />
  );
}
```

- [ ] **Step 2: Verify TypeScript is clean**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/cards/embeds/InstagramEmbed.tsx
git commit -m "feat(instagram): add InstagramEmbed iframe component"
```

---

### Task 6: `AddInstagramModal` component

**Files:**

- Create: `src/components/modals/AddInstagramModal.tsx`

- [ ] **Step 1: Create `src/components/modals/AddInstagramModal.tsx`**

```tsx
import { useState, type FormEvent } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { uiActions } from '../../store/ui/uiSlice';
import { addInstagramCard } from '../../store/cards/cardsThunks';

export function AddInstagramModal() {
  const dispatch = useAppDispatch();
  const open = useAppSelector((state) => state.ui.addInstagramModalOpen);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  function handleClose() {
    dispatch(uiActions.closeAddInstagramModal());
    setUrl('');
    setError('');
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      dispatch(addInstagramCard(url));
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Add an Instagram post">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="instagram-url"
          label="Instagram URL"
          placeholder="https://www.instagram.com/p/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          error={error}
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={url.trim() === ''}>
            Add Card
          </Button>
        </div>
      </form>
    </Modal>
  );
}
```

- [ ] **Step 2: Verify TypeScript is clean**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/modals/AddInstagramModal.tsx
git commit -m "feat(instagram): add AddInstagramModal component"
```

---

### Task 7: Wire up MediaCard, BoardHeader, and CanvasBoardPage

**Files:**

- Modify: `src/components/cards/MediaCard.tsx`
- Modify: `src/components/board/BoardHeader.tsx`
- Modify: `src/pages/CanvasBoardPage.tsx`

- [ ] **Step 1: Replace `src/components/cards/MediaCard.tsx`**

```tsx
import { useState } from 'react';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { CardControls } from './CardControls';
import { YouTubeEmbed } from './embeds/YouTubeEmbed';
import { InstagramEmbed } from './embeds/InstagramEmbed';
import type { MediaCard as MediaCardType } from '../../types';

interface Props {
  card: MediaCardType;
  editMode: boolean;
}

export function MediaCard({ card, editMode }: Props) {
  const [deleting, setDeleting] = useState(false);

  return (
    <ErrorBoundary>
      <div
        className={`flex h-full flex-col overflow-hidden rounded-lg border border-zinc-700/60 bg-zinc-800 ${
          deleting
            ? 'opacity-0 transition-opacity duration-150'
            : 'opacity-100 transition-colors duration-200 hover:border-violet-500/30'
        }`}
      >
        <CardControls
          cardId={card.id}
          editMode={editMode}
          onDeleteStart={() => setDeleting(true)}
        />
        {card.type === 'youtube' && (
          <YouTubeEmbed videoId={card.videoId} aspectRatio={card.aspectRatio} />
        )}
        {card.type === 'instagram' && (
          <InstagramEmbed shortcode={card.shortcode} postType={card.postType} />
        )}
      </div>
    </ErrorBoundary>
  );
}
```

- [ ] **Step 2: Replace `src/components/board/BoardHeader.tsx`**

```tsx
import { Button } from '../ui/Button';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { uiActions } from '../../store/ui/uiSlice';
import { selectCardCount } from '../../store/cards/cardsSelectors';
import { MAX_CARDS } from '../../constants';

export function BoardHeader() {
  const dispatch = useAppDispatch();
  const editMode = useAppSelector((state) => state.ui.editMode);
  const cardCount = useAppSelector(selectCardCount);

  return (
    <header className="relative flex items-center justify-between overflow-hidden border-b border-zinc-800 px-6 py-3">
      <div
        className="pointer-events-none absolute right-0 top-0 h-full w-64"
        style={{
          background:
            'radial-gradient(ellipse at top right, rgba(139,92,246,0.12) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />
      <h1 className="text-lg font-extrabold uppercase tracking-widest">
        <span className="text-zinc-100">CANVAS</span>
        <span className="text-violet-400">BOARD</span>
      </h1>
      <div className="flex items-center gap-2">
        <Button
          variant="primary"
          onClick={() => dispatch(uiActions.openAddCardModal())}
          disabled={cardCount >= MAX_CARDS}
          aria-label="Add YouTube card"
        >
          + YouTube
        </Button>
        <Button
          variant="primary"
          onClick={() => dispatch(uiActions.openAddInstagramModal())}
          disabled={cardCount >= MAX_CARDS}
          aria-label="Add Instagram card"
        >
          + Instagram
        </Button>
        <Button
          variant={editMode ? 'edit-active' : 'ghost'}
          onClick={() => dispatch(uiActions.toggleEditMode())}
          aria-pressed={editMode}
        >
          {editMode ? 'Done' : 'Edit'}
        </Button>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Replace `src/pages/CanvasBoardPage.tsx`**

```tsx
import { BoardHeader } from '../components/board/BoardHeader';
import { EditModeBanner } from '../components/board/EditModeBanner';
import { EmptyBoardState } from '../components/board/EmptyBoardState';
import { GridCanvas } from '../components/board/GridCanvas';
import { AddCardModal } from '../components/modals/AddCardModal';
import { AddInstagramModal } from '../components/modals/AddInstagramModal';
import { useAppSelector } from '../hooks/useAppSelector';
import { selectCardCount } from '../store/cards/cardsSelectors';

export default function CanvasBoardPage() {
  const cardCount = useAppSelector(selectCardCount);
  const editMode = useAppSelector((state) => state.ui.editMode);

  return (
    <div className="flex h-screen flex-col bg-zinc-950">
      <BoardHeader />
      <EditModeBanner visible={editMode} />
      {cardCount === 0 ? <EmptyBoardState /> : <GridCanvas />}
      <AddCardModal />
      <AddInstagramModal />
    </div>
  );
}
```

- [ ] **Step 4: Verify TypeScript is clean**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 5: Run all tests**

Run: `npx vitest run`
Expected: all existing tests pass plus the 7 new Instagram parser tests

- [ ] **Step 6: Commit**

```bash
git add src/components/cards/MediaCard.tsx src/components/board/BoardHeader.tsx src/pages/CanvasBoardPage.tsx
git commit -m "feat(instagram): wire Instagram cards into MediaCard, BoardHeader, and page"
```

---

### Task 8: Final verification

- [ ] **Step 1: Run all tests**

Run: `npx vitest run`
Expected: all tests pass

- [ ] **Step 2: TypeScript clean check**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Smoke test in the browser**

Start the dev server: `npm run dev`

Verify each of the following:

1. Header shows "+ YouTube" and "+ Instagram" buttons side by side
2. "+ YouTube" opens the YouTube modal — paste `https://www.youtube.com/watch?v=dQw4w9WgXcQ` — card appears (16:9 landscape)
3. "+ Instagram" opens the Instagram modal — paste a valid post URL (`https://www.instagram.com/p/SHORTCODE/`) — card appears (square, 4×4 grid units)
4. "+ Instagram" again — paste a valid reel URL (`https://www.instagram.com/reel/SHORTCODE/`) — card appears (portrait, 9:16)
5. Invalid Instagram URL in the modal shows the error: `"Please paste a valid Instagram post or Reel URL."`
6. Refresh the page — all cards persist via localStorage
7. Enter Edit mode — all card types have drag handles and delete buttons

- [ ] **Step 4: Push to GitHub**

```bash
git push origin master
```
