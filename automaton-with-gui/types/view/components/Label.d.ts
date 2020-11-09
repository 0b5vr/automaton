/// <reference types="react" />
import { Resolution } from '../utils/Resolution';
import { TimeValueRange } from '../utils/TimeValueRange';
declare const Label: ({ name, time, range, size }: {
    name: string;
    time: number;
    range: TimeValueRange;
    size: Resolution;
}) => JSX.Element;
export { Label };
