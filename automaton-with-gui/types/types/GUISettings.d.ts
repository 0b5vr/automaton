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
     * BPM of the beat.
     */
    bpm: number;
    /**
     * Time offset of the beat.
     */
    beatOffset: number;
    /**
     * Use beat instead of time in GUI.
     */
    useBeatInGUI: boolean;
    /**
     * Fractional precision for minimized data, for time axis.
     */
    minimizedPrecisionTime: number;
    /**
     * Fractional precision for minimized data, for value axis.
     */
    minimizedPrecisionValue: number;
}
export declare const defaultGUISettings: Readonly<GUISettings>;
