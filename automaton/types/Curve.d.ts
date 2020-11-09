import { Automaton } from './Automaton';
import type { BezierNode } from './types/BezierNode';
import type { FxSection } from './types/FxSection';
import type { SerializedCurve } from './types/SerializedCurve';
/**
 * It represents a curve of Automaton.
 */
export declare class Curve {
    /**
     * The parent automaton.
     */
    protected __automaton: Automaton;
    /**
     * An array of precalculated value.
     * Its length is same as `curve.__automaton.resolution * curve.__automaton.length + 1`.
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
     * The length of this curve.
     */
    get length(): number;
    /**
     * Constructor of a [[Curve]].
     * @param automaton Parent automaton
     * @param data Data of the curve
     */
    constructor(automaton: Automaton, data: SerializedCurve);
    /**
     * Load a serialized data of a curve.
     * @param data Data of a curve
     */
    deserialize(data: SerializedCurve): void;
    /**
     * Precalculate value of samples.
     */
    precalc(): void;
    /**
     * Return the value of specified time point.
     * @param time Time at the point you want to grab the value.
     * @returns Result value
     */
    getValue(time: number): number;
    /**
     * The first step of {@link precalc}: generate a curve out of nodes.
     */
    protected __generateCurve(): void;
    /**
     * The second step of {@link precalc}: apply fxs to the generated curves.
     */
    protected __applyFxs(): void;
}
