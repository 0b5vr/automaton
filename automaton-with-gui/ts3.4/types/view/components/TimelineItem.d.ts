/// <reference types="react" />
import { Resolution } from '../utils/Resolution';
import { TimeValueRange } from '../utils/TimeValueRange';
import { StateChannelItem } from '../../types/StateChannelItem';
export interface TimelineItemProps {
    channel: string;
    item: StateChannelItem;
    range: TimeValueRange;
    size: Resolution;
    dopeSheetMode?: boolean;
}
declare const TimelineItem: (props: TimelineItemProps) => JSX.Element;
export { TimelineItem };
