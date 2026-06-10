import { nanoid } from 'nanoid';
import type { AppThunk } from '../index';
import type { YouTubeCard, CardLayout } from '../../types';
import { MAX_CARDS, CARD_DEFAULTS } from '../../constants';
import { parseYouTubeUrl } from '../../utils/youtube';
import { findTopLeftCell } from '../../utils/layout';
import { cardsActions } from './cardsSlice';
import { layoutActions } from '../layout/layoutSlice';

export const addYouTubeCard =
  (url: string): AppThunk =>
  (dispatch, getState) => {
    const result = parseYouTubeUrl(url);
    if (!result.valid) throw new Error(result.error);

    const { cards, layout } = getState();
    if (cards.ids.length >= MAX_CARDS) {
      throw new Error(`Board is full (${MAX_CARDS} card maximum).`);
    }

    const id = nanoid();
    const defaults = CARD_DEFAULTS[result.aspectRatio];

    const card: YouTubeCard = {
      id,
      type: 'youtube',
      url,
      videoId: result.videoId,
      aspectRatio: result.aspectRatio,
      createdAt: Date.now(),
    };

    const layoutItem: CardLayout = {
      i: id,
      ...defaults,
      ...findTopLeftCell(layout.items, defaults.w),
    };

    dispatch(cardsActions.addCard(card));
    dispatch(layoutActions.addLayoutItem(layoutItem));
  };
