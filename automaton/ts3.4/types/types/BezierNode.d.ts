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
/**
 * Serialized variant of {@link BezierNode}.
 * Some values are optional.
 */
export interface SerializedBezierNode {
    /**
     * Time of the node.
     * `0.0` by default.
     */
    time?: number;
    /**
     * Value of the node.
     * `0.0` by default.
     */
    value?: number;
    /**
     * Bezier control point of inlet.
     * `{ time: 0.0, value: 0.0 }` by default.
     */
    in?: BezierControlPoint;
    /**
     * Bezier control point of outlet.
     * `{ time: 0.0, value: 0.0 }` by default.
     */
    out?: BezierControlPoint;
}
