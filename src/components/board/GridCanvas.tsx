import { useEffect, useRef, useState } from 'react';
import ReactGridLayout, { type Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { useAppSelector } from '../../hooks/useAppSelector';
import { selectAllCards } from '../../store/cards/cardsSelectors';
import { selectLayout } from '../../store/layout/layoutSelectors';
import { layoutActions } from '../../store/layout/layoutSlice';
import { MediaCard } from '../cards/MediaCard';
import type { CardLayout } from '../../types';
import { GRID_COLS, GRID_ROW_HEIGHT, GRID_MARGIN, GRID_CONTAINER_PADDING } from '../../constants';

export function GridCanvas() {
  const dispatch = useAppDispatch();
  const cards = useAppSelector(selectAllCards);
  const layout = useAppSelector(selectLayout);
  const editMode = useAppSelector((state) => state.ui.editMode);

  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1200);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function toCardLayout(items: Layout[]): CardLayout[] {
    return items.map(({ i, x, y, w, h, minW, minH }) => ({
      i, x, y, w, h,
      minW: minW ?? 2,
      minH: minH ?? 2,
    }));
  }

  function handleDragStop(items: Layout[]) {
    dispatch(layoutActions.updateLayout(toCardLayout(items)));
  }

  function handleResizeStop(items: Layout[]) {
    dispatch(layoutActions.updateLayout(toCardLayout(items)));
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-auto">
      <ReactGridLayout
        layout={layout}
        cols={GRID_COLS}
        rowHeight={GRID_ROW_HEIGHT}
        width={width}
        margin={GRID_MARGIN}
        containerPadding={GRID_CONTAINER_PADDING}
        draggableHandle=".drag-handle"
        compactType={null}
        preventCollision={false}
        onDragStop={handleDragStop}
        onResizeStop={handleResizeStop}
        isDraggable={editMode}
        isResizable={editMode}
        useCSSTransforms={true}
      >
        {cards.map((card) => (
          <div key={card.id}>
            <MediaCard card={card} editMode={editMode} />
          </div>
        ))}
      </ReactGridLayout>
    </div>
  );
}
