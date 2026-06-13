# Accessibility Audit — Design Spec
**Date:** 2026-06-12
**Standard:** WCAG 2.1 AA
**Scope:** All components in `src/` — fix everything directly, no findings document
**Known limitation (out of scope):** Keyboard card reordering — drag-and-drop remains mouse-only for now

---

## Context

CanvasBoard already has a solid accessibility baseline: focus traps in modals, `aria-label` on interactive elements, `aria-pressed` on the edit toggle, `role="menu"` / `role="menuitem"` in the board dropdown, and `aria-hidden` on decorative SVGs. Six gaps remain before the app meets WCAG 2.1 AA.

---

## Fixes

### 1. Arrow key navigation + focus management in `BoardDropdown` / `BoardSelector`

**WCAG:** 2.1.1 Keyboard, 2.4.3 Focus Order

**Problem:** The dropdown opens on click but focus stays on the trigger button — keyboard users must Tab into the list. Once inside, Up/Down arrow keys do nothing; users must Tab through all three buttons per board row. Escape doesn't return focus to the trigger.

**Fix — `BoardSelector.tsx`:**
- Add a `triggerRef` (`useRef<HTMLButtonElement>`) on the trigger button
- Pass `triggerRef` as a prop to `BoardDropdown` so it can restore focus on close

**Fix — `BoardDropdown.tsx`:**
- On mount (via `useEffect`), focus the first board button
- Add a `keydown` handler on the `<ul role="menu">` element:
  - `ArrowDown` — focus next board button (wraps to first)
  - `ArrowUp` — focus previous board button (wraps to last)
  - `Escape` — call `onClose()` and call `triggerRef.current?.focus()`
- Track focusable board button refs via a `useRef<(HTMLButtonElement | null)[]>` array
- Only the primary board-switch buttons participate in arrow navigation (not the rename/delete icon buttons — those remain Tab-reachable)

No changes to board item markup; no new components.

---

### 2. `prefers-reduced-motion` in `EditModeBanner`

**WCAG:** 2.3.3 Animation from Interactions

**Problem:** The pulsing dot uses `animate-pulse` unconditionally. Users with vestibular disorders who set "reduce motion" in their OS see the animation regardless.

**Fix — `EditModeBanner.tsx`:**
Replace `animate-pulse` with `motion-safe:animate-pulse`.

Tailwind's `motion-safe:` prefix wraps the class in `@media (prefers-reduced-motion: no-preference)`. Users with reduced motion see a static dot; all others see the pulse. One word change, no JS.

---

### 3. Heading hierarchy in `EmptyBoardState` and `NoBoardsState`

**WCAG:** 1.3.1 Info and Relationships

**Problem:** Both components display primary text via styled `<span>` elements. Screen reader users navigating by heading (a common pattern) cannot find these headings, and the page has no `<h2>` after the `<h1>` in `BoardHeader`.

**Fix:**
- `EmptyBoardState.tsx` — replace the outer `<span>` wrapping "Curate your video world" with `<h2>` (same Tailwind classes, no visual change)
- `NoBoardsState.tsx` — replace the outer `<span>` wrapping the welcome text with `<h2>` (same Tailwind classes, no visual change)

Heading level is `<h2>` because `<h1>` is already "CANVASBOARD" in `BoardHeader`.

---

### 4. Document title management

**WCAG:** 2.4.2 Page Titled

**Problem:** `document.title` is static ("CanvasBoard" from `index.html`) and never updates when the active board changes. Screen reader users and browser tab switchers cannot identify which board is open.

**Fix — `CanvasBoardPage.tsx`:**

```ts
useEffect(() => {
  document.title = activeBoard ? `${activeBoard.name} — CanvasBoard` : 'CanvasBoard';
}, [activeBoard]);
```

`selectActiveBoard` already exists in `boardsSelectors.ts` (used by `BoardSelector`). `CanvasBoardPage` currently only selects `selectActiveBoardId` — add a `selectActiveBoard` import and selector call. The effect runs on mount and on every board switch.

---

### 5. Skip link

**WCAG:** 2.4.1 Bypass Blocks

**Problem:** Keyboard users must Tab through all header controls (board selector, Add Card, Edit) before reaching the canvas. For a small header this is tolerable, but a skip link is required for WCAG 2.4.1.

**Fix — `CanvasBoardPage.tsx`:**
- Add `id="main-content"` to the existing `<main>` element
- Add as the first child of the page `<div>`:

```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:px-4 focus:py-2 focus:bg-violet-600 focus:text-white focus:rounded focus:top-2 focus:left-2"
>
  Skip to content
</a>
```

Invisible until focused; appears top-left on first Tab keypress. No new component.

---

### 6. Color contrast verification

**WCAG:** 1.4.3 Contrast (Minimum)

The two flagged combinations, checked against WCAG 4.5:1 minimum using Tailwind's exact hex values:

| Text | Background | Hex values | Ratio | Result |
|---|---|---|---|---|
| `text-zinc-300` | `bg-zinc-950` | #d4d4d8 on #09090b | ~13.9:1 | ✅ Pass |
| `text-red-400` | `bg-zinc-950` | #f87171 on #09090b | ~7.6:1 | ✅ Pass |

Both pass comfortably. No code change needed. Documented here for the record.

---

## Files Changed

| File | Change |
|---|---|
| `src/components/board/BoardSelector.tsx` | Add `triggerRef`, pass to `BoardDropdown` |
| `src/components/board/BoardDropdown.tsx` | Arrow key nav, focus first item on mount, focus restoration on Escape |
| `src/components/board/EditModeBanner.tsx` | `animate-pulse` → `motion-safe:animate-pulse` |
| `src/components/board/EmptyBoardState.tsx` | `<span>` → `<h2>` |
| `src/components/board/NoBoardsState.tsx` | `<span>` → `<h2>` |
| `src/pages/CanvasBoardPage.tsx` | `document.title` effect, skip link, `id="main-content"` on `<main>` |

---

## Testing

- `npx tsc -b` — no errors
- `npx vitest run` — 52/52 passing
- Manual keyboard test: Tab into page → skip link appears → Enter jumps to canvas; Tab into board selector → dropdown opens → arrow keys navigate → Escape closes and returns focus
- Manual motion test: enable "Reduce motion" in OS → EditModeBanner dot is static

## Commit Plan

1. `fix(a11y): add arrow key navigation and focus management to BoardDropdown`
2. `fix(a11y): respect prefers-reduced-motion in EditModeBanner`
3. `fix(a11y): use semantic h2 in EmptyBoardState and NoBoardsState`
4. `fix(a11y): manage document title from active board name`
5. `fix(a11y): add skip link to main content`
