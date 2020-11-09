import { GUISettings } from '../../types/GUISettings';
export interface TimeRange {
    t0: number;
    t1: number;
}
export interface ValueRange {
    v0: number;
    v1: number;
}
export interface TimeValueRange extends TimeRange {
}
export interface TimeValueRange extends ValueRange {
}
export declare function x2t(x: number, range: TimeRange, width: number): number;
export declare function t2x(t: number, range: TimeRange, width: number): number;
export declare function y2v(y: number, range: ValueRange, height: number): number;
export declare function v2y(v: number, range: ValueRange, height: number): number;
export declare function dx2dt(x: number, range: TimeRange, width: number): number;
export declare function dt2dx(t: number, range: TimeRange, width: number): number;
export declare function dy2dv(y: number, range: ValueRange, height: number): number;
export declare function dv2dy(v: number, range: ValueRange, height: number): number;
export declare function snapTime(time: number, range: TimeRange, width: number, settings: GUISettings): number;
export declare function snapValue(value: number, range: ValueRange, height: number, settings: GUISettings | null): number;
