# CanvasBoard

A local-first visual media board where users curate embedded YouTube content on a free-placement, grid-snapped canvas. Built with React 18, TypeScript, Redux Toolkit, and React Grid Layout.

## Quick Start

```bash
npm install
npm run dev
```

Visit `http://localhost:5173` in your browser.

## Tech Stack

- **React 18** — UI framework
- **TypeScript (strict)** — Type safety
- **Vite** — Build tool
- **Tailwind CSS** — Styling
- **Redux Toolkit** — State management
- **React Grid Layout** — Free-placement canvas grid
- **Vitest + React Testing Library** — Testing
- **ESLint + Prettier** — Code quality

## Features

- **Create boards** — Add a new board with a custom name
- **Add YouTube videos** — Paste any YouTube or YouTube Shorts URL
- **Free-placement canvas** — Drag cards anywhere, snap to grid
- **Edit/View modes** — Lock the board for clean presentation
- **Persistent storage** — Auto-saves to browser localStorage
- **Responsive grid** — 12-column layout, configurable card sizes
- **Dark theme** — Minimal UI, media-focused design
- **Accessibility baseline** — WCAG aria-labels on interactive elements

## Architecture

```
App
├── CanvasBoardPage (top-level page)
├── BoardHeader (title + add card button + edit toggle)
├── AddCardModal (URL input with validation)
└── GridCanvas (React Grid Layout + MediaCard list)

Redux Store
├── cards — normalized entity map
├── layout — card positions & sizes
└── ui — modal state, edit mode flag

Repository Pattern
├── BoardRepository (interface)
└── LocalStorageRepository (localStorage impl)
```

See [docs/superpowers/plans/2026-06-10-canvasboard-phase1.md](docs/superpowers/plans/2026-06-10-canvasboard-phase1.md) for the complete architecture document.

## Development

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm test             # Run tests
npm run lint         # Check code style
npm run format       # Format code (Prettier)
```

## Testing

Tests are co-located with source files as `*.test.ts` / `*.test.tsx`. Vitest uses jsdom for DOM testing.

```bash
npm test                                    # Run all tests
npx vitest run src/components/board/        # Run tests in a folder
npx vitest watch                            # Watch mode
```

## Project Status

**Phase:** MVP — Core functionality complete. Work in progress on accessibility baseline.

**Recent commits:**
- 39a2b6c fix(a11y): add aria-label to NoBoardsState board name input
- dcb847c feat: add setEditMode reducer to uiSlice
- 93c0576 fix: prevent white flash before React mounts

See full task list in GitHub Issues.

## Browser Support

- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest)

Mobile layout not yet supported.

## Future Additions

- Multiple boards with switching
- Additional media types (Instagram, TikTok, images)
- Board sharing via URL/QR code
- Keyboard shortcuts for power users
- Mobile-responsive layout
- Cloud persistence (Cloudflare D1 / Supabase)

## Contributing

This is a portfolio project. Architecture decisions and accessibility baseline are core values.

## License

MIT
