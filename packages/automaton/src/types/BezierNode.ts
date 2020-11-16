import type { BezierControlPoint } from './BezierControlPoint';

/**
 * Represents a bezier node.
 */
export interface BezierNode {
  /**
   * Time of the node.
   */
  time: number;

  /**
   * Value of the node.
   */
  value: number;

  /**
   * Bezier control point of inlet.
   */
  in: BezierControlPoint;

  /**
   * Bezier control point of outlet.
   */
  out: BezierControlPoint;
}
