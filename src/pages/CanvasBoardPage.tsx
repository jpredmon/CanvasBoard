import { BoardHeader } from '../components/board/BoardHeader';
import { EmptyBoardState } from '../components/board/EmptyBoardState';
import { GridCanvas } from '../components/board/GridCanvas';
import { AddCardModal } from '../components/modals/AddCardModal';
import { useAppSelector } from '../hooks/useAppSelector';
import { selectCardCount } from '../store/cards/cardsSelectors';

export default function CanvasBoardPage() {
  const cardCount = useAppSelector(selectCardCount);

  return (
    <div className="flex h-screen flex-col bg-zinc-900">
      <BoardHeader />
      {cardCount === 0 ? <EmptyBoardState /> : <GridCanvas />}
      <AddCardModal />
    </div>
  );
}
