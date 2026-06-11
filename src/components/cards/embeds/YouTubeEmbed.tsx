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
      allowFullScreen
    />
  );
}
