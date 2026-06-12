import { useState, type FormEvent } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { uiActions } from '../../store/ui/uiSlice';
import { addYouTubeCard } from '../../store/cards/cardsThunks';
import { selectCardCount } from '../../store/cards/cardsSelectors';

export function AddCardModal() {
  const dispatch = useAppDispatch();
  const open = useAppSelector((state) => state.ui.addCardModalOpen);
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
          autoFocus
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
