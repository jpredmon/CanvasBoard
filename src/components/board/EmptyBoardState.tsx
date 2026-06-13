import { useAppDispatch } from '../../hooks/useAppDispatch';
import { uiActions } from '../../store/ui/uiSlice';
import { Button } from '../ui/Button';

export function EmptyBoardState() {
  const dispatch = useAppDispatch();

  return (
    <div
      className="relative flex flex-1 flex-col items-center justify-center overflow-hidden"
      style={{
        backgroundImage:
          'linear-gradient(rgba(139,92,246,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.07) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(139,92,246,0.15) 0%, transparent 60%)',
        }}
        aria-hidden="true"
      />
      <div className="relative flex flex-col items-center gap-3 text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-violet-500">
          Empty Canvas
        </span>
        <h2 className="text-2xl font-extrabold text-zinc-100">Curate your video world</h2>
        <p className="max-w-xs text-sm text-zinc-400">
          Drag, resize, and arrange YouTube videos into your personal board
        </p>
        <Button className="mt-2" onClick={() => dispatch(uiActions.openAddCardModal())}>
          + Add Card
        </Button>
      </div>
    </div>
  );
}
