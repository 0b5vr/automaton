import { Clock } from './Clock';
import { EventEmitter } from 'eventemitter3';
import { FxDefinition } from './types/FxDefinition';
import { Param } from './Param';
import { SerializedData } from './types/SerializedData';
import { SerializedParam } from './types/SerializedParam';
/**
 * Interface for options of {@link Automaton}.
 */
export interface AutomatonOptions {
    /**
     * Whether let the time loop or not.
     */
    loop?: boolean;
    /**
     * If this is set, the clock will become frame mode.
     */
    fps?: number;
    /**
     * If this is true, the clock will become realtime mode.
     */
    realtime?: boolean;
    /**
     * Serialized data of the automaton.
     * **MUST BE PARSED JSON**
     */
    data?: SerializedData;
}
/**
 * IT'S AUTOMATON!
 * It's `automaton.nogui.js` version and also base class for {@link AutomatonWithGUI}.
 * @param options Options for this Automaton instance
 */
export declare class Automaton extends EventEmitter {
    /**
     * **THE MIGHTY `auto()` FUNCTION!! GRAB IT**
     * It creates a new param automatically if there are no param called `_name` (GUI mode only).
     * Otherwise it returns current value of the param called `_name`.
     * @param name name of the param
     * @returns Current value of the param
     */
    auto: (name: string) => number;
    /**
     * Version of the automaton.
     */
    protected __version: string;
    /**
     * Length of the timeline.
     */
    protected __length: number;
    /**
     * Resolution of the timeline.
     */
    protected __resolution: number;
    /**
     * Whether the animation will be looped or not.
     */
    protected __isLoop: boolean;
    /**
     * Clock of the automaton.
     */
    protected __clock: Clock;
    /**
     * Params of the timeline.
     */
    protected __params: {
        [name: string]: Param;
    };
    /**
     * A list of fx definitions.
     */
    protected __fxDefs: {
        [name: string]: FxDefinition;
    };
    constructor(options: AutomatonOptions);
    /**
     * Version of the automaton.
     */
    readonly version: string;
    /**
     * Total length of animation in seconds.
     */
    readonly length: number;
    /**
     * Resolution = Sampling point per second.
     */
    readonly resolution: number;
    /**
     * Current time. Same as `automaton.__clock.time`.
     */
    readonly time: number;
    /**
     * Delta of time between now and previous update call.
     */
    readonly deltaTime: number;
    /**
     * Current progress by whole length. Might NOT be [0-1] unless {@link AutomatonOptions#loop} is true.
     */
    readonly progress: number;
    /**
     * Whether it's playing or not.
     */
    readonly isPlaying: boolean;
    /**
     * Current frame.
     * If the clock type is not frame mode, it will return `null` instead.
     */
    readonly frame: number | null;
    /**
     * Frame per second.
     * If the clock type is not frame mode, it will return `null` instead.
     */
    readonly fps: number | null;
    /**
     * Boolean that represents whether the clock is based on realtime or not.
     */
    readonly isRealtime: boolean;
    /**
     * Whether the animation will be looped or not.
     */
    readonly isLoop: boolean;
    /**
     * Create a new param.
     * @param name Name of the param
     * @param data Data for the param
     */
    createParam(name: string, data: SerializedParam): void;
    /**
     * Load serialized automaton data.
     * @param data Serialized object contains automaton data.
     */
    load(data: SerializedData): void;
    /**
     * Seek the timeline.
     * Can be performed via GUI.
     * @param time Time
     */
    seek(time: number): void;
    /**
     * Play the timeline.
     * @todo SHOULD be performed via GUI.
     */
    play(): void;
    /**
     * Pause the timeline.
     * @todo SHOULD be performed via GUI.
     */
    pause(): void;
    /**
     * Add a fx definition.
     * @param id Unique id for the Fx definition
     * @param fxDef Fx definition object
     */
    addFxDefinition(id: string, fxDef: FxDefinition): void;
    /**
     * Get a fx definition.
     * If it can't find the definition, it returns `null` instead.
     * @param id Unique id for the Fx definition
     */
    getFxDefinition(id: string): FxDefinition | null;
    /**
     * Precalculate all params.
     */
    precalcAll(): void;
    /**
     * Update the entire automaton.
     * **You may want to call this in your update loop.**
     * @param time Current time, **Required if the clock mode is manual**
     */
    update(time: number): void;
    /**
     * Assigned to {@link Automaton#auto} on its initialize phase.
     * @param name name of the param
     * @returns Current value of the param
     */
    protected __auto(name: string): number;
}
