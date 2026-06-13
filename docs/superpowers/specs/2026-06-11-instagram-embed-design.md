# Instagram Embed — Design Spec

**Date:** 2026-06-11
**Status:** Approved

---

## Overview

Add Instagram post and Reel support to CanvasBoard as a second card type, following the extension pattern defined in the Phase 1 architecture doc. Users add Instagram cards via a dedicated "Add Instagram" button in the header. Cards embed via plain `<iframe>` (no external scripts, no API key). Posts default to square (1:1) cards; Reels default to portrait (9:16).

---

## Decisions

| #   | Decision                                                                                                                                           |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Support both Posts (`/p/`) and Reels (`/reel/`) URL formats                                                                                        |
| 2   | Iframe embed — `instagram.com/p/SHORTCODE/embed` — no Instagram JS widget                                                                          |
| 3   | Separate "Add YouTube" / "Add Instagram" buttons in the header (not a unified input)                                                               |
| 4   | Auto-detect aspect ratio from URL type: post → `1:1`, reel → `9:16`                                                                                |
| 5   | Follow Option A: strict extension pattern — new thunk, new modal, new UI state alongside existing YouTube equivalents. No shared abstractions yet. |

---

## Type System (`src/types/index.ts`)

```ts
export type AspectRatio = '16:9' | '9:16' | '1:1'; // add '1:1'

export type MediaType = 'youtube' | 'instagram'; // add 'instagram'

export interface InstagramCard extends BaseCard {
  type: 'instagram';
  shortcode: string; // extracted from URL, used to construct embed URL
  postType: 'post' | 'reel';
}

export type MediaCard = YouTubeCard | InstagramCard; // extend union

export type InstagramParseResult =
  | { valid: true; shortcode: string; postType: 'post' | 'reel'; aspectRatio: AspectRatio }
  | { valid: false; error: string };
```

The embed URL is constructed at render time from `shortcode` and `postType` — it is not stored on the card.

---

## URL Parser (`src/utils/instagram.ts`)

Handles:

| Input                           | shortcode | postType | aspectRatio |
| ------------------------------- | --------- | -------- | ----------- |
| `instagram.com/p/ABC123/`       | `ABC123`  | `post`   | `1:1`       |
| `www.instagram.com/p/ABC123`    | `ABC123`  | `post`   | `1:1`       |
| `instagram.com/reel/ABC123/`    | `ABC123`  | `reel`   | `9:16`      |
| `www.instagram.com/reel/ABC123` | `ABC123`  | `reel`   | `9:16`      |
| non-Instagram hostname          | —         | —        | invalid     |
| malformed string                | —         | —        | invalid     |

Shortcode regex: `[A-Za-z0-9_-]+` (no length enforcement — Instagram shortcodes vary in length).

Error message on invalid: `"Please paste a valid Instagram post or Reel URL."`

Tests in `src/utils/instagram.test.ts`: valid post, valid reel, trailing slash, no trailing slash, wrong hostname, garbage string.

---

## Constants (`src/constants/index.ts`)

Add `'1:1'` to `CARD_DEFAULTS`:

```ts
'1:1': { w: 4, h: 4, minW: 2, minH: 2 }
```

4×4 grid units → ~320×320px at current row height — approximately square.

---

## State (`src/store/ui/uiSlice.ts`)

Add to `UIState`:

```ts
addInstagramModalOpen: boolean;
```

Add reducers: `openAddInstagramModal`, `closeAddInstagramModal`. Mirrors the existing `addCardModalOpen` pattern exactly.

---

## Thunk (`src/store/cards/cardsThunks.ts`)

Add `addInstagramCard(url: string)` alongside `addYouTubeCard`. Same shape:

1. Call `parseInstagramUrl(url)` — throw on invalid
2. Check 50-card limit — throw if at max
3. Build `InstagramCard` with `nanoid()` id
4. Compute `CardLayout` via `findTopLeftCell` using `CARD_DEFAULTS[aspectRatio]`
5. Dispatch `cardsActions.addCard` and `layoutActions.addLayoutItem`

No changes to `persistenceMiddleware`, `BoardRepository`, or `LocalStorageRepository`.

---

## Components

### `src/components/cards/embeds/InstagramEmbed.tsx`

Plain `<iframe>` component. Props: `shortcode: string`, `postType: 'post' | 'reel'`.

Embed URLs:

- Post: `https://www.instagram.com/p/SHORTCODE/embed`
- Reel: `https://www.instagram.com/reel/SHORTCODE/embed`

Same `className="h-full w-full rounded-b-lg"` as `YouTubeEmbed`.

### `src/components/modals/AddInstagramModal.tsx`

Mirrors `AddCardModal`. Uses same `Modal` + `Input` + `Button` primitives.

- Title: `"Add an Instagram post"`
- Input label: `"Instagram URL"`
- Placeholder: `"https://www.instagram.com/p/..."`
- Reads `addInstagramModalOpen` from store
- Dispatches `addInstagramCard` on submit

### `src/components/cards/MediaCard.tsx`

Add `InstagramEmbed` branch:

```tsx
{
  card.type === 'youtube' && <YouTubeEmbed videoId={card.videoId} aspectRatio={card.aspectRatio} />;
}
{
  card.type === 'instagram' && (
    <InstagramEmbed shortcode={card.shortcode} postType={card.postType} />
  );
}
```

TypeScript's exhaustive union checking will produce a compile error if a future `MediaType` is added but not handled here.

### `src/components/board/BoardHeader.tsx`

Replace single `"+ Add video"` button with two buttons:

- `"+ YouTube"` → dispatches `openAddCardModal`
- `"+ Instagram"` → dispatches `openAddInstagramModal`

Both hidden in View mode (same `editMode` guard as the existing button).

### `src/pages/CanvasBoardPage.tsx`

Render `<AddInstagramModal />` alongside existing `<AddCardModal />`.

---

## Files Changed

| File                                             | Change                                                                                                                        |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `src/types/index.ts`                             | Add `'1:1'` to AspectRatio, `'instagram'` to MediaType, `InstagramCard`, extend `MediaCard` union, add `InstagramParseResult` |
| `src/constants/index.ts`                         | Add `'1:1'` to `CARD_DEFAULTS`                                                                                                |
| `src/store/ui/uiSlice.ts`                        | Add `addInstagramModalOpen`, `openAddInstagramModal`, `closeAddInstagramModal`                                                |
| `src/store/cards/cardsThunks.ts`                 | Add `addInstagramCard` thunk                                                                                                  |
| `src/components/cards/MediaCard.tsx`             | Add `instagram` branch                                                                                                        |
| `src/components/board/BoardHeader.tsx`           | Two buttons instead of one                                                                                                    |
| `src/pages/CanvasBoardPage.tsx`                  | Render `AddInstagramModal`                                                                                                    |
| `src/utils/instagram.ts`                         | **New** — URL parser                                                                                                          |
| `src/utils/instagram.test.ts`                    | **New** — parser unit tests                                                                                                   |
| `src/components/cards/embeds/InstagramEmbed.tsx` | **New** — iframe embed                                                                                                        |
| `src/components/modals/AddInstagramModal.tsx`    | **New** — add card modal                                                                                                      |
