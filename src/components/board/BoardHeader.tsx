import { Button } from '../ui/Button';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { uiActions } from '../../store/ui/uiSlice';
import { selectCardCount } from '../../store/cards/cardsSelectors';
import { selectActiveBoardId } from '../../store/boards/boardsSelectors';
import { MAX_CARDS } from '../../constants';
import { BoardSelector } from './BoardSelector';

export function BoardHeader() {
  const dispatch = useAppDispatch();
  const editMode = useAppSelector((state) => state.ui.editMode);
  const cardCount = useAppSelector(selectCardCount);
  const activeBoardId = useAppSelector(selectActiveBoardId);

  return (
    <header className="relative flex items-center justify-between overflow-hidden border-b border-zinc-800 px-6 py-3">
      <div
        className="pointer-events-none absolute right-0 top-0 h-full w-64"
        style={{
          background:
            'radial-gradient(ellipse at top right, rgba(139,92,246,0.12) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />
      <h1 className="text-lg font-extrabold uppercase tracking-widest">
        <span className="text-zinc-100">CANVAS</span>
        <span className="text-violet-400">BOARD</span>
      </h1>
      <BoardSelector />
      {activeBoardId && (
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
            variant={editMode ? 'edit-active' : 'ghost'}
            onClick={() => dispatch(uiActions.toggleEditMode())}
            aria-pressed={editMode}
          >
            {editMode ? 'Done' : 'Edit'}
          </Button>
        </div>
      )}
    </header>
  );
}
