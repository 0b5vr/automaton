import { AutomatonGUISettings } from '../AutomatonWithGUI';
import { SerializedParam } from './SerializedParam';

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
  guiSettings: AutomatonGUISettings;
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
