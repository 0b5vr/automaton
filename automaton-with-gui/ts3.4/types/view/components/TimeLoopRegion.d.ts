/// <reference types="react" />
import { Resolution } from '../utils/Resolution';
import { TimeRange } from '../utils/TimeValueRange';
declare const TimeLoopRegion: (props: {
    range: TimeRange;
    size: Resolution;
}) => JSX.Element | null;
export { TimeLoopRegion };
