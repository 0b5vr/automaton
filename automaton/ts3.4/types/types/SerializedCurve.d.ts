import { SerializedBezierNode } from './BezierNode';
import { SerializedFxSection } from './FxSection';
/**
 * Interface of a serialized curve.
 */
export interface SerializedCurve {
    /**
     * Bezier nodes of the curve.
     */
    nodes: SerializedBezierNode[];
    /**
     * Fx sections of the curve.
     */
    fxs?: SerializedFxSection[];
}
