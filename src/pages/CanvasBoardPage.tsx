import { BoardHeader } from '../components/board/BoardHeader';
import { EditModeBanner } from '../components/board/EditModeBanner';
import { EmptyBoardState } from '../components/board/EmptyBoardState';
import { GridCanvas } from '../components/board/GridCanvas';
import { NoBoardsState } from '../components/board/NoBoardsState';
import { AddCardModal } from '../components/modals/AddCardModal';
import { useAppSelector } from '../hooks/useAppSelector';
import { selectCardCount } from '../store/cards/cardsSelectors';
import { selectActiveBoardId } from '../store/boards/boardsSelectors';

export default function CanvasBoardPage() {
  const cardCount = useAppSelector(selectCardCount);
  const editMode = useAppSelector((state) => state.ui.editMode);
  const activeBoardId = useAppSelector(selectActiveBoardId);

  return (
    <div className="flex h-screen flex-col bg-zinc-950">
      <BoardHeader />
      <EditModeBanner visible={editMode} />
      {activeBoardId === null ? (
        <NoBoardsState />
      ) : cardCount === 0 ? (
        <EmptyBoardState />
      ) : (
        <GridCanvas />
      )}
      <AddCardModal />
    </div>
  );
}
