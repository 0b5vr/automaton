import { SerializedChannelItem, SerializedChannelItemConstant, SerializedChannelItemCurve } from '@fms-cat/automaton';
import React from 'react';
import { Resolution } from '../utils/Resolution';
import { TimeValueRange } from '../utils/TimeValueRange';
import { TimelineItemConstant } from './TimelineItemConstant';
import { TimelineItemCurve } from './TimelineItemCurve';
import { WithID } from '../../types/WithID';

// == props ========================================================================================
export interface TimelineItemProps {
  channel: string;
  item: Required<SerializedChannelItem> & WithID;
  range: TimeValueRange;
  size: Resolution;
  dopeSheetMode?: boolean;
}

// == component ====================================================================================
const TimelineItem = ( props: TimelineItemProps ): JSX.Element => {
  const { channel, item, range, size, dopeSheetMode } = props;

  if ( 'curve' in item ) {
    return (
      <TimelineItemCurve
        channel={ channel }
        item={ item as Required<SerializedChannelItemCurve> & WithID }
        range={ range }
        size={ size }
        dopeSheetMode={ dopeSheetMode }
      />
    );
  } else {
    return (
      <TimelineItemConstant
        channel={ channel }
        item={ item as Required<SerializedChannelItemConstant> & WithID }
        range={ range }
        size={ size }
        dopeSheetMode={ dopeSheetMode }
      />
    );
  }
};

export { TimelineItem };
