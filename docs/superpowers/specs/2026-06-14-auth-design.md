# Auth + Cloud Persistence — Design Spec

**Date:** 2026-06-14
**Scope:** Firebase Auth + Cloudflare Workers API + Cloudflare D1 (SQLite) + async repository refactor
**Approach:** One spec, two ordered implementation phases — (1) infra + auth, (2) cloud persistence

---

## Context

CanvasBoard is currently a pure client-side SPA with no backend and no auth. Boards are stored in
`localStorage` scoped by board ID. This spec adds user accounts and cloud persistence, replacing
`localStorage` with a Cloudflare Workers API backed by a D1 (SQLite) database. Firebase handles
identity only — no Firestore, no other Firebase services.

Existing localStorage data is not migrated. Users start with empty boards on first login.

---

## Architecture

```
Browser (React SPA)
  ├── Firebase Auth SDK      ← identity; manages token refresh automatically
  ├── auth Redux slice       ← uid, email, status (loading/authenticated/unauthenticated)
  ├── HttpRepository         ← replaces LocalStorageRepository; calls Workers API with Bearer token
  └── Redux store + middleware (persistence middleware becomes fire-and-forget async)

Cloudflare Workers API  (worker/ at repo root)
  ├── verifies Firebase ID token on every request (JWT via Web Crypto API)
  └── reads/writes Cloudflare D1

Cloudflare D1 (SQLite)
  └── user_boards + board_state tables (JSON blob storage)

Firebase (external)
  └── Auth only — Email/Password provider; Google OAuth deferred
```

App render tree by auth status:

| `auth.status`      | Renders          |
|--------------------|------------------|
| `'loading'`        | Splash screen    |
| `'unauthenticated'`| `LoginPage`      |
| `'authenticated'`  | `CanvasBoardPage`|

The full Redux store (boards, cards, layout) is not created until auth resolves and initial data
loads. The splash screen covers this window.

---

## Phase 1: Infrastructure + Auth

### 1.1 Firebase Setup (manual, one-time)

1. Create project at console.firebase.google.com
2. Enable Authentication → Email/Password provider
3. Register a web app, copy config object
4. Store config in `.env`:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
```

### 1.2 Firebase SDK

Install `firebase` (web SDK v9, modular). Create `src/firebase/firebase.ts` — initializes the app
and exports `auth`. Create `src/firebase/authListener.ts` — calls `onAuthStateChanged` once at
startup, dispatches to the `auth` slice.

### 1.3 Auth Redux Slice

New slice at `src/store/auth/authSlice.ts`:

```ts
interface AuthState {
  uid: string | null;
  email: string | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
}
```

Initial state: `{ uid: null, email: null, status: 'loading' }`.

Actions: `setUser({ uid, email })` → sets status to `'authenticated'`; `clearUser()` → sets status
to `'unauthenticated'`.

Selectors: `selectAuthStatus`, `selectUid`, `selectEmail`.

### 1.4 Auth Store

A minimal "auth-only" store is created at module load in `main.tsx` — contains only the `auth`
slice. The full store (boards, cards, layout) is created after auth resolves. This avoids the
`HttpRepository` needing to exist before a `uid` is available.

### 1.5 LoginPage

`src/pages/LoginPage.tsx`:

- Email + password fields
- Toggle between "Sign in" and "Create account" modes
- Calls `signInWithEmailAndPassword` or `createUserWithEmailAndPassword`
- Maps Firebase error codes to human-readable strings displayed inline
- No routing library — auth state drives which page renders

### 1.6 Sign Out

Sign-out button in `BoardHeader` (or a minimal user menu next to it). Calls `signOut(auth)`. The
`onAuthStateChanged` listener dispatches `clearUser()`, which tears down the full store and renders
`LoginPage`.

### 1.7 main.tsx Refactor

```
1. Create auth-only store
2. Start onAuthStateChanged listener
3. Render <SplashScreen /> (status: 'loading')
4. On auth resolution:
   - unauthenticated → render <LoginPage />
   - authenticated   → await repository.loadState()
                     → create full store with preloaded state
                     → render <CanvasBoardPage />
