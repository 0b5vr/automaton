import { Automaton } from './Automaton';
import { BezierNode } from './types/BezierNode';
import { FxSection } from './types/FxSection';
import { SerializedParam } from './types/SerializedParam';
/**
 * It represents a param of Automaton.
 * It's `automaton.nogui.js` version and also base class for {@link ParamWithGUI}
 * @param automaton Parent automaton
 * @param data Data of the param
 */
export declare class Param {
    /**
     * The parent automaton.
     */
    protected __automaton: Automaton;
    /**
     * An array of precalculated value.
     * Its length is same as `param.__automaton.resolution * param.__automaton.length + 1`.
    */
    protected __values: Float32Array;
    /**
     * List of bezier node.
     */
    protected __nodes: BezierNode[];
    /**
     * List of fx sections.
     */
    protected __fxs: FxSection[];
    /**
     * A cache of last calculated value.
     */
    protected __lastValue: number;
    /**
     * Will be used for calculation of {@link Param#__lastValue}.
     */
    protected __lastTime: number;
    constructor(automaton: Automaton, data?: SerializedParam);
    /**
     * Load a param data.
     * @param data Data of param
     */
    load(data: SerializedParam): void;
    /**
     * Precalculate value of samples.
     */
    precalc(): void;
    /**
     * Return the value of specified time point.
     * @param time Time at the point you want to grab the value.
     * If it is not given, use current time of parent automaton instead
     * @returns Result value
     */
    getValue(time?: number): number;
}
