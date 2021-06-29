/// <reference types="react" />
import { Resolution } from '../utils/Resolution';
import { TimeValueRange } from '../utils/TimeValueRange';
import { StateChannelItem } from '../../types/StateChannelItem';
export interface TimelineItemConstantProps {
    channel: string;
    item: StateChannelItem;
    range: TimeValueRange;
    size: Resolution;
    grabBody: () => void;
    grabBodyCtrl: () => void;
    removeItem: () => void;
    dopeSheetMode?: boolean;
}
declare const TimelineItemConstant: (props: TimelineItemConstantProps) => JSX.Element;
export { TimelineItemConstant };
