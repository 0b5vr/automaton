import { InspectorHeader } from './InspectorHeader';
import { InspectorHr } from './InspectorHr';
import { InspectorItem } from './InspectorItem';
import { NumberParam } from './NumberParam';
import { useDispatch, useSelector } from '../states/store';
import React from 'react';
import styled from 'styled-components';

// == styles =======================================================================================
const Root = styled.div`
`;

// == component ====================================================================================
interface Props {
  className?: string;
  channelName: string;
}

const InspectorChannel = ( props: Props ): JSX.Element | null => {
  const { className, channelName } = props;
  const dispatch = useDispatch();
  const { automaton, stateChannel } = useSelector( ( state ) => ( {
    automaton: state.automaton.instance,
    stateChannel: state.automaton.channels[ channelName ],
  } ) );
  const channel = automaton?.getChannel( channelName ) ?? null;

  if (
    automaton == null ||
    channel == null
  ) {
    return null;
  }

  return (
    <Root className={ className }>
      <InspectorHeader text={ `Channel: ${ channelName }` } />

      <InspectorHr />

      <InspectorItem name="Init">
        <NumberParam
          type="float"
          value={ stateChannel.init }
          onChange={ ( value ) => channel.changeInit( value ) }
          onSettle={ ( value, valuePrev ) => {
            dispatch( {
              type: 'History/Push',
              description: 'Change Channel Init',
              commands: [
                {
                  type: 'channel/changeInit',
                  channel: channelName,
                  init: value,
                  initPrev: valuePrev,
                }
              ],
            } );
          } }
        />
      </InspectorItem>
    </Root>
  );
};

export { InspectorChannel };
