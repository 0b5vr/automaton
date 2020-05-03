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

  /**
   * Enable the beat snap.
   */
  snapBeatActive: boolean;

  /**
   * BPM of the beat snap.
   */
  snapBeatBPM: number;

  /**
   * Fractional precision for minimized data, for time axis.
   */
  minimizedPrecisionTime: number;

  /**
   * Fractional precision for minimized data, for value axis.
   */
  minimizedPrecisionValue: number;
}

export const defaultGUISettings: Readonly<GUISettings> = {
  snapTimeActive: false,
  snapTimeInterval: 0.1,
  snapValueActive: false,
  snapValueInterval: 0.1,
  snapBeatActive: false,
  snapBeatBPM: 140.0,
  minimizedPrecisionTime: 3,
  minimizedPrecisionValue: 3,
};
