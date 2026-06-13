# CanvasBoard Project Explanation Draft

---

## What It Is

CanvasBoard is a personal video curation tool — a drag-and-drop canvas where you paste YouTube URLs and arrange them as cards. Cards persist between sessions, can be resized and reorganized, and are grouped into named boards. The intent is a clean, opinionated space for keeping video content you care about, not a general-purpose tool.

---

## How It Started

The project began as a deliberate practice run with a structured AI-assisted workflow (the "superpowers" system): brainstorm → design spec → implementation plan → subagent-driven execution. The goal was to practice building a real, shippable product through that workflow rather than just experimenting.

The concept was simple on the surface — a video canvas — but had enough moving parts (real-time drag/resize, URL parsing, persistence, state management) to be worth doing properly.

---

## Phase 1: The MVP

**Stack chosen:** React 18, TypeScript strict mode, Redux Toolkit, Vite, Tailwind CSS, Vitest, react-grid-layout.

The core architecture was designed upfront:

- **Repository pattern** — a `BoardRepository` interface abstracts all persistence. The concrete implementation (`LocalStorageRepository`) reads and writes to localStorage, but the interface means it can be swapped for a cloud implementation later without touching the rest of the app.
- **Redux Toolkit** — normalized `cards` slice (entity adapter), `layout` slice, `ui` slice for modal and edit mode state. Clean separation: Redux owns in-memory state, the repository owns persistence.
- **Persistence middleware** — a Redux middleware that fires after every action and syncs state to localStorage. Simple and reliable.

**Features shipped in Phase 1:**

- YouTube URL parsing (handles youtube.com and youtu.be variants, extracts video ID, detects portrait vs. landscape aspect ratio)
- Embedded YouTube player cards with responsive aspect ratio
- Drag-and-drop grid layout (react-grid-layout)
- Edit mode with resize handles and per-card delete buttons
- Empty state screen with cinematic dark aesthetic
- Add Card modal with URL validation and error feedback
- Full persistence — cards and layout survive hard refresh

**Tests written:** 27, covering the YouTube parser, layout utilities, the Redux slices (addCard, removeCard), and the repository (save/load round-trips, null on empty, null on corrupt JSON).

**One post-ship bug:** react-grid-layout left a stuck drag placeholder on rapid mouse-up. Fixed with a window-level mouseup recovery handler and a grid remount key — a race condition between React 18's deferred rendering and the drag library's internal state.

---

## The Instagram Detour

The first expansion attempt was Instagram embed support — add Instagram video URLs alongside YouTube. The plan was written, the implementation dispatched. It worked to a point: the card rendered, the iframe loaded. But Instagram shows a "Watch on Instagram" overlay and blocks video playback in third-party iframes. This is a deliberate platform policy, not a technical limitation. Tried both plain iframe and the official JS embed SDK — same result.

**Decision: revert entirely.** Instagram support was removed with `git reset --hard`. The codebase returned to the clean YouTube-only state. No migration, no dead code left behind.

---

## The Decision to Build Multi-Board

After the Instagram revert, the question was: what's the most valuable next feature? Two options discussed: image card support (simpler, mostly additive) versus multi-board with naming (more complex, more useful). The choice was multi-board — it's the feature that changes how you actually _use_ the product, not just what you can put in it.

---

## Phase 2: Multi-Board with Naming

**Design decisions made through brainstorming:**

1. **Load/unload pattern** — the `cards` and `layout` Redux slices always represent the _active_ board only. Switching boards means saving the current board's data to localStorage, then loading the target board. No complex multi-board normalization in Redux. Simple, clean, matches the existing slice design perfectly.

2. **Board selector in the header** — a dropdown centered between the logo and the action buttons. Click the board name to open, see all boards, switch/rename/delete, add new.

3. **Start with no boards** — first launch shows a "Create your first board" welcome screen. No default board, no implicit state. Users explicitly name their first board before adding anything.

4. **Delete is immediate** — no confirmation dialog. Deleting the active board auto-switches to the next board; deleting the last board returns to the welcome screen.

5. **No migration from old storage keys** — the old flat `canvasboard:cards` / `canvasboard:layout` keys are simply abandoned. First launch with the new code starts fresh. Clean break.

**Architecture changes:**

- New `Board` and `BoardsState` types
- Board-scoped localStorage keys: `canvasboard:board:{id}:cards` / `canvasboard:board:{id}:layout` / `canvasboard:boards`
- `BoardRepository` interface updated with board-scoped method signatures plus `saveBoards`, `loadBoards`, `deleteBoardData`
- `boardsSlice` — normalized board metadata with add/remove/rename/setActiveBoardId actions
- `setCards` and `setLayout` actions added to existing slices for full-state replacement on board switch
- Redux Thunk `extraArgument` pattern — repository passed to every thunk as the third argument, enabling thunks to call `repository.loadCards(boardId)` directly
- Persistence middleware updated to route by action type: boards actions save the manifest, card/layout actions save to the active board's scoped key

**New components:**

- `NoBoardsState` — first-launch welcome screen matching the dark violet aesthetic
- `BoardSelector` — trigger button in the header with click-outside-to-close
- `BoardDropdown` — full board management UI (switch, rename inline, delete, create new)

**Tests added:** 12 new repository tests (round-trips, null on empty, corrupt JSON, delete, loadStateSync variants), 6 boardsSlice tests, 1 setCards test, 1 setLayout test. Total: 39 tests.

---

## Bugs Found and Fixed During Development

The subagent-driven development process (fresh agent per task, spec review + code quality review after each) caught several real issues before they shipped:

**Rename blur race condition** — the inline rename input had both `onKeyDown` (Enter → commit, Escape → cancel) and `onBlur → commit`. When Escape was pressed, React batched the state update, the input was removed from the DOM, blur fired, and `commitRename` ran with a stale closure — the cancelled rename was committed anyway. Enter also double-dispatched (once directly, once via blur). Fixed with a `renameCancelledRef` ref flag; Enter now calls `e.currentTarget.blur()` so `onBlur` is the single commit point.

**Wrong ARIA roles** — the dropdown used `role="listbox"` and `role="option"`, which promises arrow-key navigation that the component doesn't implement. Corrected to `role="menu"` / `role="menuitem"`.

**Board data overwrite on switch** — the critical bug, caught in smoke testing. When `setCards` and `setLayout` were dispatched inside `switchBoard`, the persistence middleware fired while `activeBoardId` still pointed to the _old_ board — so the new board's data was written to the old board's localStorage keys, erasing history. Fix: dispatch `setActiveBoardId` _before_ `setCards`/`setLayout` in all three thunks. Now the middleware always writes to the correct board.

**`selectAllBoards` memoization** — `.map()` returns a new array reference every render. Redux's `useSelector` uses referential equality, so it triggered a rerender on every dispatch. Fixed with `createSelector` from Redux Toolkit.

**Dropdown clipping** — `overflow-hidden` on the header element clipped the absolutely-positioned dropdown. Removed — the radial gradient decoration fades to transparent and doesn't need clipping.

---

## Current State

CanvasBoard is a working, tested, single-page app with:

- YouTube video cards on a drag-and-drop canvas
- Multiple named boards, switchable via header dropdown
- Inline board rename and delete
- Full persistence across hard refresh via localStorage
- 39 passing tests, TypeScript strict, clean production build

The `feat/multi-board` branch is pushed to GitHub with a PR open against `master`.

**What's clearly next:** Cloudflare Pages deployment. The app is a pure client-side SPA — no server code, no build complexity beyond Vite. Deployment is a `_redirects` file and a `wrangler.toml`.
