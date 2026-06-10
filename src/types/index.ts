export type MediaType = 'youtube';

export type AspectRatio = '16:9' | '9:16';

interface BaseCard {
  id: string;
  type: MediaType;
  url: string;
  aspectRatio: AspectRatio;
  createdAt: number;
}

export interface YouTubeCard extends BaseCard {
  type: 'youtube';
  videoId: string;
}

export type MediaCard = YouTubeCard;

export interface CardLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW: number;
  minH: number;
}

export interface CardsState {
  ids: string[];
  entities: Record<string, MediaCard>;
}

export interface LayoutState {
  items: CardLayout[];
}

export interface UIState {
  addCardModalOpen: boolean;
  editMode: boolean;
}

export type YouTubeParseResult =
  | { valid: true; videoId: string; aspectRatio: AspectRatio }
  | { valid: false; error: string };
