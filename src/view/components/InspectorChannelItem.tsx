import { useDispatch, useSelector } from '../states/store';
import { BoolParam } from './BoolParam';
import { ChannelWithGUI } from '../../ChannelWithGUI';
import { InspectorHeader } from './InspectorHeader';
import { InspectorHr } from './InspectorHr';
import { InspectorItem } from './InspectorItem';
import { NumberParam } from './NumberParam';
import React from 'react';
import { SerializedChannelItem } from '@fms-cat/automaton';
import { WithID } from '../../types/WithID';
import styled from 'styled-components';

// == microcomponents ==============================================================================
interface Props {
}

const InspectorChannelItemCurveParams = ( props: {
  channel: ChannelWithGUI;
  channelName: string;
  stateItem: Required<SerializedChannelItem> & WithID;
  itemId: string;
} ): JSX.Element => {
  const dispatch = useDispatch();

  if ( props.stateItem.curve == null ) { return <></>; }

  const { channel, channelName, itemId } = props;
  const stateItem = props.stateItem;

  return <>
    <InspectorHr />

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

const InspectorChannelItem = ( props: Props ): JSX.Element => {
  const { className } = props;
  const itemId = props.item.id;
  const channelName = props.item.channel;
  const dispatch = useDispatch();
  const { automaton, stateItem } = useSelector( ( state ) => ( {
    automaton: state.automaton.instance,
    stateItem: state.automaton.channels[ channelName ].items[ itemId ]
  } ) );
  const channel = automaton?.getChannel( channelName ) || null;

  return <>
    { automaton && channel && (
      <Root className={ className }>
        <InspectorHeader text={ 'Curve' } />

        <InspectorHr />

        <InspectorItem name="Time">
          <NumberParam
            type="float"
            value={ stateItem.time }
            onChange={ ( value ) => { channel.moveItem( itemId, value ); } }
            onSettle={ ( time, timePrev ) => {
              dispatch( {
                type: 'History/Push',
                description: 'Change Item Time',
                commands: [
                  {
                    type: 'channel/moveItem',
                    channel: channelName,
                    item: itemId,
                    time,
                    timePrev
                  }
                ]
              } );
            } }
          />
        </InspectorItem>

        <InspectorItem name="Length">
          <NumberParam
            type="float"
            value={ stateItem.length }
            onChange={ ( value ) => { channel.resizeItem( itemId, value ); } }
            onSettle={ ( length, lengthPrev ) => {
              dispatch( {
                type: 'History/Push',
                description: 'Change Item Length',
                commands: [
                  {
                    type: 'channel/resizeItem',
                    channel: channelName,
                    item: itemId,
                    length,
                    lengthPrev
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
    ) }
  </>;
};

export { InspectorChannelItem };
