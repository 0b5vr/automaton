import { V3SerializedChannel } from './V3SerializedChannel';
import { V3SerializedCurve } from './V3SerializedCurve';
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
    curves: V3SerializedCurve[];
    /**
     * Channels of the automaton.
     */
    channels: {
        [name: string]: V3SerializedChannel;
    };
}
