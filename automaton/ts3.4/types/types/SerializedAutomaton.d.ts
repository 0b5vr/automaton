import { SerializedChannel } from './SerializedChannel';
import { SerializedCurve } from './SerializedCurve';
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
