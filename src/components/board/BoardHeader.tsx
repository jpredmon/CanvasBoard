import { Button } from '../ui/Button';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { uiActions } from '../../store/ui/uiSlice';
import { selectCardCount } from '../../store/cards/cardsSelectors';
import { MAX_CARDS } from '../../constants';

export function BoardHeader() {
  const dispatch = useAppDispatch();
  const editMode = useAppSelector((state) => state.ui.editMode);
  const cardCount = useAppSelector(selectCardCount);

  return (
    <header className="flex items-center justify-between border-b border-zinc-700 px-6 py-3">
      <h1 className="text-lg font-semibold text-zinc-100">CanvasBoard</h1>
      <div className="flex items-center gap-2">
        <Button
          variant="primary"
          onClick={() => dispatch(uiActions.openAddCardModal())}
          disabled={cardCount >= MAX_CARDS}
          aria-label="Add card"
        >
          + Add Card
        </Button>
        <Button
          variant="ghost"
          onClick={() => dispatch(uiActions.toggleEditMode())}
          aria-pressed={editMode}
        >
          {editMode ? 'Done' : 'Edit'}
        </Button>
      </div>
    </header>
  );
}
