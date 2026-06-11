# CanvasBoard — Original Concept Document

## Concept

CanvasBoard is a visual media board that allows users to curate embedded content on a personalized canvas.

Think of it as a hybrid between Linktree, Pinterest, and a mood board.

Users can add media cards to a canvas and arrange them into a custom layout.

The focus is on visual curation, flexible layout, and a clean user experience.

---

## MVP Goals

Build a local-first MVP that runs entirely on my machine.

Requirements:

* No backend
* No authentication
* No database
* No cloud services
* No API server
* Persist data using localStorage

The goal is to create a portfolio-quality project that demonstrates strong frontend engineering practices while remaining simple and maintainable.

---

## Technology Preferences

* React
* TypeScript (strict mode)
* Vite
* Tailwind CSS
* Redux Toolkit (modern Redux)
* React Grid Layout
* ESLint
* Prettier

---

## Core MVP Feature

Users can paste a YouTube URL and create an embedded video card.

Each card should:

* Display an embedded YouTube video
* Be draggable
* Be resizable
* Snap to a structured grid layout
* Persist position and size after page refresh

---

## Layout Requirements

Use React Grid Layout.

The system should feel:

* Structured
* Balanced
* Intuitive
* Modern

Users should be able to:

* Drag cards
* Resize cards
* Rearrange layouts freely within the grid system

The system should support both portrait and landscape content in the future.

Avoid arbitrary pixel-based placement.

Favor grid-based placement with snapping behavior.

---

## State Management Requirements

Use Redux Toolkit (modern Redux patterns).

* Use slices (not legacy Redux patterns)
* Avoid boilerplate-heavy architecture
* Keep state normalized and scalable
* Ensure state design supports future expansion to multiple content types

State should support:

* Canvas layout state
* Content items (videos now, more types later)
* Persistence layer integration (localStorage initially)

---

## Future Expansion (Not Part of MVP)

Design the architecture so it can eventually support:

* Instagram embeds
* TikTok embeds
* Images
* Text blocks
* External links
* Multiple board types
* Shareable boards
* User accounts
* Cloud persistence

These features should NOT be implemented now.

Only ensure the architecture will not require major refactoring later.

---

## Future Deployment Considerations

The MVP is local-only.

However, the architecture should support future deployment to Cloudflare Pages.

The architecture should also support replacing localStorage with a cloud-backed persistence layer in the future without requiring major changes to the UI layer.

---

## Engineering Principles

Prioritize:

* Modern React best practices
* Clean architecture
* Maintainability
* Scalability
* Accessibility
* Strong TypeScript typing
* Separation of concerns
* Reusable components

Avoid:

* Premature optimization
* Unnecessary abstractions
* Over-engineering

Redux should be used in a modern, minimal, Redux Toolkit–first way.

---

## Workflow Requirements

Review and approve each major step before moving forward.

Do NOT generate the entire application immediately.

Work incrementally.

At the end of each phase:

1. Present recommendations.
2. Explain tradeoffs.
3. Wait for approval.

Do not proceed to the next phase until explicitly approved.

---

## Phase 1 Deliverables (Completed)

1. Analyze the product idea
2. Identify risks, assumptions, and missing requirements
3. Suggest improvements to the MVP scope
4. Propose the overall architecture
5. Propose the folder structure
6. Define the domain model
7. Define the TypeScript types
8. Define the Redux Toolkit store design
9. Define the localStorage persistence strategy
10. Explain how React Grid Layout should be configured
11. Explain how future content providers can be added cleanly
12. Produce a phased implementation roadmap
