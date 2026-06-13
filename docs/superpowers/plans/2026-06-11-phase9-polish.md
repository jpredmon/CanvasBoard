# Phase 9: Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the Cinematic Dark visual theme, fix three bugs, and add purposeful transitions to turn the functional Phase 8 app into a portfolio-quality product.

**Architecture:** Component-by-component pass — each task fixes bugs and applies styling for one component before moving to the next. No new dependencies. All transitions use Tailwind utilities + a `requestAnimationFrame` mount-delay pattern. No component tests exist for this codebase (per the architecture doc — component rendering is out of MVP test scope); verification is TypeScript + visual browser smoke test.

**Tech Stack:** React 18, TypeScript (strict), Tailwind CSS, Vite, Vitest

---

## File Map

| File                                           | Change                                                             |
| ---------------------------------------------- | ------------------------------------------------------------------ |
| `src/components/ui/Button.tsx`                 | `indigo` → `violet`, add `'edit-active'` variant                   |
| `src/components/ui/Input.tsx`                  | `indigo` → `violet`                                                |
| `src/components/board/GridCanvas.tsx`          | Bug: `preventCollision={false}` → `true`                           |
| `src/components/cards/embeds/YouTubeEmbed.tsx` | Bug: use `aspectRatio` for iframe `title`                          |
| `src/components/ui/Modal.tsx`                  | Backdrop blur, panel border, mount animation, focus return bug fix |
| `src/components/board/BoardHeader.tsx`         | Split title, ambient glow, `edit-active` Done button               |
| `src/components/board/EditModeBanner.tsx`      | **New** — always-mounted slide banner                              |
| `src/pages/CanvasBoardPage.tsx`                | Wire `EditModeBanner`, `bg-zinc-950`                               |
| `src/components/board/EmptyBoardState.tsx`     | Full redesign — grid bg, bold headline, violet CTA                 |
| `src/components/cards/CardControls.tsx`        | Violet handle, delete fade via `onDeleteStart` callback            |
| `src/components/cards/MediaCard.tsx`           | Border hover, `deleting` state, pass `onDeleteStart`               |

---

## Task 1: Palette swap — Button.tsx + Input.tsx

**Files:**

- Modify: `src/components/ui/Button.tsx`
- Modify: `src/components/ui/Input.tsx`

- [ ] **Step 1: Replace Button.tsx**

```tsx
// src/components/ui/Button.tsx
import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'ghost' | 'danger' | 'edit-active';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-50',
  ghost: 'bg-transparent text-zinc-300 hover:bg-zinc-700',
  danger: 'bg-transparent text-red-400 hover:bg-red-900/40',
  'edit-active':
    'border border-violet-500/50 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20',
};

export function Button({ variant = 'primary', className = '', ...props }: Props) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${variantClasses[variant]} ${className}`}
    />
  );
}
```

- [ ] **Step 2: Replace Input.tsx**

```tsx
// src/components/ui/Input.tsx
import type { InputHTMLAttributes } from 'react';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
}

