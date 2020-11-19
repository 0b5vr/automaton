import { SerializedFxSection } from '@fms-cat/automaton';
import { V3SerializedBezierNode } from './V3SerializedBezierNode';
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
