# CanvasBoard — Phase 9: Polish Design

**Date:** 2026-06-11
**Status:** Approved

## Goal

Transform the functional Phase 8 app into a portfolio-quality product. Fix three bugs that crept in during implementation, apply a Cinematic Dark visual theme, and add purposeful transitions throughout.

---

## Decisions

| # | Question | Decision |
|---|----------|----------|
| 1 | Visual direction | Cinematic Dark — violet accents, ambient radial glows, deeper background |
| 2 | Edit mode indicator | Slim violet banner below header (pulsing dot + hint text) — slides in/out |
| 3 | Empty state design | Canvas grid background + bold headline + violet CTA |
| 4 | Motion | Purposeful — modal fade, banner slide, card delete fade. ~150–200ms. No libraries. |
| 5 | Implementation order | Component by component — bugs and styling together per component |
| 6 | Tailwind config changes | None — all changes use existing `violet-*` and `zinc-*` utilities |

---

## 1. Palette & Theme

**Accent color:** Replace all `indigo-*` with `violet-*` throughout the codebase.
- `indigo-600` → `violet-600`
- `indigo-500` → `violet-500`
- `ring-indigo-500` → `ring-violet-500`
- `focus-visible:ring-indigo-500` → `focus-visible:ring-violet-500`

**Background:** Page background `zinc-900` → `zinc-950`. Cards remain `zinc-800/zinc-900`. The deeper background increases card contrast and reinforces the cinematic atmosphere.

**Title treatment:** `CANVAS` in `text-zinc-100`, `BOARD` in `text-violet-400`. Both `font-extrabold tracking-widest uppercase`. No gradient — simpler, more legible, same visual split.

**No `tailwind.config.js` changes required.**

---

## 2. Component Changes

### `BoardHeader`

- Title restyled: `<span>CANVAS</span><span className="text-violet-400">BOARD</span>`
- Ambient radial glow in top-right corner of header via inline `style` (`radial-gradient` from `violet-500/20` to transparent)
- "Done" button (edit mode active): `bg-violet-500/10 border border-violet-500/50 text-violet-300`
- "Edit" button (inactive): unchanged ghost style

### `EditModeBanner` (new component)

- Location: `src/components/board/EditModeBanner.tsx`
- Renders below `<BoardHeader />` in `CanvasBoardPage` when `editMode` is true
- Content: pulsing violet dot (`animate-pulse`) + `"Editing — drag cards to rearrange"`
- Styling: `bg-violet-950/40 border-b border-violet-500/20 text-violet-400`
- Transition: `max-height` + `opacity` CSS transition, 200ms ease-out — slides down on enter, slides up on exit
- Always mounted; receives a `visible` prop (driven by `editMode` in `CanvasBoardPage`)
- Uses a `useEffect` on `visible` to trigger the CSS transition on the next frame via `requestAnimationFrame`, so both enter and exit animate correctly
- Implementation: `overflow-hidden transition-all duration-200 ease-out` with `max-h-0 opacity-0` ↔ `max-h-10 opacity-100`

### `EmptyBoardState`

Full redesign:
- Outer container: `flex-1 flex flex-col items-center justify-center` with inline `style` for faint canvas grid (`background-image: linear-gradient(...)` — two perpendicular `rgba(139,92,246,0.07)` lines at 40px intervals)
- Ambient radial glow behind content: `absolute` positioned `div` with `radial-gradient(circle, rgba(139,92,246,0.15), transparent 60%)`
- Overline: `"EMPTY CANVAS"` — `text-violet-500 text-xs font-bold tracking-widest uppercase`
- Headline: `"Curate your video world"` — `text-zinc-100 text-2xl font-extrabold`
- Descriptor: `"Drag, resize, and arrange YouTube videos into your personal board"` — `text-zinc-500 text-sm text-center max-w-xs`
- CTA: existing `<Button>` with violet styles (picks up palette change automatically)

### `CardControls`

