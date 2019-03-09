import { SerializedParam } from './SerializedParam';

/**
 * Interface of serialized timeline.
 */
export interface SerializedTimeline {
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
