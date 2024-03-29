import { BoolParam } from './BoolParam';
import { ChannelWithGUI } from '../../ChannelWithGUI';
import { InspectorHeader } from './InspectorHeader';
import { InspectorHr } from './InspectorHr';
import { InspectorItem } from './InspectorItem';
import { NumberParam } from './NumberParam';
import { useDispatch, useSelector } from '../states/store';
import { useTimeUnit } from '../utils/useTimeUnit';
import React from 'react';
import styled from 'styled-components';
import type { StateChannelItem } from '../../types/StateChannelItem';

// == microcomponents ==============================================================================
interface Props {
}

const InspectorChannelItemCurveParams = ( props: {
  channel: ChannelWithGUI;
  channelName: string;
  stateItem: StateChannelItem;
  itemId: string;
} ): JSX.Element | null => {
  const dispatch = useDispatch();

  const { displayToTime, timeToDisplay } = useTimeUnit();

  if ( props.stateItem.curveId == null ) { return null; }

  const { channel, channelName, itemId } = props;
  const stateItem = props.stateItem;

  return <>
    <InspectorHr />

    <InspectorItem name="Repeat">
      <NumberParam
        type="float"
        value={ timeToDisplay( stateItem.repeat ) }
        onChange={ ( value ) => {
          channel.changeCurveRepeat( itemId, displayToTime( value ) );
        } }
        onSettle={ ( repeat, repeatPrev ) => {
          dispatch( {
            type: 'History/Push',
            description: 'Change Item Repeat',
            commands: [
              {
                type: 'channel/changeCurveRepeat',
                channel: channelName,
                item: itemId,
                repeat: displayToTime( repeat ),
                repeatPrev: displayToTime( repeatPrev ),
              }
            ]
          } );
        } }
      />
    </InspectorItem>

    <InspectorItem name="Speed">
      <NumberParam
        type="float"
        value={ stateItem.speed }
        onChange={ ( value ) => {
          channel.changeCurveSpeedAndOffset( itemId, value, stateItem.offset );
        } }
        onSettle={ ( speed, speedPrev ) => {
          dispatch( {
            type: 'History/Push',
            description: 'Change Item Speed',
            commands: [
              {
                type: 'channel/changeCurveSpeedAndOffset',
                channel: channelName,
                item: itemId,
                speed,
                speedPrev,
                offset: stateItem.offset,
                offsetPrev: stateItem.offset
              }
            ]
          } );
        } }
      />
    </InspectorItem>

    <InspectorItem name="Offset">
      <NumberParam
        type="float"
        value={ stateItem.offset }
        onChange={ ( value ) => {
          channel.changeCurveSpeedAndOffset( itemId, stateItem.speed, value );
        } }
        onSettle={ ( offset, offsetPrev ) => {
          dispatch( {
            type: 'History/Push',
            description: 'Change Item Offset',
            commands: [
              {
                type: 'channel/changeCurveSpeedAndOffset',
                channel: channelName,
                item: itemId,
                speed: stateItem.speed,
                speedPrev: stateItem.speed,
                offset,
                offsetPrev
              }
            ]
          } );
        } }
      />
    </InspectorItem>

    <InspectorItem name="Amp">
      <NumberParam
        type="float"
        value={ stateItem.amp }
        onChange={ ( value ) => {
          channel.changeCurveAmp( itemId, value );
        } }
        onSettle={ ( amp, ampPrev ) => {
          dispatch( {
            type: 'History/Push',
            description: 'Change Item Amp',
            commands: [
              {
                type: 'channel/changeCurveAmp',
                channel: channelName,
                item: itemId,
                amp,
                ampPrev
              }
            ]
          } );
        } }
      />
    </InspectorItem>
  </>;
};

// == styles =======================================================================================
const Root = styled.div`
`;

// == component ====================================================================================
interface Props {
  className?: string;
  item: {
    id: string;
    channel: string;
  };
}

const InspectorChannelItem = ( props: Props ): JSX.Element | null => {
  const { className } = props;
  const itemId = props.item.id;
  const channelName = props.item.channel;
  const dispatch = useDispatch();
  const { automaton, stateItem, useBeatInGUI } = useSelector( ( state ) => ( {
    automaton: state.automaton.instance,
    stateItem: state.automaton.channels[ channelName ]?.items[ itemId ], // TODO: noUncheckedIndexedAccess ???
    useBeatInGUI: state.automaton.guiSettings.useBeatInGUI,
  } ) );
  const channel = automaton?.getChannel( channelName ) ?? null;
  const { displayToTime, timeToDisplay } = useTimeUnit();

  return ( automaton && channel && stateItem && (
    <Root className={ className }>
      <InspectorHeader text={ 'Curve' } />

      <InspectorHr />

      <InspectorItem name={ useBeatInGUI ? 'Beat' : 'Time' }>
        <NumberParam
          type="float"
          value={ timeToDisplay( stateItem.time, true ) }
          onChange={ ( value ) => { channel.moveItem( itemId, displayToTime( value, true ) ); } }
          onSettle={ ( value, valuePrev ) => {
            dispatch( {
              type: 'History/Push',
              description: 'Change Item Time',
              commands: [
                {
                  type: 'channel/moveItem',
                  channel: channelName,
                  item: itemId,
                  time: displayToTime( value, true ),
                  timePrev: displayToTime( valuePrev, true ),
                }
              ]
            } );
          } }
        />
      </InspectorItem>

      <InspectorItem name="Length">
        <NumberParam
          type="float"
          value={ timeToDisplay( stateItem.length ) }
          onChange={ ( value ) => {
            channel.resizeItem( itemId, displayToTime( value ), 'repeat' );
          } }
          onSettle={ ( value, valuePrev ) => {
            dispatch( {
              type: 'History/Push',
              description: 'Change Item Length',
              commands: [
                {
                  type: 'channel/resizeItem',
                  channel: channelName,
                  item: itemId,
                  length: displayToTime( value ),
                  lengthPrev: displayToTime( valuePrev ),
                  mode: 'repeat',
                }
              ]
            } );
          } }
        />
      </InspectorItem>

      <InspectorItem name="Value">
        <NumberParam
          type="float"
          value={ stateItem.value }
          onChange={ ( value ) => {
            channel.changeItemValue( itemId, value );
          } }
          onSettle={ ( value, valuePrev ) => {
            dispatch( {
              type: 'History/Push',
              description: 'Change Constant Value',
              commands: [
                {
                  type: 'channel/changeItemValue',
                  channel: channelName,
                  item: itemId,
                  value,
                  valuePrev
                }
              ]
            } );
          } }
        />
      </InspectorItem>

      <InspectorItem name="Reset">
        <BoolParam
          value={ stateItem.reset }
          onChange={ ( reset ) => {
            channel.changeItemReset( itemId, reset );
          } }
          onSettle={ ( reset, resetPrev ) => {
            dispatch( {
              type: 'History/Push',
              description: 'Change Item Reset',
              commands: [
                {
                  type: 'channel/changeItemReset',
                  channel: channelName,
                  item: itemId,
                  reset,
                  resetPrev
                }
              ]
            } );
          } }
        />
      </InspectorItem>

      <InspectorChannelItemCurveParams
        channel={ channel }
        channelName={ channelName }
        stateItem={ stateItem }
        itemId={ itemId }
      />
    </Root>
  ) ) ?? null;
};

export { InspectorChannelItem };
