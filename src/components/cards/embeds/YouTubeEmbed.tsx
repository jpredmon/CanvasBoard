import type { AspectRatio } from '../../../types';

interface Props {
  videoId: string;
  aspectRatio: AspectRatio;
}

export function YouTubeEmbed({ videoId }: Props) {
  return (
    <iframe
      className="h-full w-full rounded-b-lg"
      src={`https://www.youtube.com/embed/${videoId}`}
      title="YouTube video"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  );
}
