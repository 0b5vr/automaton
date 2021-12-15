import type { SerializedFxSection } from '@0b5vr/automaton';
import type { V3SerializedBezierNode } from './V3SerializedBezierNode';
/**
 * Interface of a serialized curve.
 */
export interface V3SerializedCurve {
    /**
     * Bezier nodes of the curve.
     */
    nodes: V3SerializedBezierNode[];
    /**
     * Fx sections of the curve.
     */
    fxs?: SerializedFxSection[];
}