export function Input({ label, id, error, className = '', ...props }: Props) {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-zinc-300">
        {label}
      </label>
      <input
        id={id}
        aria-describedby={errorId}
        aria-invalid={!!error}
        className={`rounded-md border bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors focus:ring-2 focus:ring-violet-500 ${error ? 'border-red-500' : 'border-zinc-600'} ${className}`}
        {...props}
      />
      {error && (
        <p id={errorId} className="text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 3: TypeScript check**

```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/Button.tsx src/components/ui/Input.tsx
git commit -m "feat(polish): swap indigo to violet, add edit-active Button variant"
```

---

## Task 2: Bug fix — preventCollision

**Files:**

- Modify: `src/components/board/GridCanvas.tsx`

- [ ] **Step 1: Fix the prop**

On line 60 of `src/components/board/GridCanvas.tsx`, change:

```tsx
preventCollision={false}
```

to:

```tsx
preventCollision={true}
```

- [ ] **Step 2: Verify in browser**

Open `http://localhost:5173`. Enter Edit mode. Drag a card on top of another — it should snap back to its original position instead of overlapping.

- [ ] **Step 3: Commit**

```bash
git add src/components/board/GridCanvas.tsx
git commit -m "fix: enable preventCollision so cards cannot overlap"
```

---

## Task 3: Bug fix — YouTubeEmbed aspectRatio

**Files:**

- Modify: `src/components/cards/embeds/YouTubeEmbed.tsx`

- [ ] **Step 1: Replace YouTubeEmbed.tsx**

```tsx
// src/components/cards/embeds/YouTubeEmbed.tsx
import type { AspectRatio } from '../../../types';

interface Props {
  videoId: string;
  aspectRatio: AspectRatio;
}

const titleByAspectRatio: Record<AspectRatio, string> = {
  '16:9': 'YouTube video — 16:9',
  '9:16': 'YouTube Shorts — 9:16',
};

export function YouTubeEmbed({ videoId, aspectRatio }: Props) {
  return (
    <iframe
      className="h-full w-full rounded-b-lg"
      src={`https://www.youtube.com/embed/${videoId}`}
      title={titleByAspectRatio[aspectRatio]}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  );
}
```

- [ ] **Step 2: TypeScript check**

```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/cards/embeds/YouTubeEmbed.tsx
git commit -m "fix: use aspectRatio for iframe title a11y attribute"
```

---

## Task 4: Modal — backdrop blur, mount animation, focus return

**Files:**

- Modify: `src/components/ui/Modal.tsx`

- [ ] **Step 1: Replace Modal.tsx**

```tsx
// src/components/ui/Modal.tsx
import { useEffect, useRef, useState, type ReactNode } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function Modal({ open, onClose, title, children }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const titleId = 'modal-title';

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => setVisible(true));
    return () => {
      cancelAnimationFrame(id);
      setVisible(false);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !panelRef.current) return;

    const trigger = document.activeElement as HTMLElement | null;
    const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    focusable[0]?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      trigger?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-150 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`w-full max-w-md rounded-lg border border-zinc-700/50 bg-zinc-800 p-6 shadow-xl transition-all duration-150 ${
          visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        <h2 id={titleId} className="mb-4 text-base font-semibold text-zinc-100">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify in browser**

Open `http://localhost:5173`. Click "+ Add Card":

- Modal should fade in and scale up (not snap open).
- Press Escape — modal closes and focus returns to the "+ Add Card" button (visible focus ring).

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/Modal.tsx
git commit -m "feat(polish): modal fade animation, backdrop blur, focus return on close"
```

---

## Task 5: BoardHeader — split title, ambient glow, Done button

**Files:**

- Modify: `src/components/board/BoardHeader.tsx`

- [ ] **Step 1: Replace BoardHeader.tsx**

```tsx
// src/components/board/BoardHeader.tsx
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
          aria-label="Add card"
        >
          + Add Card
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

- [ ] **Step 2: Verify in browser**

Open `http://localhost:5173`:

- Title reads "CANVAS" (white) + "BOARD" (violet).
- A soft violet glow is visible in the top-right corner of the header.
- Click "Edit" — button becomes violet-tinted "Done". Click again — reverts to plain "Edit".

- [ ] **Step 3: Commit**

```bash
git add src/components/board/BoardHeader.tsx
git commit -m "feat(polish): cinematic header — split title, ambient glow, edit-active Done button"
```

---

## Task 6: EditModeBanner — new component

**Files:**

- Create: `src/components/board/EditModeBanner.tsx`

- [ ] **Step 1: Create EditModeBanner.tsx**

```tsx
// src/components/board/EditModeBanner.tsx
import { useEffect, useState } from 'react';

interface Props {
  visible: boolean;
}

export function EditModeBanner({ visible }: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setShow(visible));
    return () => cancelAnimationFrame(id);
  }, [visible]);

  return (
    <div
      className={`overflow-hidden transition-all duration-200 ease-out ${
        show ? 'max-h-10 opacity-100' : 'max-h-0 opacity-0'
      }`}
    >
      <div className="flex items-center gap-2 border-b border-violet-500/20 bg-violet-950/40 px-6 py-1.5">
        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400" aria-hidden="true" />
        <span className="text-xs font-medium tracking-wide text-violet-400">
          Editing — drag cards to rearrange
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: TypeScript check**

```
npx tsc --noEmit
```

Expected: no errors. (The component isn't wired in yet — that's Task 7.)

- [ ] **Step 3: Commit**

```bash
git add src/components/board/EditModeBanner.tsx
git commit -m "feat(polish): add EditModeBanner component with slide transition"
```

---

## Task 7: CanvasBoardPage — wire banner + zinc-950 background

**Files:**

- Modify: `src/pages/CanvasBoardPage.tsx`

- [ ] **Step 1: Replace CanvasBoardPage.tsx**

```tsx
// src/pages/CanvasBoardPage.tsx
import { BoardHeader } from '../components/board/BoardHeader';
import { EditModeBanner } from '../components/board/EditModeBanner';
import { EmptyBoardState } from '../components/board/EmptyBoardState';
import { GridCanvas } from '../components/board/GridCanvas';
import { AddCardModal } from '../components/modals/AddCardModal';
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
    </div>
  );
}
```

- [ ] **Step 2: Verify in browser**

Open `http://localhost:5173`:

