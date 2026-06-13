import { describe, expect,it } from 'vitest';

import { parseYouTubeUrl } from './youtube';

describe('parseYouTubeUrl', () => {
  it('parses a standard youtube.com/watch URL', () => {
    const result = parseYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(result).toEqual({ valid: true, videoId: 'dQw4w9WgXcQ', aspectRatio: '16:9' });
  });

  it('parses a youtu.be short URL', () => {
    const result = parseYouTubeUrl('https://youtu.be/dQw4w9WgXcQ');
    expect(result).toEqual({ valid: true, videoId: 'dQw4w9WgXcQ', aspectRatio: '16:9' });
  });

  it('parses a YouTube Shorts URL', () => {
    const result = parseYouTubeUrl('https://www.youtube.com/shorts/abcdefghijk');
    expect(result).toEqual({ valid: true, videoId: 'abcdefghijk', aspectRatio: '9:16' });
  });

  it('rejects a non-YouTube URL', () => {
    const result = parseYouTubeUrl('https://vimeo.com/123456789');
    expect(result).toEqual({
      valid: false,
      error: 'Please paste a valid YouTube or YouTube Shorts URL.',
    });
  });

  it('rejects a malformed URL', () => {
    const result = parseYouTubeUrl('not a url at all');
    expect(result).toEqual({
      valid: false,
      error: 'Please paste a valid YouTube or YouTube Shorts URL.',
    });
  });

  it('rejects a youtube.com URL with no v param', () => {
    const result = parseYouTubeUrl('https://www.youtube.com/channel/UCxxxx');
    expect(result).toEqual({
      valid: false,
      error: 'Please paste a valid YouTube or YouTube Shorts URL.',
    });
  });

  it('trims whitespace before parsing', () => {
    const result = parseYouTubeUrl('  https://youtu.be/dQw4w9WgXcQ  ');
    expect(result).toEqual({ valid: true, videoId: 'dQw4w9WgXcQ', aspectRatio: '16:9' });
  });

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
});
