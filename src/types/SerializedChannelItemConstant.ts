import { SerializedChannelItem } from './SerializedChannelItem';

export interface SerializedChannelItemConstant extends SerializedChannelItem {
  /**
   * `0.0` by default
   */
  value?: number; // `0.0` by default
}