- Background is now slightly darker than before (zinc-950 vs zinc-900).
- Click "Edit" — a slim violet banner slides in below the header with a pulsing dot and "Editing — drag cards to rearrange".
- Click "Done" — banner slides back up.

- [ ] **Step 3: Commit**

```bash
git add src/pages/CanvasBoardPage.tsx
git commit -m "feat(polish): wire EditModeBanner, deepen background to zinc-950"
```

---

## Task 8: EmptyBoardState — full redesign

**Files:**

- Modify: `src/components/board/EmptyBoardState.tsx`

- [ ] **Step 1: Replace EmptyBoardState.tsx**

```tsx
// src/components/board/EmptyBoardState.tsx
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { uiActions } from '../../store/ui/uiSlice';
import { Button } from '../ui/Button';

export function EmptyBoardState() {
  const dispatch = useAppDispatch();

  return (
    <div
      className="relative flex flex-1 flex-col items-center justify-center overflow-hidden"
      style={{
        backgroundImage:
          'linear-gradient(rgba(139,92,246,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.07) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(139,92,246,0.15) 0%, transparent 60%)',
        }}
        aria-hidden="true"
      />
      <div className="relative flex flex-col items-center gap-3 text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-violet-500">
          Empty Canvas
        </span>
        <p className="text-2xl font-extrabold text-zinc-100">Curate your video world</p>
        <p className="max-w-xs text-sm text-zinc-500">
          Drag, resize, and arrange YouTube videos into your personal board
        </p>
        <Button className="mt-2" onClick={() => dispatch(uiActions.openAddCardModal())}>
          + Add Card
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify in browser**

Clear localStorage (`Application → Local Storage → Delete all`) or open a fresh private window at `http://localhost:5173`:

- Faint violet grid lines are visible across the empty canvas area.
- A subtle radial glow sits behind the content.
- The overline reads "EMPTY CANVAS" in violet.
- Headline reads "Curate your video world" in large white bold text.
- Descriptor and violet "+ Add Card" button below.

- [ ] **Step 3: Commit**

```bash
git add src/components/board/EmptyBoardState.tsx
git commit -m "feat(polish): redesign empty state with canvas grid and cinematic copy"
```

---

## Task 9: CardControls + MediaCard — violet handle + delete fade

**Files:**

- Modify: `src/components/cards/CardControls.tsx`
- Modify: `src/components/cards/MediaCard.tsx`

- [ ] **Step 1: Replace CardControls.tsx**

