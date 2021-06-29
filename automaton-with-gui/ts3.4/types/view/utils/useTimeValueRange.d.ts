import { Resolution } from './Resolution';
import { TimeValueRange } from './TimeValueRange';
export declare function useTimeValueRangeFuncs(range: TimeValueRange, size: Resolution): {
    x2t: (x: number) => number;
    t2x: (t: number) => number;
    y2v: (y: number) => number;
    v2y: (v: number) => number;
    dx2dt: (x: number) => number;
    dt2dx: (t: number) => number;
    dy2dv: (y: number) => number;
    dv2dy: (v: number) => number;
    snapTime: (t: number) => number;
    snapValue: (v: number) => number;
};
