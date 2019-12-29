import { InspectorHeader, InspectorHr, InspectorItem, InspectorLabel } from './InspectorComponents';
import React, { useContext } from 'react';
import { BoolParam } from './BoolParam';
import { Contexts } from '../contexts/Context';
import { FxSection } from '@fms-cat/automaton';
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
  const contexts = useContext( Contexts.Store );
  const automaton = contexts.state.automaton.instance;
  const { selectedParam } = contexts.state.curveEditor;
  const param = automaton && selectedParam && automaton.getParam( selectedParam ) || null;

  return <>
    { automaton && param && (
      <Root className={ className }>
        <InspectorHeader>Fx: { automaton.getFxDefinitionName( fx.def ) }</InspectorHeader>

        <InspectorHr />

        <InspectorItem>
          <InspectorLabel>Time</InspectorLabel>
          <NumberParam
            type="float"
            value={ fx.time }
            onChange={ ( value ) => { param.moveFx( fx.$id, value ); } }
            historyDescription="Change Fx Time"
          />
        </InspectorItem>
        <InspectorItem>
          <InspectorLabel>Row</InspectorLabel>
          <NumberParam
            type="int"
            value={ fx.row }
            onChange={ ( value ) => {
              param.changeFxRow( fx.$id, Math.min( Math.max( value, 0.0 ), PARAM_FX_ROW_MAX - 1 ) );
            } }
            historyDescription="Change Fx Row"
          />
        </InspectorItem>
        <InspectorItem>
          <InspectorLabel>Bypass</InspectorLabel>
          <BoolParam
            value={ !!fx.bypass }
            onChange={ ( value ) => {
              param.bypassFx( fx.$id, value );
            } }
            historyDescription="Toggle Fx Bypass"
          />
        </InspectorItem>

        <InspectorHr />
      </Root>
    ) }
  </>;
};
