# Security Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all identified security vulnerabilities and add defensive infrastructure headers.

**Architecture:** Four independent tasks: (1) strict hostname validation in the YouTube URL parser — including the Shorts path which the spec marked "unaffected" but which has the same gap; (2) iframe sandbox and referrer hardening; (3) Cloudflare Pages security headers via `public/_headers`; (4) npm dependency audit. No new dependencies; all changes are in existing files or a new config file.

**Tech Stack:** TypeScript, React 18, Vite, Tailwind CSS, Vitest

---

### Task 1: Fix YouTube hostname validation

**Files:**
- Modify: `src/utils/youtube.ts`
- Modify: `src/utils/youtube.test.ts`

The current code uses `parsed.hostname.includes('youtube.com')` on the watch-URL path and **no hostname check at all** on the Shorts path. Both are fixed here by extracting a shared `isYouTubeHost` boolean.

- [ ] **Step 1: Write the failing tests**

Open `src/utils/youtube.test.ts`. Add these two cases inside the existing `describe('parseYouTubeUrl', ...)` block, after the last `it(...)`:

```ts
it('rejects a youtube.com lookalike subdomain on watch URL', () => {
  const result = parseYouTubeUrl('https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ');
  expect(result).toEqual({
    valid: false,
    error: 'Please paste a valid YouTube or YouTube Shorts URL.',
  });
});

it('rejects a youtube.com lookalike subdomain on Shorts URL', () => {
  const result = parseYouTubeUrl('https://youtube.com.evil.com/shorts/abcdefghijk');
  expect(result).toEqual({
    valid: false,
    error: 'Please paste a valid YouTube or YouTube Shorts URL.',
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/utils/youtube.test.ts`

Expected: the 2 new tests FAIL; the existing 7 still pass (9 total, 2 failing).

- [ ] **Step 3: Fix the hostname checks in `youtube.ts`**

Replace the entire file with:

```ts
import type { YouTubeParseResult } from '../types';

export function parseYouTubeUrl(url: string): YouTubeParseResult {
  try {
    const parsed = new URL(url.trim());
    const isYouTubeHost =
      parsed.hostname === 'youtube.com' || parsed.hostname === 'www.youtube.com';

    const shortsMatch = parsed.pathname.match(/^\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (shortsMatch && isYouTubeHost) {
      return { valid: true, videoId: shortsMatch[1], aspectRatio: '9:16' };
    }

    if (isYouTubeHost && parsed.searchParams.has('v')) {
      const videoId = parsed.searchParams.get('v')!;
      if (videoId.length === 11) {
        return { valid: true, videoId, aspectRatio: '16:9' };
      }
    }

    if (parsed.hostname === 'youtu.be') {
      const videoId = parsed.pathname.slice(1, 12);
      if (videoId.length === 11) {
        return { valid: true, videoId, aspectRatio: '16:9' };
      }
    }

    return { valid: false, error: 'Please paste a valid YouTube or YouTube Shorts URL.' };
  } catch {
    return { valid: false, error: 'Please paste a valid YouTube or YouTube Shorts URL.' };
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/utils/youtube.test.ts`

Expected: 9/9 passing.

- [ ] **Step 5: Run full test suite**

Run: `npx vitest run`

Expected: 52/52 passing (50 existing + 2 new).

- [ ] **Step 6: Commit**

```bash
git add src/utils/youtube.ts src/utils/youtube.test.ts
git commit -m "fix(security): enforce strict hostname equality in YouTube URL parser"
```

---

### Task 2: iframe sandbox and referrerpolicy

**Files:**
- Modify: `src/components/cards/embeds/YouTubeEmbed.tsx`

`sandbox` restricts what the embedded YouTube page can do in the browser. `referrerPolicy` stops the full document URL from leaking to YouTube on each request.

- [ ] **Step 1: Add `sandbox` and `referrerPolicy` to the iframe**

Replace the entire file with:

