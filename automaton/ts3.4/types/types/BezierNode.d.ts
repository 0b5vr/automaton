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
     * Bezier control point of inlet. Time.
     */
    inTime: number;
    /**
     * Bezier control point of inlet. Value.
     */
    inValue: number;
    /**
     * Bezier control point of outlet. Time.
     */
    outTime: number;
    /**
     * Bezier control point of outlet. Value.
     */
    outValue: number;
}
