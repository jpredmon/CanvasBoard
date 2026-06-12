import { useEffect, useRef, useState } from 'react';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { createAndSwitchBoard } from '../../store/boards/boardsThunks';
import { Button } from '../ui/Button';

export function NoBoardsState() {
  const dispatch = useAppDispatch();
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleCreate() {
    if (name.trim()) {
      dispatch(createAndSwitchBoard(name.trim()));
    }
  }

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
          background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.15) 0%, transparent 60%)',
        }}
        aria-hidden="true"
      />
      <div className="relative flex flex-col items-center gap-4 text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-violet-500">
          Welcome
        </span>
        <p className="text-2xl font-extrabold text-zinc-100">Create your first board</p>
        <p className="max-w-xs text-sm text-zinc-400">
          Name your board and start curating your video world
        </p>
        <div className="mt-2 flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="Board name..."
            aria-label="Board name"
            className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
          />
          <Button onClick={handleCreate} disabled={name.trim() === ''}>
            Create Board
          </Button>
        </div>
      </div>
    </div>
  );
}
