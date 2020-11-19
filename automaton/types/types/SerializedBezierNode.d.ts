/**
 * Serialized variant of {@link BezierNode}.
 * Some values are optional.
 */
export declare type SerializedBezierNode = [
    /**
     * Time of the node.
     * `0.0` by default.
     */
    time?: number,
    /**
     * Value of the node.
     * `0.0` by default.
     */
    value?: number,
    /**
     * Bezier control point of inlet. Time.
     * `0.0` by default.
     */
    inTime?: number,
    /**
     * Bezier control point of inlet. Value.
     * `0.0` by default.
     */
    inValue?: number,
    /**
     * Bezier control point of outlet. Time.
     * `0.0` by default.
     */
    outTime?: number,
    /**
     * Bezier control point of outlet. Value.
     * `0.0` by default.
     */
    outValue?: number
];