```

---

## Phase 2: Cloud Persistence

### 2.1 Cloudflare Infrastructure Setup (manual, one-time)

```bash
npm install -g wrangler
wrangler login
wrangler d1 create canvasboard-db
```

Add `wrangler.toml` at repo root (or `worker/wrangler.toml`):

```toml
name = "canvasboard-api"
main = "worker/src/index.ts"
compatibility_date = "2024-01-01"

[vars]
FIREBASE_PROJECT_ID = "your-project-id"

[[d1_databases]]
binding = "DB"
database_name = "canvasboard-db"
database_id = "<id from create command>"
```

### 2.2 D1 Schema

```sql
CREATE TABLE user_boards (
  user_id   TEXT PRIMARY KEY,
  boards_json TEXT NOT NULL
);

CREATE TABLE board_state (
  user_id     TEXT NOT NULL,
  board_id    TEXT NOT NULL,
  cards_json  TEXT NOT NULL,
  layout_json TEXT NOT NULL,
  PRIMARY KEY (user_id, board_id)
);
```

JSON blobs mirror existing Redux state shapes exactly — no mapping layer needed.

Applied via `wrangler d1 execute canvasboard-db --file=worker/schema.sql`.

### 2.3 Cloudflare Workers API

`worker/src/index.ts` — handles the following routes:

| Method   | Path                          | Action                          |
|----------|-------------------------------|---------------------------------|
| `GET`    | `/api/boards`                 | Load boards list for user       |
| `PUT`    | `/api/boards`                 | Save boards list                |
| `GET`    | `/api/boards/:boardId/state`  | Load cards + layout for board   |
| `PUT`    | `/api/boards/:boardId/state`  | Save cards + layout             |
| `DELETE` | `/api/boards/:boardId`        | Delete board and its state      |

Every request requires `Authorization: Bearer <firebase-id-token>`. The Worker verifies the JWT
using Firebase's public keys via the Web Crypto API (`worker/src/verifyFirebaseToken.ts`). Returns
`401` on verification failure.

CORS headers added for `https://canvasboard.jpredmon.com` and `http://localhost:5173`.

Local dev: `wrangler dev` runs the Worker at `http://localhost:8787` against a local D1 instance.
SPA `.env.development` sets `VITE_API_URL=http://localhost:8787`.

### 2.4 BoardRepository Interface (async)

`src/repositories/BoardRepository.ts` — all methods become async:

```ts
export interface BoardRepository {
  saveCards(boardId: string, state: CardsState): Promise<void>;
  loadCards(boardId: string): Promise<CardsState | null>;
  saveLayout(boardId: string, state: LayoutState): Promise<void>;
  loadLayout(boardId: string): Promise<LayoutState | null>;
  saveBoards(state: BoardsState): Promise<void>;
  loadBoards(): Promise<BoardsState | null>;
  deleteBoardData(boardId: string): Promise<void>;
  loadState(): Promise<{ cards?: CardsState; layout?: LayoutState; boards?: BoardsState }>;
}
```

`loadStateSync()` is removed.

### 2.5 LocalStorageRepository

All methods wrap returns in `Promise.resolve()`. No logic changes. Existing tests remain
unchanged (the return types become `Promise<T>` but `await` in tests keeps assertions identical).

### 2.6 HttpRepository

`src/repositories/HttpRepository.ts` — new class implementing `BoardRepository`. Takes a Firebase
`User` object. Calls `user.getIdToken()` before each request (Firebase caches and auto-refreshes
the token). Uses `import.meta.env.VITE_API_URL` as base URL.

### 2.7 Persistence Middleware

Save operations remain fire-and-forget — the middleware calls async repository methods without
`await`. Failed saves dispatch `uiActions.setSaveError(true)` from a `.catch()` handler. The UI
surfaces this as a non-blocking banner.

### 2.8 Async Thunks

