import { BezierNode } from './BezierNode';
import { FxSection } from './FxSection';

/**
 * Interface of serialized param.
 */
export interface SerializedParam {
  /**
   * Bezier nodes of the param.
   */
  nodes: BezierNode[];

  /**
   * Fx sections of the param.
   */
  fxs: FxSection[];
}
