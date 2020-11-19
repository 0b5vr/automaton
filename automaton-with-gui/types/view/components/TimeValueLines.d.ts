/// <reference types="react" />
import { Resolution } from '../utils/Resolution';
import { TimeValueRange } from '../utils/TimeValueRange';
export interface TimeValueLinesProps {
    time?: number;
    value?: number;
    /**
     * Whether it should consider beatOffset or not
     */
    isAbsolute?: boolean;
    range: TimeValueRange;
    size: Resolution;
}
declare const TimeValueLines: (props: TimeValueLinesProps) => JSX.Element;
export { TimeValueLines };