```tsx
import type { AspectRatio } from '../../../types';

interface Props {
  videoId: string;
  aspectRatio: AspectRatio;
}

const titleByAspectRatio: Record<AspectRatio, string> = {
  '16:9': 'YouTube video — 16:9',
  '9:16': 'YouTube Shorts — 9:16',
};

export function YouTubeEmbed({ videoId, aspectRatio }: Props) {
  return (
    <iframe
      className="h-full w-full rounded-b-lg"
      src={`https://www.youtube.com/embed/${videoId}`}
      title={titleByAspectRatio[aspectRatio]}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      sandbox="allow-scripts allow-same-origin allow-presentation"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
    />
  );
}
```

Note: React uses camelCase `referrerPolicy` (not the HTML attribute spelling `referrerpolicy`).

Sandbox flags chosen:
- `allow-scripts` — required for YouTube JS to run
- `allow-same-origin` — required for YouTube auth state and playback
- `allow-presentation` — enables the fullscreen API
- Omitted intentionally: `allow-popups`, `allow-top-navigation` — prevents YouTube from navigating the parent page

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc -b`

Expected: no errors.

- [ ] **Step 3: Run full test suite**

Run: `npx vitest run`

Expected: 52/52 passing.

- [ ] **Step 4: Commit**

```bash
git add src/components/cards/embeds/YouTubeEmbed.tsx
git commit -m "fix(security): add sandbox and referrerpolicy to YouTube iframe"
```

---

### Task 3: Cloudflare Pages security headers

**Files:**
- Create: `public/_headers`

Cloudflare Pages reads `_headers` from the build output root and injects the declared headers on every response. Vite copies `public/` verbatim into `dist/` during build — no `vite.config.ts` changes needed.

- [ ] **Step 1: Create `public/_headers`**

Create the file `public/_headers` with this exact content (two-space indent on each header line — Cloudflare requires it):

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; frame-src https://www.youtube.com; img-src 'self' data:; connect-src 'self'
```

What each header does:
- `X-Frame-Options: DENY` — prevents the app itself from being embedded in a third-party iframe (clickjacking protection)
- `X-Content-Type-Options: nosniff` — stops browsers guessing MIME types from response content
- `Referrer-Policy` — sends only the origin, not the full URL, on cross-site navigations
- `Permissions-Policy` — explicitly disables camera, microphone, and geolocation access
- `Content-Security-Policy` — allowlists only YouTube for frames; only bundled JS for scripts; `'unsafe-inline'` on styles is required because React inline `style={{ ... }}` props emit `style=""` attributes on DOM nodes

- [ ] **Step 2: Verify the file is included in the build output**

Run: `npm run build`

Then check:

```bash
ls dist/_headers
```

Expected: file exists. If it doesn't appear, check that `public/_headers` is at the root of the `public/` directory (not in a subdirectory).

- [ ] **Step 3: Commit**

```bash
git add public/_headers
git commit -m "fix(security): add Cloudflare Pages security headers"
```

---

### Task 4: npm dependency audit

**Files:**
- Possibly modify: `package.json`, `package-lock.json`

- [ ] **Step 1: Run the audit**

Run: `npm audit`

Read the output. Note the severity of each finding (critical, high, moderate, low/info).

- [ ] **Step 2: Apply automatic fixes**

Run: `npm audit fix`

This applies fixes that do not require a major version bump. If the output includes `"N vulnerabilities required manual review"` or `"Run npm audit fix --force to install breaking changes"`, **stop and report those findings** — do not apply `--force` without explicit approval from the user.

- [ ] **Step 3: Run full test suite**

Run: `npx vitest run`

Expected: 52/52 passing. If tests fail after `npm audit fix`, the fix introduced a breaking change — revert with:

```bash
git checkout package.json package-lock.json
npm install
```

Then report the specific package and version that caused the failure before retrying.

- [ ] **Step 4: Commit (only if audit fix changed files)**

Run `git diff --name-only` first. If `package.json` or `package-lock.json` changed:

```bash
git add package.json package-lock.json
git commit -m "fix(security): apply npm audit fixes"
```

If nothing changed (clean audit or no auto-fixable items), skip this commit.

---

## Post-execution

After all tasks are committed:

```bash
git push origin master
```

Then verify security headers in production once Cloudflare Pages deploys (usually under 60 seconds):

1. Open `https://canvasboard.jpredmon.com` in Chrome
2. DevTools → Network tab → click any document request → Headers tab
3. Confirm these response headers are present:
   - `content-security-policy`
   - `x-frame-options: DENY`
   - `x-content-type-options: nosniff`
