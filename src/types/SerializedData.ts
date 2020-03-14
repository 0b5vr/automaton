import { SerializedParam } from './SerializedParam';

/**
 * Interface of serialized automaton data.
 */
export interface SerializedData {
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
  length: 1.0,
  resolution: 1000.0,
  params: {}
};
