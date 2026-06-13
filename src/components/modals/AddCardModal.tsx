import { type FormEvent,useState } from 'react';

import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { selectCardCount } from '../../store/cards/cardsSelectors';
import { addYouTubeCard } from '../../store/cards/cardsThunks';
import { selectAddCardModalOpen } from '../../store/ui/uiSelectors';
import { uiActions } from '../../store/ui/uiSlice';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';

export function AddCardModal() {
  const dispatch = useAppDispatch();
  const open = useAppSelector(selectAddCardModalOpen);
  const cardCount = useAppSelector(selectCardCount);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  function handleClose() {
    dispatch(uiActions.closeAddCardModal());
    setUrl('');
    setError('');
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      dispatch(addYouTubeCard(url));
      if (cardCount === 0) {
        dispatch(uiActions.setEditMode(true));
      }
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Add a video">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="card-url"
          label="YouTube URL"
          placeholder="https://www.youtube.com/watch?v=..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          error={error}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={url.trim() === ''}>
            Add Card
          </Button>
        </div>
      </form>
    </Modal>
  );
}
