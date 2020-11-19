import type { SerializedChannel } from './SerializedChannel';
import type { SerializedCurve } from './SerializedCurve';
/**
 * Represents a serialized automaton data.
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
    channels: [name: string, channel: SerializedChannel][];
}
