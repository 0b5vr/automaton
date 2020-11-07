import { Resolution } from '../utils/Resolution';
import { TimeValueRange } from '../utils/TimeValueRange';
import { TimelineItemConstant } from './TimelineItemConstant';
import { TimelineItemCurve } from './TimelineItemCurve';
import React from 'react';
import type { StateChannelItem } from '../../types/StateChannelItem';

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