```tsx
// src/components/cards/CardControls.tsx
import { useState } from 'react';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { cardsActions } from '../../store/cards/cardsSlice';
import { layoutActions } from '../../store/layout/layoutSlice';

interface Props {
  cardId: string;
  editMode: boolean;
  onDeleteStart: () => void;
}

export function CardControls({ cardId, editMode, onDeleteStart }: Props) {
  const dispatch = useAppDispatch();
  const [confirming, setConfirming] = useState(false);

  function handleDelete() {
    onDeleteStart();
    setTimeout(() => {
      dispatch(cardsActions.removeCard(cardId));
      dispatch(layoutActions.removeLayoutItem(cardId));
    }, 150);
  }

  if (!editMode) return null;

  return (
    <div className="drag-handle flex h-8 cursor-grab items-center justify-between rounded-t-lg bg-violet-950/60 px-2 active:cursor-grabbing">
      <span className="select-none text-violet-400" aria-hidden="true">
        ⠿
      </span>
      {confirming ? (
        <div className="flex items-center gap-1">
          <button
            className="rounded px-2 py-0.5 text-xs text-zinc-300 hover:bg-zinc-700/60"
            onClick={() => setConfirming(false)}
          >
            Cancel
          </button>
          <button
            className="rounded bg-red-700 px-2 py-0.5 text-xs text-white hover:bg-red-600"
            onClick={handleDelete}
            aria-label="Confirm delete"
          >
            Delete
          </button>
        </div>
      ) : (
        <button
          className="rounded p-0.5 text-zinc-500 hover:bg-zinc-700/60 hover:text-red-400 transition-colors"
          onClick={() => setConfirming(true)}
          aria-label="Delete card"
        >
          ×
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Replace MediaCard.tsx**

```tsx
// src/components/cards/MediaCard.tsx
import { useState } from 'react';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { CardControls } from './CardControls';
import { YouTubeEmbed } from './embeds/YouTubeEmbed';
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
      </div>
    </ErrorBoundary>
  );
}
```

- [ ] **Step 3: TypeScript check**

```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Verify in browser**

Open `http://localhost:5173`. Add a card. Enter Edit mode:

- Drag handle is dark violet, grip icon is violet.
- Click `×` — shows Cancel/Delete.
- Click Delete — card fades out smoothly before disappearing.
- Hover a card in View mode — border gets a faint violet tint.

- [ ] **Step 5: Commit**

```bash
git add src/components/cards/CardControls.tsx src/components/cards/MediaCard.tsx
git commit -m "feat(polish): violet drag handle, card delete fade, violet hover border"
```

---

## Task 10: Final verification

**Files:** none — verification only.

- [ ] **Step 1: Run existing test suite**

```
npm test
```

Expected: all tests pass (youtube, layout, cardsSlice, layoutSlice, LocalStorageRepository).

- [ ] **Step 2: TypeScript clean build**

```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Production build**

```
npm run build
```

Expected: build succeeds with no errors.

- [ ] **Step 4: Manual smoke test**

Full flow in `http://localhost:5173`:

1. **Empty state** — open fresh (or clear localStorage). Grid lines, glow, bold headline visible.
2. **Add card** — click "+ Add Card". Modal fades in smoothly. Paste a YouTube URL (e.g. `https://www.youtube.com/watch?v=dQw4w9WgXcQ`). Click "Add Card". Card appears. Modal fades out, focus returns to "+ Add Card" button.
3. **View mode** — hover card, violet border tint appears.
4. **Edit mode** — click "Edit". Done button goes violet, banner slides in. Drag a card — it moves. Try dragging onto another card — it snaps back.
5. **Delete** — click `×`, confirm Delete. Card fades out, disappears. Click "Done" — banner slides up.
6. **Refresh** — reload the page. Card is still there (localStorage persistence).
7. **Invalid URL** — open modal, paste `https://example.com`, submit. Error message appears inline. Modal stays open.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: Phase 9 Polish complete — cinematic dark theme, transitions, bug fixes"
```
