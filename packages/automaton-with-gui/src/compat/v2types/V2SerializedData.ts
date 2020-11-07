import { V2AutomatonGUISettings } from './V2AutomatonGUISettings';
import { V2SerializedParam } from './V2SerializedParam';

/**
 * Interface of serialized automaton data.
 */
export interface V2SerializedData {
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
  params: { [ name: string ]: V2SerializedParam };

  /**
   * GUI settings.
   */
  guiSettings: V2AutomatonGUISettings;
}

export const v2DefaultData: V2SerializedData = Object.freeze( {
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
