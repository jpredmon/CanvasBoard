# CanvasBoard — Phase 9: Polish

**Date:** 2026-06-12
**Status:** Approved

## Overview

Four targeted fixes to bring the MVP to a production-ready baseline. No structural changes — 4 files touched.

---

## 1. Flash Fix

**Problem:** `body` has no background color in `index.css`. Before React mounts, the page flashes white briefly.

**Fix:** Add `background-color: #09090b` (zinc-950) to the `body` selector in `src/index.css`.

---

## 2. Accessibility — aria-label on inline inputs

Three inline `<input>` elements have no `<label>` or `aria-label` — only placeholders. Placeholders are not a substitute for labels per WCAG 1.3.1.

**Files and fixes:**

| File | Input | aria-label to add |
|------|-------|-------------------|
| `src/components/board/NoBoardsState.tsx` | Board name input | `"Board name"` |
| `src/components/board/BoardDropdown.tsx` | Rename board input | `"Rename board"` |
| `src/components/board/BoardDropdown.tsx` | New board name input | `"New board name"` |

Visual layout is unchanged — no refactor to the shared `Input` component.

---

## 3. Auto-enable Edit Mode on First Card

**Problem:** When a user adds their first card from the empty state, the board stays in View mode. They must manually click Edit to drag/resize, which is not intuitive.

**Behavior:** When `AddCardModal` successfully adds a card and `cardCount === 0` at the time of submit, dispatch `setEditMode(true)` immediately after the card is added.

**Implementation:**
- Add `setEditMode(state, action: PayloadAction<boolean>)` reducer to `uiSlice`
- In `AddCardModal`, read `cardCount` from the store before submitting
- After a successful `dispatch(addYouTubeCard(url))`, if `cardCount === 0`, also dispatch `uiActions.setEditMode(true)`

**Rationale for component-level (not thunk-level):** Thunk stays pure (data concerns only). UX logic is co-located with the action that triggers it. Easier to test in isolation.

---

## Files Changed

| File | Change |
|------|--------|
| `src/index.css` | Add `body { background-color: #09090b; }` |
| `src/components/board/NoBoardsState.tsx` | Add `aria-label="Board name"` to input |
| `src/components/board/BoardDropdown.tsx` | Add `aria-label` to rename and new-board inputs |
| `src/store/ui/uiSlice.ts` | Add `setEditMode` reducer |
| `src/components/modals/AddCardModal.tsx` | Dispatch `setEditMode(true)` when adding first card |

> Note: 5 files touched (the setEditMode addition requires both uiSlice and AddCardModal).

---

## Out of Scope

- Mobile layout (explicitly deferred to post-v0.1.0)
- Tailwind custom theme extraction (hardcoded utility classes are acceptable for MVP)
- `BoardDropdown` inline input refactor to shared component
