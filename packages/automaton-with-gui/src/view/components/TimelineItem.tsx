import { Resolution } from '../utils/Resolution';
import { TimeValueRange } from '../utils/TimeValueRange';
import { TimelineItemConstant } from './TimelineItemConstant';
import { TimelineItemCurve } from './TimelineItemCurve';
import { objectMapHas } from '../utils/objectMap';
import { registerMouseNoDragEvent } from '../utils/registerMouseNoDragEvent';
import { testRectIntersection } from '../utils/testRectIntersection';
import { useDispatch } from 'react-redux';
import { useMoveEntites } from '../utils/useMoveEntities';
import { useSelector } from '../states/store';
import React, { useCallback, useEffect, useRef } from 'react';
import type { ChannelEditorRectSelectState } from './ChannelEditor';
import type { StateChannelItem } from '../../types/StateChannelItem';

// == props ========================================================================================
export interface TimelineItemProps {
  channel: string;
  item: StateChannelItem;
  range: TimeValueRange;
  size: Resolution;
  rectSelectState?: ChannelEditorRectSelectState;
  dopeSheetMode?: boolean;
}

// == component ====================================================================================
const TimelineItem = ( props: TimelineItemProps ): JSX.Element => {
  const { item, range, size, rectSelectState: rectSelect, dopeSheetMode } = props;
  const channelName = props.channel;
  const dispatch = useDispatch();
  const { moveEntities } = useMoveEntites( range, size );

  const isSelected = useSelector(
    ( state ) => objectMapHas( state.timeline.selected.items, item.$id )
  );

  const automaton = useSelector( ( state ) => state.automaton.instance );
  const channel = channelName != null && automaton?.getChannel( channelName ) || null;

  const grabBody = useCallback(
    (): void => {
      if ( !isSelected ) {
        dispatch( {
          type: 'Timeline/SelectItems',
          items: [ {
            id: item.$id,
            channel: channelName
          } ]
        } );

        dispatch( {
          type: 'Timeline/SelectChannel',
          channel: channelName
        } );
      }

      moveEntities( {
        moveValue: !dopeSheetMode,
        snapOriginTime: item.time,
        snapOriginValue: item.value,
      } );

      registerMouseNoDragEvent( () => {
        dispatch( {
          type: 'Timeline/SelectItems',
          items: [ {
            id: item.$id,
            channel: channelName
          } ]
        } );
      } );
    },
    [
      dispatch,
      item.$id,
      item.time,
      item.value,
      channelName,
      moveEntities,
      dopeSheetMode,
      isSelected,
    ]
  );

  const grabBodyCtrl = useCallback(
    (): void => {
      dispatch( {
        type: 'Timeline/SelectItemsAdd',
        items: [ {
          id: item.$id,
          channel: channelName,
        } ],
      } );

      moveEntities( {
        moveValue: !dopeSheetMode,
        snapOriginTime: item.time,
        snapOriginValue: item.value,
      } );

      registerMouseNoDragEvent( () => {
        if ( isSelected ) {
          dispatch( {
            type: 'Timeline/SelectItemsSub',
            items: [ {
              id: item.$id,
              channel: channelName,
            } ],
          } );
        }
      } );
    },
    [
      channelName,
      dispatch,
      dopeSheetMode,
      isSelected,
      item.$id,
      item.time,
      item.value,
      moveEntities,
    ]
  );

  const removeItem = useCallback(
    (): void => {
      if ( !channel ) { return; }

      channel.removeItem( item.$id );

      dispatch( {
        type: 'History/Push',
        description: 'Remove Constant',
        commands: [
          {
            type: 'channel/removeItem',
            channel: channelName,
            data: item
          }
        ],
      } );
    },
    [ item, channel, dispatch, channelName ]
  );

  const refPrevIsIntersecting = useRef( false );
  useEffect(
    (): void => {
      if ( rectSelect?.isSelecting ) {
        const v0 = item.value;
        const v1 = item.value + ( item.curveId != null ? item.amp : 0.0 );

        const isIntersecting = testRectIntersection(
          item.time,
          Math.min( v0, v1 ),
          item.time + item.length,
          Math.max( v0, v1 ),
          rectSelect.t0,
          rectSelect.v0,
          rectSelect.t1,
          rectSelect.v1,
        );

        if ( isIntersecting !== refPrevIsIntersecting.current ) {
          dispatch( {
            type: isIntersecting ? 'Timeline/SelectItemsAdd' : 'Timeline/SelectItemsSub',
            items: [ {
              id: item.$id,
              channel: channelName,
            } ],
          } );
        }

        refPrevIsIntersecting.current = isIntersecting;
      } else {
        refPrevIsIntersecting.current = false;
      }
    },
    [
      item,
      channel,
      dispatch,
      channelName,
      rectSelect?.isSelecting,
      rectSelect?.t0,
      rectSelect?.v0,
      rectSelect?.t1,
      rectSelect?.v1,
    ],
  );

  if ( item.curveId != null ) {
    return (
      <TimelineItemCurve
        channel={ channelName }
        item={ item }
        range={ range }
        size={ size }
        grabBody={ grabBody }
        grabBodyCtrl={ grabBodyCtrl }
        removeItem={ removeItem }
        dopeSheetMode={ dopeSheetMode }
      />
    );
  } else {
    return (
      <TimelineItemConstant
        channel={ channelName }
        item={ item }
        range={ range }
        size={ size }
        grabBody={ grabBody }
        grabBodyCtrl={ grabBodyCtrl }
        removeItem={ removeItem }
        dopeSheetMode={ dopeSheetMode }
      />
    );
  }
};

export { TimelineItem };
