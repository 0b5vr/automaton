import { SerializedChannelItem } from './SerializedChannelItem';

export interface SerializedChannelItemCurve extends SerializedChannelItem {

  /**
   * `0.0` by default
   */
  offset?: number;

  /**
   * `1.0` by default
   */
  speed?: number;

  /**
   * An id of the curve
   */
  curve: number;
}
