import { BezierNode } from './types/BezierNode';
export declare function rawCubicBezier(x1: number, y1: number, x2: number, y2: number, x: number): number;
export declare function cubicBezier(node0: BezierNode, node1: BezierNode, time: number): number;
