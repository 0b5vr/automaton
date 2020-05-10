import React from 'react';
import { Resolution } from '../utils/Resolution';
import type { StateChannelItem } from '../../types/StateChannelItem';
import { TimeValueRange } from '../utils/TimeValueRange';
import { TimelineItemConstant } from './TimelineItemConstant';
import { TimelineItemCurve } from './TimelineItemCurve';

// == props ========================================================================================
export interface TimelineItemProps {
  channel: string;
  item: StateChannelItem;
  range: TimeValueRange;
  size: Resolution;
  dopeSheetMode?: boolean;
}

// == component ====================================================================================
const TimelineItem = ( props: TimelineItemProps ): JSX.Element => {
  const { channel, item, range, size, dopeSheetMode } = props;

  if ( item.curveId != null ) {
    return (
      <TimelineItemCurve
        channel={ channel }
        item={ item }
        range={ range }
        size={ size }
        dopeSheetMode={ dopeSheetMode }
      />
    );
  } else {
    return (
      <TimelineItemConstant
        channel={ channel }
        item={ item }
        range={ range }
        size={ size }
        dopeSheetMode={ dopeSheetMode }
      />
    );
  }
};

export { TimelineItem };
