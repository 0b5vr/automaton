/**
 * Serialized variant of {@link BezierControlPoint}.
 * Some values are optional.
 */
export interface SerializedBezierControlPoint {
  /**
   * Time of the control point.
   */
  time: number;

  /**
   * Value of the control point.
   */
  value: number;
}
