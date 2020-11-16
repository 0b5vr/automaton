import type { SerializedCurve } from '@fms-cat/automaton';
import type { V3SerializedChannel } from './V3SerializedChannel';

/**
 * Interface of serialized automaton data.
 */
export interface V3SerializedAutomaton {
  /**
   * Resolution of the timeline.
   */
  resolution: number;

  /**
   * Curves of the automaton.
   */
  curves: SerializedCurve[];

  /**
   * Channels of the automaton.
   */
  channels: { [ name: string ]: V3SerializedChannel };
}
