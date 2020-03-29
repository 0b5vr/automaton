import { SerializedChannelItemConstant } from './SerializedChannelItemConstant';
import { SerializedChannelItemCurve } from './SerializedChannelItemCurve';

/**
 * Interface of a serialized channel.
 */
export interface SerializedChannel {
  /**
   *List of channel items.
   */
  items: ( SerializedChannelItemConstant | SerializedChannelItemCurve )[];
}