`switchBoard` and `deleteBoard` become `async` thunks (`AppThunk<Promise<void>>`). Their calls to
`repository.loadCards()` and `repository.loadLayout()` are awaited. Component callers do not need
to change — they dispatch without awaiting.

---

## Error Handling

| Category       | Behavior                                                                 |
|----------------|--------------------------------------------------------------------------|
| Auth errors    | Firebase error codes mapped to inline strings in `LoginPage`            |
| Save failures  | Non-blocking banner via `uiActions.setSaveError`; fire-and-forget saves |
| Load failures  | `uiActions.setLoadError` dispatched; error state rendered in board area |
| Token expiry   | Transparent — `user.getIdToken()` auto-refreshes; no special handling   |

---

## Testing

| Area                  | Approach                                                              |
|-----------------------|-----------------------------------------------------------------------|
| `authSlice`           | Unit tests for all state transitions                                  |
| `LoginPage`           | RTL tests — form rendering, submit, error display; mock Firebase auth |
| `HttpRepository`      | Unit tests — mock `fetch` and `getIdToken`; assert URLs, headers, bodies |
| `LocalStorageRepository` | Existing tests unchanged                                           |
| Worker                | Manual via `wrangler dev` during implementation                       |
| E2E auth              | Deferred — requires Firebase test project + service account           |

---

## New Files

| Path                                  | Purpose                                      |
|---------------------------------------|----------------------------------------------|
| `src/firebase/firebase.ts`            | Firebase app + auth init                     |
| `src/firebase/authListener.ts`        | `onAuthStateChanged` → dispatches to store   |
| `src/store/auth/authSlice.ts`         | Auth state slice                             |
| `src/store/auth/authSelectors.ts`     | Auth selectors                               |
| `src/pages/LoginPage.tsx`             | Login / create account form                  |
| `src/repositories/HttpRepository.ts`  | Cloud-backed repository implementation       |
| `worker/src/index.ts`                 | Cloudflare Worker entry point                |
| `worker/src/verifyFirebaseToken.ts`   | Lightweight JWT verifier (Web Crypto API)    |
| `worker/schema.sql`                   | D1 schema                                    |
| `worker/wrangler.toml`                | Worker + D1 config                           |
| `src/components/SplashScreen.tsx`     | Loading screen shown while auth resolves     |
| `.env.example`                        | Documents required env vars                  |

## Modified Files

| Path                                       | Change                                        |
|--------------------------------------------|-----------------------------------------------|
| `src/repositories/BoardRepository.ts`      | All methods → async; remove `loadStateSync`   |
| `src/repositories/LocalStorageRepository.ts` | Wrap returns in `Promise.resolve()`         |
| `src/store/index.ts`                       | Add `auth` slice to `RootState`               |
| `src/store/middleware/persistenceMiddleware.ts` | Fire-and-forget async saves; `.catch()` dispatch |
| `src/store/boards/boardsThunks.ts`         | `switchBoard`, `deleteBoard` → async thunks   |
| `src/components/BoardHeader.tsx`           | Add sign-out button                           |
| `src/main.tsx`                             | Auth-first init; deferred full store creation |
| `public/_headers`                          | Add `https://*.googleapis.com https://*.workers.dev` to CSP `connect-src` |

---

## Implementation Phases

### Phase 1: Infra + Auth
1. Firebase project setup + SDK install
2. `src/firebase/firebase.ts` + `src/firebase/authListener.ts`
3. `authSlice` + selectors + tests
4. `LoginPage` + tests
5. `main.tsx` refactor (auth-only store, deferred full store)
6. Sign-out button in `BoardHeader`

### Phase 2: Cloud Persistence
1. `wrangler` setup + D1 create + schema apply
2. Worker entry point + JWT verifier + D1 queries
3. `BoardRepository` interface → async
4. `LocalStorageRepository` → `Promise.resolve()` wraps
5. `HttpRepository` + tests
6. Persistence middleware → async fire-and-forget
7. `switchBoard` + `deleteBoard` → async thunks
8. `main.tsx` — swap `LocalStorageRepository` for `HttpRepository` on auth
9. CSP `connect-src` update in `public/_headers`
