# Security Audit — Design Spec
**Date:** 2026-06-12  
**Scope:** Full application security hardening (Approach B: application + infrastructure)  
**Outcome:** Fix all identified vulnerabilities and add defensive headers; no findings document — fix directly.

---

## Context

CanvasBoard is a client-side React SPA with no backend, no auth, and no network requests of its own. The attack surface is small: one URL input field, localStorage read/write, and a YouTube iframe renderer. The audit identified four areas requiring fixes.

---

## Changes

### 1. YouTube Hostname Validation (`src/utils/youtube.ts`)

**Problem:** The current check `parsed.hostname.includes('youtube.com')` is a substring match. A URL like `https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ` passes because `"youtube.com.evil.com"` contains the substring `"youtube.com"`. The downstream video ID validation (`[a-zA-Z0-9_-]{11}`) limits actual exploit impact in the current code, but the hostname gate is weaker than it appears and is fragile against future changes.

**Fix:** Replace `.includes()` with strict equality. Accept only `youtube.com` and `www.youtube.com` on the standard watch-URL path. The `youtu.be` and Shorts paths are already on separate branches and are unaffected.

```ts
// Before
parsed.hostname.includes('youtube.com')

// After
parsed.hostname === 'youtube.com' || parsed.hostname === 'www.youtube.com'
```

**Tests:** Add one test case for `https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ` — expect it to throw. Existing passing tests remain unchanged.

---

### 2. iframe Hardening (`src/components/cards/embeds/YouTubeEmbed.tsx`)

**Problem:** The YouTube `<iframe>` has no `sandbox` attribute, so the embedded page inherits the full browsing context. It also sends the full document URL as a referrer on cross-origin requests, leaking the user's board URL to YouTube.

**Fix:** Add two attributes:

```tsx
sandbox="allow-scripts allow-same-origin allow-presentation"
referrerpolicy="strict-origin-when-cross-origin"
```

- `allow-scripts` — required for YouTube to function.
- `allow-same-origin` — required for YouTube auth state and playback features.
- `allow-presentation` — enables the fullscreen API.
- Omitted intentionally: `allow-popups`, `allow-top-navigation` — YouTube cannot navigate the parent page.
- `referrerpolicy` — sends only the origin (`https://canvasboard.jpredmon.com`), not the full URL, to YouTube on each request.

**No tests needed** — attribute presence is a structural change; existing iframe render tests cover the component.

---

### 3. Security Headers (`public/_headers`)

**Problem:** The app ships no HTTP security headers. There is no Content Security Policy, no clickjacking protection, and no control over browser features like camera or geolocation.

**Fix:** Create `public/_headers`. Cloudflare Pages copies `public/` into the build output and serves `_headers` as response header rules.

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; frame-src https://www.youtube.com; img-src 'self' data:; connect-src 'self'
```

- `X-Frame-Options: DENY` — prevents the app from being embedded in a third-party iframe (clickjacking).
- `X-Content-Type-Options: nosniff` — prevents MIME-type sniffing on responses.
- `Referrer-Policy` — matches the iframe policy above; consistent cross-site referrer behaviour.
- `Permissions-Policy` — explicitly disables camera, microphone, and geolocation access.
- `Content-Security-Policy`:
  - `script-src 'self'` — only the bundled JS; no inline scripts, no CDN scripts.
  - `style-src 'self' 'unsafe-inline'` — `'unsafe-inline'` is required because React inline styles (`style={{ ... }}`) emit `style=""` attributes on DOM nodes. Nonce-based removal is out of scope for this audit.
  - `frame-src https://www.youtube.com` — only YouTube iframes permitted.
  - `img-src 'self' data:` — local images and data URIs; no remote image loading in the current app.
  - `connect-src 'self'` — no XHR/fetch to external origins.

**Verification:** After deploy, confirm headers appear in browser DevTools Network tab on a production request.

---

### 4. Dependency Audit (`npm audit`)

**Problem:** Known CVEs may exist in installed dependencies.

**Fix:** Run `npm audit`. Apply `npm audit fix` for all automatically-fixable vulnerabilities. For any vulnerability requiring a major version bump (breaking change), surface it explicitly before applying.

**Scope:** Fix all critical and high severity findings. Accept low/info findings without action if the fix requires a breaking change.

---

## Architecture Notes

- No new files except `public/_headers`.
- No new dependencies.
- All changes are in existing files or a single new config file.
- The `public/` directory is copied verbatim into Vite's build output — `_headers` does not need to be registered in `vite.config.ts`.

---

## Testing

- `youtube.ts`: add one negative test for evil-subdomain URL.
- Everything else: `npx tsc -b && npx vitest run` — expect 51/51 after the new test is added.
- Post-deploy: manual header verification in DevTools.

---

## Commit Plan

1. `fix(security): enforce strict hostname equality in YouTube URL parser`
2. `fix(security): add sandbox and referrerpolicy to YouTube iframe`
3. `fix(security): add Cloudflare Pages security headers`
4. `fix(security): apply npm audit fixes` (only if audit finds actionable items)
