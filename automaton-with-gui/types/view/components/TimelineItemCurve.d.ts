/// <reference types="react" />
import { Resolution } from '../utils/Resolution';
import { TimeValueRange } from '../utils/TimeValueRange';
import type { StateChannelItem } from '../../types/StateChannelItem';
export interface TimelineItemCurveProps {
    channel: string;
    item: StateChannelItem;
    range: TimeValueRange;
    size: Resolution;
    grabBody: () => void;
    grabBodyCtrl: () => void;
    removeItem: () => void;
    dopeSheetMode?: boolean;
}
declare const TimelineItemCurve: (props: TimelineItemCurveProps) => JSX.Element;
export { TimelineItemCurve };
