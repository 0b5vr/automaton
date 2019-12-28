import React, { useContext } from 'react';
import { Colors } from '../constants/Colors';
import { Contexts } from '../contexts/Context';
import { Icons } from '../icons/Icons';
import { Metrics } from '../constants/Metrics';
import { ParamBox } from './ParamBox';
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
  margin: 0.1rem;
  font-size: 0.8rem;
  line-height: 1em;
`;

const Hr = styled.div`
  margin: 0.125em 0;
  height: 0.125em;
  width: 100%;
  background: ${ Colors.back3 };
`;

const Logo = styled.img`
  position: absolute;
  fill: ${ Colors.back3 };
  left: calc( 0.15 * ${ Metrics.inspectorWidth } );
  top: calc( 50% - 0.35 * ${ Metrics.inspectorWidth } );
  width: calc( 0.7 * ${ Metrics.inspectorWidth } );
`;

const Container = styled.div`
  padding: 0.5rem 1rem;
`;

const Root = styled.div`
  overflow: hidden;
  background: ${ Colors.back2 };
`;

// == element ======================================================================================
export interface InspectorProps {
  className?: string;
}

export const Inspector = ( { className }: InspectorProps ): JSX.Element => {
  const contexts = useContext( Contexts.Store );
  const automaton = contexts.state.automaton.instance;
  const { selectedParam } = contexts.state.curveEditor;
  const param = automaton && selectedParam && automaton.getParam( selectedParam ) || null;

  const selectedNodes = contexts.state.curveEditor.selectedItems.nodes.map( ( id ) => {
    return contexts.state.automaton.params[ selectedParam! ].nodes[ id ];
  } );
  const selectedFxs = contexts.state.curveEditor.selectedItems.fxs.map( ( id ) => {
    return contexts.state.automaton.params[ selectedParam! ].fxs[ id ];
  } );
  const isSelectingNothing = ( selectedNodes.length === 0 ) && ( selectedFxs.length === 0 );

  return <Root className={ className }>
    <Container>
      { selectedNodes.length === 1 && ( () => {
        const node = selectedNodes[ 0 ];

        return <>
          <Header>Node</Header>

          <Hr />

          <Item>
            <StyledLabel>Time</StyledLabel>
            <ParamBox
              type="float"
              value={ node.time }
              onChange={ ( value ) => { param?.moveNodeTime( node.$id, value ); } }
            />
          </Item>
          <Item>
            <StyledLabel>Value</StyledLabel>
            <ParamBox
              type="float"
              value={ node.value }
              onChange={ ( value ) => { param?.moveNodeValue( node.$id, value ); } }
            />
          </Item>

          <Hr />

          <Item>
            <StyledLabel>In Time</StyledLabel>
            <ParamBox
              type="float"
              value={ node.in?.time || 0.0 }
              onChange={ ( value ) => { param?.moveHandleTime( node.$id, 'in', value ); } }
            />
          </Item>
          <Item>
            <StyledLabel>In Value</StyledLabel>
            <ParamBox
              type="float"
              value={ node.in?.value || 0.0 }
              onChange={ ( value ) => { param?.moveHandleValue( node.$id, 'in', value ); } }
            />
          </Item>

          <Hr />

          <Item>
            <StyledLabel>Out Time</StyledLabel>
            <ParamBox
              type="float"
              value={ node.out?.time || 0.0 }
              onChange={ ( value ) => { param?.moveHandleTime( node.$id, 'out', value ); } }
            />
          </Item>
          <Item>
            <StyledLabel>Out Value</StyledLabel>
            <ParamBox
              type="float"
              value={ node.out?.value || 0.0 }
              onChange={ ( value ) => { param?.moveHandleValue( node.$id, 'out', value ); } }
            />
          </Item>
        </>;
      } )() }
    </Container>
    { isSelectingNothing && <Logo as={ Icons.AutomatonA } /> }
  </Root>;
};
