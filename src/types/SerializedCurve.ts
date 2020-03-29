import { BezierNode } from './BezierNode';
import { FxSection } from './FxSection';

/**
 * Interface of a serialized curve.
 */
export interface SerializedCurve {
  /**
   * Bezier nodes of the curve.
   */
  nodes: BezierNode[];

  /**
   * Fx sections of the curve.
   */
  fxs?: FxSection[];
}
