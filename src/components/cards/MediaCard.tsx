import { ErrorBoundary } from '../ui/ErrorBoundary';
import { CardControls } from './CardControls';
import { YouTubeEmbed } from './embeds/YouTubeEmbed';
import type { MediaCard as MediaCardType } from '../../types';

interface Props {
  card: MediaCardType;
  editMode: boolean;
}

export function MediaCard({ card, editMode }: Props) {
  return (
    <ErrorBoundary>
      <div className="flex h-full flex-col overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800">
        <CardControls cardId={card.id} editMode={editMode} />
        {card.type === 'youtube' && (
          <YouTubeEmbed videoId={card.videoId} aspectRatio={card.aspectRatio} />
        )}
      </div>
    </ErrorBoundary>
  );
}
