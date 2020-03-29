import { BezierNode } from './BezierNode';
import { FxSection } from './FxSection';

/**
 * Interface of a serialized channel.
 */
export interface SerializedChannel {
  /**
   * Bezier nodes of the channel.
   */
  nodes: BezierNode[];

  /**
   * Fx sections of the channel.
   */
  fxs: FxSection[];
}
