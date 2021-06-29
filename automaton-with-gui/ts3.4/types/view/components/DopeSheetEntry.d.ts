/// <reference types="react" />
import { DopeSheetRectSelectState } from './DopeSheet';
import { TimeRange } from '../utils/TimeValueRange';
declare const DopeSheetEntry: (props: {
    className?: string;
    channel: string;
    range: TimeRange;
    rectSelectState: DopeSheetRectSelectState;
    intersectionRoot: HTMLElement | null;
}) => JSX.Element;
export { DopeSheetEntry };
