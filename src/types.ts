export type WasteCategory = 'Wet' | 'Dry' | 'Hazardous';

export interface WasteItem {
  id: string;
  type: WasteCategory;
  name: string;
  icon: string;
  x: number;
  y: number;
}

export interface Score {
  name: string;
  points: number;
  date: string;
}

export interface PlayerInfo {
  name: string;
}

export interface ExtendedWasteItem extends WasteItem {
  isCollected?: boolean;
  shouldRemove?: boolean;
}