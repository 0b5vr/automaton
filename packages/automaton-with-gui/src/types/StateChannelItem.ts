import { WithID } from './WithID';

export interface StateChannelItem {
  time: number;
  length: number;
  value: number;
  reset: boolean;
  curveId: string | null;
  speed: number;
  offset: number;
  amp: number;
}

export interface StateChannelItem extends WithID {}
