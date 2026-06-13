import { useEffect } from 'react';
import { BoardHeader } from '../components/board/BoardHeader';
import { EditModeBanner } from '../components/board/EditModeBanner';
import { EmptyBoardState } from '../components/board/EmptyBoardState';
import { GridCanvas } from '../components/board/GridCanvas';
import { NoBoardsState } from '../components/board/NoBoardsState';
import { AddCardModal } from '../components/modals/AddCardModal';
import { useAppSelector } from '../hooks/useAppSelector';
import { selectCardCount } from '../store/cards/cardsSelectors';
import { selectActiveBoardId, selectActiveBoard } from '../store/boards/boardsSelectors';
import { selectEditMode } from '../store/ui/uiSelectors';

export default function CanvasBoardPage() {
  const cardCount = useAppSelector(selectCardCount);
  const editMode = useAppSelector(selectEditMode);
  const activeBoardId = useAppSelector(selectActiveBoardId);
  const activeBoard = useAppSelector(selectActiveBoard);

  useEffect(() => {
    document.title = activeBoard ? `${activeBoard.name} — CanvasBoard` : 'CanvasBoard';
  }, [activeBoard]);

  return (
    <div className="flex h-screen flex-col bg-zinc-950">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-violet-600 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <BoardHeader />
      <EditModeBanner visible={editMode} />
      <main id="main-content" className="flex flex-1 flex-col overflow-hidden">
        {activeBoardId === null ? (
          <NoBoardsState />
        ) : cardCount === 0 ? (
          <EmptyBoardState />
        ) : (
          <GridCanvas />
        )}
      </main>
      <AddCardModal />
    </div>
  );
}