- Drag handle strip: `bg-violet-950/60` (replaces `zinc-700/80`) in edit mode
- Grip icon `⠿`: `text-violet-400` (replaces `text-zinc-400`)
- Delete `×` button: base `text-zinc-500`, `hover:text-red-400 hover:bg-zinc-700/60` — slightly more muted at rest, clearer on hover
- Delete animation: before dispatching, set local `deleting` state → applies `opacity-0 transition-opacity duration-150` to the card wrapper, dispatch fires after 150ms timeout

### `MediaCard`

- Border: `border-zinc-700/60` (replaces `border-zinc-700`) + `hover:border-violet-500/30 transition-colors duration-200`
- No other changes — cards stay clean in view mode

### `Modal`

- Backdrop: adds `backdrop-blur-sm`
- Panel: adds `border border-zinc-700/50`
- Mount animation: `opacity-0 scale-95` → `opacity-100 scale-100` on the panel, 150ms ease-out, same mount-delay pattern as `EditModeBanner`
- Focus return on close: `Modal` captures `document.activeElement` as `triggerRef` on open, restores focus in the cleanup of the `useEffect`

### `YouTubeEmbed`

- Use the `aspectRatio` prop for a descriptive iframe `title`: `"YouTube video — 16:9"` or `"YouTube Shorts — 9:16"`

---

## 3. Transitions

All implemented with Tailwind utilities + a mount-delay `useEffect`. No animation libraries.

| Element | Transition | Duration |
|---|---|---|
| `AddCardModal` backdrop | `opacity-0` → `opacity-100` | 150ms |
| `AddCardModal` panel | `scale-95 opacity-0` → `scale-100 opacity-100` | 150ms |
| `EditModeBanner` | `max-h-0 opacity-0` → `max-h-10 opacity-100` | 200ms |
| Card delete | `opacity-100` → `opacity-0` before dispatch | 150ms |
| Card border hover | `transition-colors` | 200ms |

**Mount-delay pattern** (used for modal and banner):
```tsx
const [visible, setVisible] = useState(false);
useEffect(() => {
  const id = requestAnimationFrame(() => setVisible(true));
  return () => cancelAnimationFrame(id);
}, []);
// Apply: className={`transition-opacity duration-150 ${visible ? 'opacity-100' : 'opacity-0'}`}
```

---

## 4. Bug Fixes

| Bug | File | Fix |
|-----|------|-----|
| `preventCollision={false}` | `GridCanvas.tsx:60` | Change to `preventCollision={true}` |
| Modal doesn't restore focus on close | `Modal.tsx` | Capture `document.activeElement` before first focusable focus; restore in `useEffect` cleanup |
| `aspectRatio` unused in `YouTubeEmbed` | `YouTubeEmbed.tsx` | Use as descriptive `title` on `<iframe>` |

---

## 5. File Changelist

| File | Change type |
|------|-------------|
| `src/components/board/BoardHeader.tsx` | Edit — title, glow, Done button style |
| `src/components/board/EditModeBanner.tsx` | **New** — edit mode indicator component |
| `src/components/board/EmptyBoardState.tsx` | Edit — full redesign |
| `src/components/board/GridCanvas.tsx` | Edit — `preventCollision` bug fix |
| `src/components/cards/CardControls.tsx` | Edit — handle color, delete transition |
| `src/components/cards/MediaCard.tsx` | Edit — border style + hover |
| `src/components/cards/embeds/YouTubeEmbed.tsx` | Edit — use `aspectRatio` for `title` |
| `src/components/ui/Button.tsx` | Edit — `indigo` → `violet` |
| `src/components/ui/Input.tsx` | Edit — `indigo` → `violet` |
| `src/components/ui/Modal.tsx` | Edit — backdrop blur, panel border, mount animation, focus return |
| `src/pages/CanvasBoardPage.tsx` | Edit — add `<EditModeBanner />` |

---

## Out of Scope

- Mobile layout
- Card titles
- Multiple boards
- Skeleton loading states
- Keyboard shortcuts for drag
