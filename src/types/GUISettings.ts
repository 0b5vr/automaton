/**
 * Interface for automaton GUI settings.
 */
export interface GUISettings {
  /**
   * Whether the time snap is activated or not.
   */
  snapTimeActive: boolean;

  /**
   * Interval of time axis snap.
   */
  snapTimeInterval: number;

  /**
   * Whether the value snap is activated or not.
   */
  snapValueActive: boolean;

  /**
   * Interval of value axis snap.
   */
  snapValueInterval: number;
}

export const defaultGUISettings: Readonly<GUISettings> = {
  snapTimeActive: false,
  snapTimeInterval: 0.1,
  snapValueActive: false,
  snapValueInterval: 0.1
};
