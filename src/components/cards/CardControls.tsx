import { useState } from 'react';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { cardsActions } from '../../store/cards/cardsSlice';
import { layoutActions } from '../../store/layout/layoutSlice';

interface Props {
  cardId: string;
  editMode: boolean;
  onDeleteStart: () => void;
}

export function CardControls({ cardId, editMode, onDeleteStart }: Props) {
  const dispatch = useAppDispatch();
  const [confirming, setConfirming] = useState(false);

  function handleDelete() {
    onDeleteStart();
    setTimeout(() => {
      dispatch(cardsActions.removeCard(cardId));
      dispatch(layoutActions.removeLayoutItem(cardId));
    }, 150);
  }

  if (!editMode) return null;

  return (
    <div className="drag-handle flex h-8 cursor-grab items-center justify-between rounded-t-lg bg-violet-950/60 px-2 active:cursor-grabbing">
      <span className="select-none text-violet-400" aria-hidden="true">
        ⠿
      </span>
      {confirming ? (
        <div className="flex items-center gap-1">
          <button
            className="rounded px-2 py-0.5 text-xs text-zinc-300 hover:bg-zinc-700/60"
            onClick={() => setConfirming(false)}
          >
            Cancel
          </button>
          <button
            className="rounded bg-red-700 px-2 py-0.5 text-xs text-white hover:bg-red-600"
            onClick={handleDelete}
            aria-label="Confirm delete"
          >
            Delete
          </button>
        </div>
      ) : (
        <button
          className="rounded p-0.5 text-zinc-500 hover:bg-zinc-700/60 hover:text-red-400 transition-colors"
          onClick={() => setConfirming(true)}
          aria-label="Delete card"
        >
          ×
        </button>
      )}
    </div>
  );
}
