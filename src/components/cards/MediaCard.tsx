import { useState } from 'react';

import type { MediaCard as MediaCardType } from '../../types';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { CardControls } from './CardControls';
import { YouTubeEmbed } from './embeds/YouTubeEmbed';

interface Props {
  card: MediaCardType;
  editMode: boolean;
}

export function MediaCard({ card, editMode }: Props) {
  const [deleting, setDeleting] = useState(false);

  return (
    <ErrorBoundary>
      <div
        className={`flex h-full flex-col overflow-hidden rounded-lg border border-zinc-700/60 bg-zinc-800 ${
          deleting
            ? 'opacity-0 transition-opacity duration-150'
            : 'opacity-100 transition-colors duration-200 hover:border-violet-500/30'
        }`}
      >
        <CardControls
          cardId={card.id}
          editMode={editMode}
          onDeleteStart={() => setDeleting(true)}
        />
        {card.type === 'youtube' && (
          <YouTubeEmbed videoId={card.videoId} aspectRatio={card.aspectRatio} />
        )}
      </div>
    </ErrorBoundary>
  );
}
