/// <reference types="react" />
import { Resolution } from '../utils/Resolution';
import { TimeValueRange } from '../utils/TimeValueRange';
export interface TimeValueGridProps {
    range: TimeValueRange;
    size: Resolution;
    /**
     * Whether it should consider beatOffset or not
     */
    isAbsolute?: boolean;
    hideValue?: boolean;
}
declare const TimeValueGrid: (props: TimeValueGridProps) => JSX.Element;
export { TimeValueGrid };
