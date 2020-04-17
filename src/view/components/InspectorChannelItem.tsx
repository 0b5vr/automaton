import { ChannelWithGUI } from '../../ChannelWithGUI';
import { InspectorHeader } from './InspectorHeader';
import { InspectorHr } from './InspectorHr';
import { InspectorItem } from './InspectorItem';
import { NumberParam } from './NumberParam';
import React from 'react';
import { SerializedChannelItem } from '@fms-cat/automaton';
import { WithID } from '../../types/WithID';
import styled from 'styled-components';
import { useSelector } from '../states/store';

// == microcomponents ==============================================================================
interface Props {
}

const InspectorChannelItemCurveParams = ( props: {
  channel: ChannelWithGUI;
  stateItem: Required<SerializedChannelItem> & WithID;
  itemId: string;
} ): JSX.Element => {
  if ( props.stateItem.curve == null ) { return <></>; }

  const { channel, itemId } = props;
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
        historyDescription="Change Curve Speed"
      />
    </InspectorItem>

    <InspectorItem name="Offset">
      <NumberParam
        type="float"
        value={ stateItem.offset }
        onChange={ ( value ) => {
          channel.changeCurveSpeedAndOffset( itemId, stateItem.speed, value );
        } }
        historyDescription="Change Curve Offset"
      />
    </InspectorItem>

    <InspectorItem name="Amp">
      <NumberParam
        type="float"
        value={ stateItem.amp }
        onChange={ ( value ) => {
          channel.changeCurveAmp( itemId, value );
        } }
        historyDescription="Change Curve Amp"
      />
    </InspectorItem>
  </>;
};

const InspectorChannelItemConstantParams = ( props: {
  channel: ChannelWithGUI;
  stateItem: Required<SerializedChannelItem> & WithID;
  itemId: string;
} ): JSX.Element => {
  if ( props.stateItem.curve != null ) { return <></>; }

  const { channel, itemId } = props;
  const stateItem = props.stateItem;

  return <>
    <InspectorHr />

    <InspectorItem name="Value">
      <NumberParam
        type="float"
        value={ stateItem.value }
        onChange={ ( value ) => {
          channel.changeItemValue( itemId, value );
        } }
        historyDescription="Change Constant Value"
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
            historyDescription="Change Item Time"
          />
        </InspectorItem>

        <InspectorItem name="Length">
          <NumberParam
            type="float"
            value={ stateItem.length }
            onChange={ ( value ) => { channel.resizeItem( itemId, value ); } }
            historyDescription="Change Item Length"
          />
        </InspectorItem>

        <InspectorItem name="Value">
          <NumberParam
            type="float"
            value={ stateItem.value }
            onChange={ ( value ) => {
              channel.changeItemValue( itemId, value );
            } }
            historyDescription="Change Constant Value"
          />
        </InspectorItem>

        <InspectorChannelItemCurveParams
          channel={ channel }
          stateItem={ stateItem }
          itemId={ itemId }
        />
        <InspectorChannelItemConstantParams
          channel={ channel }
          stateItem={ stateItem }
          itemId={ itemId }
        />
      </Root>
    ) }
  </>;
};

export { InspectorChannelItem };
