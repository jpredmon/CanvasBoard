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
