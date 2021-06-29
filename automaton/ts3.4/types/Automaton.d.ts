import { Channel } from './Channel';
import { Curve } from './Curve';
import { AutomatonOptions } from './types/AutomatonOptions';
import { ChannelUpdateEvent } from './types/ChannelUpdateEvent';
import { FxDefinition } from './types/FxDefinition';
import { SerializedAutomaton } from './types/SerializedAutomaton';
/**
 * IT'S AUTOMATON!
 * @param data Serialized data of the automaton
 * @param options Options for this Automaton instance
 */
export declare class Automaton {
    /**
     * It returns the current value of the [[Channel]] called `name`.
     * If the `name` is an array, it returns a set of name : channel as an object instead.
     * You can also give a listener which will be executed when the channel changes its value (optional).
     * @param name The name of the channel
     * @param listener A function that will be executed when the channel changes its value
     * @returns Current value of the channel
     */
    readonly auto: Automaton['__auto'];
    /**
     * Curves of the automaton.
     */
    readonly curves: Curve[];
    /**
     * Channels of the timeline.
     */
    readonly channels: Channel[];
    /**
     * Map of channels, name vs. channel itself.
     */
    readonly mapNameToChannel: Map<string, Channel>;
    /**
     * Current time of the automaton.
     * Can be set by [[update]], be retrieved by [[get time]], be used by [[auto]]
     */
    protected __time: number;
    /**
     * Version of the automaton.
     */
    protected __version: string;
    /**
     * Resolution of the timeline.
     */
    protected __resolution: number;
    /**
     * A map of fx definitions.
     */
    protected __fxDefinitions: {
        [name: string]: FxDefinition;
    };
    constructor(data: SerializedAutomaton, options?: AutomatonOptions);
    /*
    * Current time of the automaton, that is set via [[update]].
    */
    readonly time: number;
    /*
    * Version of the automaton.
    */
    readonly version: string;
    /*
    * Resolution = Sampling point per second.
    */
    readonly resolution: number;
    /**
     * Load serialized automaton data.
     * @param data Serialized object contains automaton data.
     */
    deserialize(data: SerializedAutomaton): void;
    /**
     * Add fx definitions.
     * @param fxDefinitions A map of id - fx definition
     */
    addFxDefinitions(fxDefinitions: {
        [id: string]: FxDefinition;
    }): void;
    /**
     * Get a fx definition.
     * If it can't find the definition, it returns `null` instead.
     * @param id Unique id for the Fx definition
     */
    getFxDefinition(id: string): FxDefinition | null;
    /**
     * Get a curve.
     * @param index An index of the curve
     */
    getCurve(index: number): Curve | null;
    /**
     * Precalculate all curves.
     */
    precalcAll(): void;
    /**
     * Reset the internal states of channels.
     * **Call this method when you seek the time.**
     */
    reset(): void;
    /**
     * Update the entire automaton.
     * **You may want to call this in your update loop.**
     * @param time Current time
     */
    update(time: number): void;
    /**
     * Assigned to {@link Automaton#auto} on its initialize phase.
     * @param name The name of the channel
     * @param listener A function that will be executed when the channel changes its value
     * @returns Current value of the channel
     */
    protected __auto(name: string, listener?: (event: ChannelUpdateEvent) => void): number;
}
