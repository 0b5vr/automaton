/**
 * Interface of a bezier control point.
 */
export interface BezierControlPoint {
  /**
   * Time of the control point.
   */
  time: number;

  /**
   * Value of the control point.
   */
  value: number;
}

/**
 * Interface of a bezier node.
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
