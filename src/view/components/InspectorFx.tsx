import React, { useContext } from 'react';
import { BoolParam } from './BoolParam';
import { Contexts } from '../contexts/Context';
import { FxSection } from '@fms-cat/automaton';
import { InspectorHeader } from './InspectorHeader';
import { InspectorHr } from './InspectorHr';
import { InspectorItem } from './InspectorItem';
import { NumberParam } from './NumberParam';
import { PARAM_FX_ROW_MAX } from '../../ParamWithGUI';
import { WithID } from '../../types/WithID';
import styled from 'styled-components';

// == styles =======================================================================================
const Root = styled.div`
`;

// == element ======================================================================================
export interface InspectorFxProps {
  className?: string;
  fx: FxSection & WithID;
}

export const InspectorFx = ( { className, fx }: InspectorFxProps ): JSX.Element => {
  const { state } = useContext( Contexts.Store );
  const automaton = state.automaton.instance;
  const { selectedParam } = state.curveEditor;
  const param = automaton && selectedParam && automaton.getParam( selectedParam ) || null;

  return <>
    { automaton && param && (
      <Root className={ className }>
        <InspectorHeader text={ `Fx: ${ automaton.getFxDefinitionName( fx.def ) }` } />

        <InspectorHr />

        <InspectorItem name="Time">
          <NumberParam
            type="float"
            value={ fx.time }
            onChange={ ( value ) => { param.moveFx( fx.$id, value ); } }
            historyDescription="Change Fx Time"
          />
        </InspectorItem>
        <InspectorItem name="Length">
          <NumberParam
            type="float"
            value={ fx.length }
            onChange={ ( value ) => { param.resizeFx( fx.$id, value ); } }
            historyDescription="Change Fx Length"
          />
        </InspectorItem>
        <InspectorItem name="Row">
          <NumberParam
            type="int"
            value={ fx.row }
            onChange={ ( value ) => {
              param.changeFxRow( fx.$id, Math.min( Math.max( value, 0.0 ), PARAM_FX_ROW_MAX - 1 ) );
            } }
            historyDescription="Change Fx Row"
          />
        </InspectorItem>
        <InspectorItem name="Bypass">
          <BoolParam
            value={ !!fx.bypass }
            onChange={ ( value ) => {
              param.bypassFx( fx.$id, value );
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
                    param.changeFxParam( fx.$id, name, value );
                  } }
                  historyDescription="Change Fx Param"
                />
              ) }
              { ( fxParam.type === 'boolean' ) && (
                <BoolParam
                  value={ fx.params[ name ] }
                  onChange={ ( value ) => {
                    param.changeFxParam( fx.$id, name, value );
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
