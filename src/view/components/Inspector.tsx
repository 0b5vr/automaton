import React, { useContext } from 'react';
import { Colors } from '../constants/Colors';
import { Contexts } from '../contexts/Context';
import { Icons } from '../icons/Icons';
import { InspectorFx } from './InspectorFx';
import { InspectorNode } from './InspectorNode';
import { Metrics } from '../constants/Metrics';
import { Scrollable } from './Scrollable';
import styled from 'styled-components';

// == styles =======================================================================================
const Logo = styled.img`
  position: absolute;
  fill: ${ Colors.black };
  left: calc( 0.15 * ${ Metrics.inspectorWidth } );
  top: calc( 50% - 0.35 * ${ Metrics.inspectorWidth } );
  width: calc( 0.7 * ${ Metrics.inspectorWidth } );
  opacity: 0.2;
`;

const Container = styled.div`
  padding: 0.5rem 1rem;
`;

const StyledScrollable = styled( Scrollable )`
  width: 100%;
  height: 100%;
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
  const { selectedParam } = contexts.state.curveEditor;

  const selectedNodes = contexts.state.curveEditor.selectedItems.nodes.map( ( id ) => {
    return contexts.state.automaton.params[ selectedParam! ].nodes[ id ];
  } );
  const selectedFxs = contexts.state.curveEditor.selectedItems.fxs.map( ( id ) => {
    return contexts.state.automaton.params[ selectedParam! ].fxs[ id ];
  } );
  const isSelectingANode = selectedNodes.length === 1 && selectedFxs.length === 0;
  const isSelectingAFx = selectedNodes.length === 0 && selectedFxs.length === 1;
  const isSelectingNothing = ( selectedNodes.length === 0 ) && ( selectedFxs.length === 0 );

  return <Root className={ className }>
    <StyledScrollable>
      <Container>
        { isSelectingANode && <InspectorNode
          node={ selectedNodes[ 0 ] }
        /> }
        { isSelectingAFx && <InspectorFx
          fx={ selectedFxs[ 0 ] }
        /> }
      </Container>
    </StyledScrollable>
    { isSelectingNothing && <Logo as={ Icons.AutomatonA } /> }
  </Root>;
};
