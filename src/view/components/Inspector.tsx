import { Colors } from '../constants/Colors';
import { Icons } from '../icons/Icons';
import { InspectorFx } from './InspectorFx';
import { InspectorGeneral } from './InspectorGeneral';
import { InspectorNode } from './InspectorNode';
import { InspectorSnapping } from './InspectorSnapping';
import { Metrics } from '../constants/Metrics';
import React from 'react';
import { Scrollable } from './Scrollable';
import { State } from '../states/store';
import styled from 'styled-components';
import { useSelector } from 'react-redux';

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
  const selectedParam = useSelector( ( state: State ) => state.curveEditor.selectedParam );
  const stateSelectedNodes
    = useSelector( ( state: State ) => state.curveEditor.selectedItems.nodes );
  const stateSelectedFxs = useSelector( ( state: State ) => state.curveEditor.selectedItems.fxs );
  const stateParam = useSelector( ( state: State ) => state.automaton.params[ selectedParam! ] );
  const settingsMode = useSelector( ( state: State ) => state.settings.mode );

  const selectedNodes = stateSelectedNodes.map( ( id ) => {
    return stateParam.nodes[ id ];
  } );
  const selectedFxs = stateSelectedFxs.map( ( id ) => {
    return stateParam.fxs[ id ];
  } );
  const isSelectingANode = selectedNodes.length === 1 && selectedFxs.length === 0;
  const isSelectingAFx = selectedNodes.length === 0 && selectedFxs.length === 1;
  const isSelectingNothing = (
    settingsMode === 'none' &&
    ( selectedNodes.length === 0 ) &&
    ( selectedFxs.length === 0 )
  );

  return <Root className={ className }>
    <StyledScrollable>
      <Container>
        { settingsMode === 'snapping' && <InspectorSnapping /> }
        { settingsMode === 'general' && <InspectorGeneral /> }
        { settingsMode === 'none' && <>
          { isSelectingANode && <InspectorNode
            node={ selectedNodes[ 0 ] }
          /> }
          { isSelectingAFx && <InspectorFx
            fx={ selectedFxs[ 0 ] }
          /> }
        </> }
      </Container>
    </StyledScrollable>
    { isSelectingNothing && <Logo as={ Icons.AutomatonA } /> }
  </Root>;
};
