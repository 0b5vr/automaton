import React, { useContext } from 'react';
import { BezierNode } from '@fms-cat/automaton';
import { Colors } from '../constants/Colors';
import { Contexts } from '../contexts/Context';
import { NumberParam } from './NumberParam';
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
export interface InspectorNodeProps {
  className?: string;
  node: BezierNode & WithID;
}

export const InspectorNode = ( { className, node }: InspectorNodeProps ): JSX.Element => {
  const contexts = useContext( Contexts.Store );
  const automaton = contexts.state.automaton.instance;
  const { selectedParam } = contexts.state.curveEditor;
  const param = automaton && selectedParam && automaton.getParam( selectedParam ) || null;

  return <>
    { param && (
      <Root className={ className }>
        <Header>Node</Header>

        <Hr />

        <Item>
          <StyledLabel>Time</StyledLabel>
          <NumberParam
            type="float"
            value={ node.time }
            onChange={ ( value ) => { param.moveNodeTime( node.$id, value ); } }
            historyDescription="Change Node Time"
          />
        </Item>
        <Item>
          <StyledLabel>Value</StyledLabel>
          <NumberParam
            type="float"
            value={ node.value }
            onChange={ ( value ) => { param.moveNodeValue( node.$id, value ); } }
            historyDescription="Change Node Value"
          />
        </Item>

        <Hr />

        <Item>
          <StyledLabel>In Time</StyledLabel>
          <NumberParam
            type="float"
            value={ node.in?.time || 0.0 }
            onChange={ ( value ) => { param.moveHandleTime( node.$id, 'in', value ); } }
            historyDescription="Change Node Handle Time"
          />
        </Item>
        <Item>
          <StyledLabel>In Value</StyledLabel>
          <NumberParam
            type="float"
            value={ node.in?.value || 0.0 }
            onChange={ ( value ) => { param.moveHandleValue( node.$id, 'in', value ); } }
            historyDescription="Change Node Handle Value"
          />
        </Item>

        <Hr />

        <Item>
          <StyledLabel>Out Time</StyledLabel>
          <NumberParam
            type="float"
            value={ node.out?.time || 0.0 }
            onChange={ ( value ) => { param.moveHandleTime( node.$id, 'out', value ); } }
            historyDescription="Change Node Handle Time"
          />
        </Item>
        <Item>
          <StyledLabel>Out Value</StyledLabel>
          <NumberParam
            type="float"
            value={ node.out?.value || 0.0 }
            onChange={ ( value ) => { param.moveHandleValue( node.$id, 'out', value ); } }
            historyDescription="Change Node Handle Value"
          />
        </Item>
      </Root>
    ) }
  </>;
};
