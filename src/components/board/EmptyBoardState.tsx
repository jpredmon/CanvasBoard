import { useAppDispatch } from '../../hooks/useAppDispatch';
import { uiActions } from '../../store/ui/uiSlice';
import { Button } from '../ui/Button';

export function EmptyBoardState() {
  const dispatch = useAppDispatch();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-zinc-400">
      <p className="text-xl font-medium">Your board is empty</p>
      <p className="text-sm">Click the button below to add your first video</p>
      <Button onClick={() => dispatch(uiActions.openAddCardModal())}>+ Add Card</Button>
    </div>
  );
}
