import { BoardHeader } from '../components/board/BoardHeader';
import { EditModeBanner } from '../components/board/EditModeBanner';
import { EmptyBoardState } from '../components/board/EmptyBoardState';
import { GridCanvas } from '../components/board/GridCanvas';
import { AddCardModal } from '../components/modals/AddCardModal';
import { useAppSelector } from '../hooks/useAppSelector';
import { selectCardCount } from '../store/cards/cardsSelectors';

export default function CanvasBoardPage() {
  const cardCount = useAppSelector(selectCardCount);
  const editMode = useAppSelector((state) => state.ui.editMode);

  return (
    <div className="flex h-screen flex-col bg-zinc-950">
      <BoardHeader />
      <EditModeBanner visible={editMode} />
      {cardCount === 0 ? <EmptyBoardState /> : <GridCanvas />}
      <AddCardModal />
    </div>
  );
}
