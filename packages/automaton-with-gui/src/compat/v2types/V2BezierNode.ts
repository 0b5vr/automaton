/**
 * Interface of a bezier control point.
 */
export interface V2BezierControlPoint {
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
export interface V2BezierNode {
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
  in?: V2BezierControlPoint;

  /**
   * Bezier control point of outlet.
   */
  out?: V2BezierControlPoint;
}
