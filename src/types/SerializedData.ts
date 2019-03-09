import { SerializedParam } from './SerializedParam';

/**
 * GUI settings section of the {#SerializedData}.
 */
export interface SerializedGUISettings {
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

/**
 * Interface of serialized automaton data.
 */
export interface SerializedData {
  /**
   * Version of the Automaton.
   */
  v: string;

  /**
   * Length of the timeline.
   */
  length: number;

  /**
   * Resolution of the timeline.
   */
  resolution: number;

  /**
   * Params in the timeline.
   */
  params: { [ name: string ]: SerializedParam };

  /**
   * GUI settings.
   */
  guiSettings: SerializedGUISettings
}

export const defaultData: SerializedData = Object.freeze( {
  v: process.env.VERSION!,

  length: 1.0,
  resolution: 1000.0,
  params: {},

  guiSettings: {
    snapActive: false,
    snapTime: 0.1,
    snapValue: 0.1
  }
} );
