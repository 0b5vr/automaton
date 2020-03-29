export type ChannelItem = {
  /**
   * `0.0` by default
   */
  time?: number;

  /**
   * `0.0` by default
   */
  length?: number;

  /**
   * `0.0` by default
   */
  value?: number; // `0.0` by default
} | {
  /**
   * `0.0` by default
   */
  time?: number;

  /**
   * `0.0` by default
   */
  offset?: number;

  /**
   * `0.0` by default
   */
  length?: number;

  /**
   * `1.0` by default
   */
  speed?: number;

  curve: number;
};
