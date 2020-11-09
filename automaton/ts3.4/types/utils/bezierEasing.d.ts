import { BezierNode } from '../types/BezierNode';
interface CubicBezierControlPoints {
    p0: number;
    p1: number;
    p2: number;
    p3: number;
}
export declare function rawBezierEasing(cpsx: CubicBezierControlPoints, cpsy: CubicBezierControlPoints, x: number): number;
export declare function bezierEasing(node0: BezierNode, node1: BezierNode, time: number): number;
export {};
