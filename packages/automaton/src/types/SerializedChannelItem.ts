export interface SerializedChannelItem {
  /**
   * `0.0` by default
   */
  time?: number;

  /**
   * `0.0` by default
   */
  length?: number;

  /**
   * Repeat interval of the item.
   * If it is not defined, the item won't repeat.
   */
  repeat?: number;

  /**
   * `0.0` by default
   */
  value?: number;

  /**
   * Whether reset channels value to zero at the end of this item or not.
   * `false` by default.
   */
  reset?: boolean;

  /**
   * If it is not defined, interpret the item represents a constant item.
   */
  curve?: number | null;

  /**
   * This will only make sense when {@link curve} is specified.
   * `1.0` by default.
   */
  speed?: number;

  /**
   * This will only make sense when {@link curve} is specified.
   * `0.0` by default.
   */
  offset?: number;

  /**
   * This will only make sense when {@link curve} is specified.
   * `1.0` by default.
   */
  amp?: number;
}
