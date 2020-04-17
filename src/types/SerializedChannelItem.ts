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
   * `0.0` by default
   */
  value?: number;

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
