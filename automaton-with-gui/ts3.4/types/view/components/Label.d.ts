/// <reference types="react" />
import { Resolution } from '../utils/Resolution';
import { TimeRange } from '../utils/TimeValueRange';
declare const Label: ({ name, time, range, size }: {
    name: string;
    time: number;
    range: TimeRange;
    size: Resolution;
}) => JSX.Element;
export { Label };
