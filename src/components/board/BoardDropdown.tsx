import { useState, useRef, useEffect } from 'react';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { selectAllBoards, selectActiveBoardId } from '../../store/boards/boardsSelectors';
import { boardsActions } from '../../store/boards/boardsSlice';
import { switchBoard, createAndSwitchBoard, deleteBoard } from '../../store/boards/boardsThunks';

interface Props {
  onClose: () => void;
}

export function BoardDropdown({ onClose }: Props) {
  const dispatch = useAppDispatch();
  const boards = useAppSelector(selectAllBoards);
  const activeBoardId = useAppSelector(selectActiveBoardId);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [creatingNew, setCreatingNew] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');

  // Bug 1 & 2: ref flag to prevent double-commit / commit-after-cancel
  const renameCancelledRef = useRef(false);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const newBoardInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renamingId) renameInputRef.current?.focus();
  }, [renamingId]);

  useEffect(() => {
    if (creatingNew) newBoardInputRef.current?.focus();
  }, [creatingNew]);

  function handleSwitch(boardId: string) {
    if (boardId !== activeBoardId) {
      dispatch(switchBoard(boardId));
    }
    onClose();
  }

  // Bug 3: clear creatingNew state when starting a rename
  function startRename(boardId: string, currentName: string) {
    setCreatingNew(false);
    setNewBoardName('');
    setRenamingId(boardId);
    setRenameValue(currentName);
  }

  function commitRename() {
    // Bug 1 & 2: bail out if Escape was pressed
    if (renameCancelledRef.current) {
      renameCancelledRef.current = false;
      return;
    }
    if (renamingId && renameValue.trim()) {
      dispatch(boardsActions.renameBoard({ id: renamingId, name: renameValue.trim() }));
    }
    setRenamingId(null);
    setRenameValue('');
  }

  function handleDelete(boardId: string) {
    dispatch(deleteBoard(boardId));
    onClose();
  }

  function handleCreateNew() {
    if (newBoardName.trim()) {
      dispatch(createAndSwitchBoard(newBoardName.trim()));
      setNewBoardName('');
      setCreatingNew(false);
      onClose();
    }
  }

  return (
    <div className="absolute left-0 top-full z-50 mt-1 min-w-[220px] rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl">
      {/* Bug 4: role="menu" is correct for a dropdown with multiple interactive actions per row */}
      <ul role="menu" className="py-1">
        {/* Bug 7: use ternary with null instead of `board && (...)` to avoid emitting `false` */}
        {boards.map((board) => (
          <li key={board.id} role="none" className="flex items-center gap-1 px-2 py-0.5">
            {renamingId === board.id ? (
              <input
                ref={renameInputRef}
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    // Bug 1 & 2: blur to trigger onBlur as the single commit point
                    e.currentTarget.blur();
                  }
                  if (e.key === 'Escape') {
                    // Bug 1: set cancelled flag before clearing state so blur sees it
                    renameCancelledRef.current = true;
                    setRenamingId(null);
                    setRenameValue('');
                  }
                }}
                onBlur={commitRename}
                aria-label="Rename board"
                className="flex-1 rounded border border-violet-500 bg-zinc-800 px-2 py-0.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-1 focus:ring-offset-zinc-900"
              />
            ) : (
              // Bug 4: role="menuitem" for items inside role="menu"; remove aria-selected (listbox concept)
              <button
                role="menuitem"
                onClick={() => handleSwitch(board.id)}
                className={`flex-1 truncate rounded px-2 py-1.5 text-left text-sm ${
                  board.id === activeBoardId
                    ? 'font-semibold text-violet-400'
                    : 'text-zinc-300 hover:text-zinc-100'
                }`}
              >
                {board.name}
              </button>
            )}
            <button
              role="menuitem"
              onClick={() => startRename(board.id, board.name)}
              className="rounded p-1 text-zinc-500 hover:text-zinc-300"
              aria-label={`Rename ${board.name}`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button
              role="menuitem"
              onClick={() => handleDelete(board.id)}
              className="rounded p-1 text-zinc-500 hover:text-red-400"
              aria-label={`Delete ${board.name}`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
      <div className="border-t border-zinc-700 px-2 py-1">
        {creatingNew ? (
          <div className="flex gap-1">
            <input
              ref={newBoardInputRef}
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateNew();
                if (e.key === 'Escape') {
                  setCreatingNew(false);
                  setNewBoardName('');
                }
              }}
              placeholder="Board name..."
              aria-label="New board name"
              className="flex-1 rounded border border-violet-500 bg-zinc-800 px-2 py-1 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-1 focus:ring-offset-zinc-900"
            />
            <button
              onClick={handleCreateNew}
              disabled={newBoardName.trim() === ''}
              className="rounded px-2 py-1 text-sm text-violet-400 hover:text-violet-300 disabled:opacity-40"
            >
              Add
            </button>
          </div>
        ) : (
          // Bug 3: clear any active rename state when opening new-board input
          <button
            onClick={() => {
              setRenamingId(null);
              setRenameValue('');
              setCreatingNew(true);
            }}
            className="w-full rounded px-2 py-1 text-left text-sm text-zinc-400 hover:text-zinc-200"
          >
            + New Board
          </button>
        )}
      </div>
    </div>
  );
}
