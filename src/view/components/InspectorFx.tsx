import { BoolParam } from './BoolParam';
import { CHANNEL_FX_ROW_MAX } from '../../ChannelWithGUI';
import { FxSection } from '@fms-cat/automaton';
import { InspectorHeader } from './InspectorHeader';
import { InspectorHr } from './InspectorHr';
import { InspectorItem } from './InspectorItem';
import { NumberParam } from './NumberParam';
import React from 'react';
import { State } from '../states/store';
import { WithID } from '../../types/WithID';
import styled from 'styled-components';
import { useSelector } from 'react-redux';

// == styles =======================================================================================
const Root = styled.div`
`;

// == element ======================================================================================
export interface InspectorFxProps {
  className?: string;
  fx: FxSection & WithID;
}

export const InspectorFx = ( { className, fx }: InspectorFxProps ): JSX.Element => {
  const automaton = useSelector( ( state: State ) => state.automaton.instance );
  const selectedChannel = useSelector( ( state: State ) => state.curveEditor.selectedChannel );
  const channel = automaton && selectedChannel && automaton.getChannel( selectedChannel ) || null;

  return <>
    { automaton && channel && (
      <Root className={ className }>
        <InspectorHeader text={ `Fx: ${ automaton.getFxDefinitionName( fx.def ) }` } />

        <InspectorHr />

        <InspectorItem name="Time">
          <NumberParam
            type="float"
            value={ fx.time }
            onChange={ ( value ) => { channel.moveFx( fx.$id, value ); } }
            historyDescription="Change Fx Time"
          />
        </InspectorItem>
        <InspectorItem name="Length">
          <NumberParam
            type="float"
            value={ fx.length }
            onChange={ ( value ) => { channel.resizeFx( fx.$id, value ); } }
            historyDescription="Change Fx Length"
          />
        </InspectorItem>
        <InspectorItem name="Row">
          <NumberParam
            type="int"
            value={ fx.row }
            onChange={ ( value ) => {
              channel.changeFxRow(
                fx.$id,
                Math.min( Math.max( value, 0.0 ), CHANNEL_FX_ROW_MAX - 1 )
              );
            } }
            historyDescription="Change Fx Row"
          />
        </InspectorItem>
        <InspectorItem name="Bypass">
          <BoolParam
            value={ !!fx.bypass }
            onChange={ ( value ) => {
              channel.bypassFx( fx.$id, value );
            } }
            historyDescription="Toggle Fx Bypass"
          />
        </InspectorItem>

        <InspectorHr />

        { Object.entries( automaton.getFxDefinitionParams( fx.def )! )
        .map( ( [ name, fxParam ] ) => (
          <InspectorItem name={ fxParam.name || name } key={ name }>
            <>
              { ( fxParam.type === 'float' || fxParam.type === 'int' ) && (
                <NumberParam
                  type={ fxParam.type }
                  value={ fx.params[ name ] }
                  onChange={ ( value ) => {
                    channel.changeFxParam( fx.$id, name, value );
                  } }
                  historyDescription="Change Fx Param"
                />
              ) }
              { ( fxParam.type === 'boolean' ) && (
                <BoolParam
                  value={ fx.params[ name ] }
                  onChange={ ( value ) => {
                    channel.changeFxParam( fx.$id, name, value );
                  } }
                  historyDescription="Change Fx Param"
                />
              ) }
            </>
          </InspectorItem>
        ) ) }
      </Root>
    ) }
  </>;
};
