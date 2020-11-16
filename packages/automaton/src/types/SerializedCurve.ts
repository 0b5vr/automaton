import type { SerializedBezierNode } from './SerializedBezierNode';
import type { SerializedFxSection } from './SerializedFxSection';

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
