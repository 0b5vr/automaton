/**
 * Represent an event that is emitted by [[Channel.update]].
 */
export interface ChannelUpdateEvent {
  /**
   * Current time in the current item.
   */
  time: number;

  /**
   * Current value of the channel.
   */
  value: number;

  /**
   * `true` if the update was the first call of the item.
   */
  init?: true;

  /**
   * `true` if the update was the last call of the item.
   */
  uninit?: true;

  /**
   * The progress of the item.
   */
  progress: number;
}
