import { FxSection } from './FxSection';
import { SerializedBezierNode } from './BezierNode';

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
  fxs?: FxSection[];
}
