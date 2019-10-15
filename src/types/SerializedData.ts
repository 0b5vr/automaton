import { SerializedParam } from './SerializedParam';

/**
 * Interface of serialized automaton data.
 */
export interface SerializedData {
  /**
   * Version of the Automaton.
   */
  version: string;

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
}

export const defaultData: Readonly<SerializedData> = {
  version: process.env.VERSION!,

  length: 1.0,
  resolution: 1000.0,
  params: {}
};
