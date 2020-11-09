import type { SerializedChannel } from './SerializedChannel';
import type { SerializedCurve } from './SerializedCurve';
/**
 * Interface of serialized automaton data.
 */
export interface SerializedAutomaton {
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
    channels: {
        [name: string]: SerializedChannel;
    };
}
