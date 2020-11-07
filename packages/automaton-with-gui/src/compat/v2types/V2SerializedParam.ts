import { V2BezierNode } from './V2BezierNode';
import { V2FxSection } from './V2FxSection';

/**
 * Interface of serialized param.
 */
export interface V2SerializedParam {
  /**
   * Bezier nodes of the param.
   */
  nodes: V2BezierNode[];

  /**
   * Fx sections of the param.
   */
  fxs: V2FxSection[];
}
