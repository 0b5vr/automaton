import { SerializedChannel } from './SerializedChannel';

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
   * Instruments in the timeline.
   */
  channels: { [ name: string ]: SerializedChannel };
}
