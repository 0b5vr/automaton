import type { SerializedChannelItem } from './SerializedChannelItem';

/**
 * Represents a serialized channel.
 */
export interface SerializedChannel {
  /**
   *List of channel items.
   */
  items?: SerializedChannelItem[];

  /**
   * The initial value of the channel.
   * If it's not defined, it will be `0.0`.
   */
  init?: number;
}
