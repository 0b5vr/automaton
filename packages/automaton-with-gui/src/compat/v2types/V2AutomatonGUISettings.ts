/**
 * Interface for automaton GUI settings.
 */
export interface V2AutomatonGUISettings {
  /**
   * Whether snap is activeted or not.
   */
  snapActive: boolean;

  /**
   * Interval of snap, in time axis.
   */
  snapTime: number;

  /**
   * Interval of snap, in value axis.
   */
  snapValue: number;
}
