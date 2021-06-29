import { Resolution } from '../utils/Resolution';
import { TimeValueRange } from '../utils/TimeValueRange';
interface Options {
    moveValue: boolean;
    snapOriginTime?: number;
    snapOriginValue?: number;
}
export declare function useMoveEntites(range: TimeValueRange, size: Resolution): (options: Options) => void;
export {};
