# CanvasBoard

**[canvasboard.jpredmon.com](https://canvasboard.jpredmon.com)**

A visual media board where users curate embedded YouTube content on a free-placement, grid-snapped canvas. Sign in with Google — your boards are saved to the cloud and accessible from any device. Built with React 18, TypeScript, Redux Toolkit, and React Grid Layout.

![CanvasBoard](screenshot.png)

## Features

- **Google Sign-In** — Boards are tied to your account and synced across devices
- **Multiple boards** — Create and switch between named boards
- **Add YouTube videos** — Paste any YouTube or YouTube Shorts URL
- **Free-placement canvas** — Drag cards anywhere, snap to grid
- **Edit/View modes** — Lock the board for clean presentation
- **Cloud persistence** — Auto-saves to Cloudflare D1 (SQLite) via a Cloudflare Worker API
- **Responsive grid** — 12-column layout, configurable card sizes
- **Dark theme** — Minimal UI, media-focused design
- **Accessibility** — WCAG 2.1 AA: keyboard navigation, skip link, reduced-motion, semantic headings, synced document title

## Project Status

Live at [canvasboard.jpredmon.com](https://canvasboard.jpredmon.com). Deployed via Cloudflare Pages with CI/CD on push to `master`.

All planned phases complete: security, accessibility (WCAG 2.1 AA), code quality, testing (104 RTL unit tests + 5 Playwright E2E tests), code style standards, Firebase Auth (Google Sign-In), and Cloudflare D1 cloud persistence.

## Development Process

This project uses a structured AI-assisted workflow: each feature goes through a brainstorm → design spec → implementation plan → subagent execution → spec compliance review → code quality review cycle, with TDD throughout. Every task is implemented by a fresh subagent working from a complete spec, then reviewed by two independent review passes before merging. The result is a codebase where every change is tested, every decision is documented, and the review loop catches issues before they ship.

## Tech Stack

- **React 18** — UI framework
- **TypeScript (strict)** — Type safety
- **Vite** — Build tool
- **Tailwind CSS** — Styling
- **Redux Toolkit** — State management
- **React Grid Layout** — Free-placement canvas grid
- **Firebase Auth** — Google Sign-In
- **Cloudflare Workers** — API layer with Firebase JWT verification
- **Cloudflare D1** — SQLite cloud database (board + card persistence)
- **Vitest + React Testing Library** — Unit/component testing
- **Playwright** — End-to-end browser testing (Chromium)
- **ESLint + Prettier** — Code quality

## Architecture

```
Root (Firebase auth gate)
├── SplashScreen (while auth resolves)
├── LoginPage (Google Sign-In)
└── App (authenticated)
    ├── CanvasBoardPage
    ├── BoardHeader (title + add card + edit toggle + sign out)
    ├── BoardDropdown (multi-board switcher)
    ├── AddCardModal (URL input with validation)
    ├── GridCanvas (React Grid Layout + MediaCard list)
    └── DataSyncBanner (cloud save error notification)

Redux Store
├── boards — named board entities
├── cards — normalized entity map
├── layout — card positions & sizes
└── ui — modal state, edit mode, save error flag

Repository Pattern
├── BoardRepository (interface — async)
├── LocalStorageRepository (localStorage, used in tests)
└── HttpRepository (Cloudflare Worker API, used in production)

Cloudflare Worker API
├── GET/PUT /api/boards — board list per user
├── GET/PUT /api/boards/:id/state — cards + layout per board
└── DELETE /api/boards/:id — board data cleanup
```

## Quick Start

```bash
npm install
npm run dev
```

Visit `http://localhost:5173`. Auth is required — sign in with Google. The dev server uses `VITE_API_URL=http://localhost:8787` (see `.env.example`); run `wrangler dev` inside `worker/` to start the local Worker.

## Environment Variables

Copy `.env.example` to `.env` and fill in values from your Firebase project:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
VITE_API_URL=http://localhost:8787
```

## Development Commands

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm test             # Run unit/component tests (Vitest)
npm run test:e2e     # Run E2E tests (Playwright, auto-starts dev server)
npm run lint         # Check code style
npm run format       # Format code (Prettier)
```

## Testing

**Unit/component tests** — 104 tests across 19 files, co-located with source as `*.test.ts` / `*.test.tsx`. Vitest + React Testing Library with jsdom.

```bash
npm test                                    # Run all unit/component tests
npx vitest run src/components/board/        # Run tests in a folder
npx vitest watch                            # Watch mode
```

**E2E tests** — 5 Playwright tests in `e2e/`. Chromium only. The `webServer` config auto-starts the dev server; `reuseExistingServer: true` so a running dev server is reused.

```bash
npm run test:e2e                            # Run all E2E tests
npx playwright test e2e/golden-path.spec.ts # Run a single spec
npx playwright show-report                  # Open last test report
```

## Browser Support

- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest)

Mobile layout not yet supported.

## Future Additions

- Additional media types (TikTok, images, text blocks)
- Board sharing via URL/QR code
- Keyboard shortcuts for power users
- Mobile-responsive layout

## License

MIT
