import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { selectSaveError } from '../../store/ui/uiSelectors';
import { uiActions } from '../../store/ui/uiSlice';

export function DataSyncBanner() {
  const dispatch = useAppDispatch();
  const saveError = useAppSelector(selectSaveError);

  if (!saveError) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-lg border border-red-500/30 bg-red-950/80 px-4 py-3 text-sm text-red-300 backdrop-blur"
    >
      Changes couldn't be saved. Check your connection.
      <button
        onClick={() => dispatch(uiActions.setSaveError(false))}
        aria-label="Dismiss save error"
        className="text-red-400 hover:text-red-200"
      >
        ✕
      </button>
    </div>
  );
}
