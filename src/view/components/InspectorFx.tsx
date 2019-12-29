import React, { useContext } from 'react';
import { BoolParam } from './BoolParam';
import { Colors } from '../constants/Colors';
import { Contexts } from '../contexts/Context';
import { FxSection } from '@fms-cat/automaton';
import { NumberParam } from './NumberParam';
import { PARAM_FX_ROW_MAX } from '../../ParamWithGUI';
import { WithID } from '../../types/WithID';
import styled from 'styled-components';

// == styles =======================================================================================
const Header = styled.div`
  color: ${ Colors.accent };
`;

const Item = styled.div`
  display: flex;
  justify-content: space-between;
  margin: 0.125em 0;
`;

const StyledLabel = styled.div`
  margin: 0.15rem;
  font-size: 0.7rem;
  line-height: 1em;
`;

const Hr = styled.div`
  margin: 0.125em 0;
  height: 0.125em;
  width: 100%;
  background: ${ Colors.back3 };
`;

const Root = styled.div`
  overflow: hidden;
  background: ${ Colors.back2 };
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
        <Header>Fx: { automaton.getFxDefinitionName( fx.def ) }</Header>

        <Hr />

        <Item>
          <StyledLabel>Time</StyledLabel>
          <NumberParam
            type="float"
            value={ fx.time }
            onChange={ ( value ) => { param.moveFx( fx.$id, value ); } }
            historyDescription="Change Fx Time"
          />
        </Item>
        <Item>
          <StyledLabel>Row</StyledLabel>
          <NumberParam
            type="int"
            value={ fx.row }
            onChange={ ( value ) => {
              param.changeFxRow( fx.$id, Math.min( Math.max( value, 0.0 ), PARAM_FX_ROW_MAX - 1 ) );
            } }
            historyDescription="Change Fx Row"
          />
        </Item>
        <Item>
          <StyledLabel>Bypass</StyledLabel>
          <BoolParam
            value={ !!fx.bypass }
            onChange={ ( value ) => {
              param.bypassFx( fx.$id, value );
            } }
            historyDescription="Toggle Fx Bypass"
          />
        </Item>

        <Hr />
      </Root>
    ) }
  </>;
};
