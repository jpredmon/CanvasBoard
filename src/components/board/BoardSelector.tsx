import { useState, useRef, useEffect } from 'react';
import { useAppSelector } from '../../hooks/useAppSelector';
import { selectActiveBoard } from '../../store/boards/boardsSelectors';
import { BoardDropdown } from './BoardDropdown';

export function BoardSelector() {
  const activeBoard = useAppSelector(selectActiveBoard);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  if (!activeBoard) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold text-zinc-100 hover:bg-zinc-800 focus:outline-none"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="max-w-[180px] truncate">{activeBoard.name}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mt-0.5 text-zinc-400"
          aria-hidden="true"
        >
          <path d="M2 4l4 4 4-4" />
        </svg>
      </button>
      {open && <BoardDropdown onClose={() => setOpen(false)} />}
    </div>
  );
}
