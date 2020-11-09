/// <reference types="react" />
import { Resolution } from '../utils/Resolution';
import { TimeValueRange } from '../utils/TimeValueRange';
export interface TimeValueLinesProps {
    time?: number;
    value?: number;
    showBeat?: boolean;
    range: TimeValueRange;
    size: Resolution;
}
declare const TimeValueLines: (props: TimeValueLinesProps) => JSX.Element;
export { TimeValueLines };
