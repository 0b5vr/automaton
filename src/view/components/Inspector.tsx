import { Colors } from '../constants/Colors';
import { Icons } from '../icons/Icons';
import { InspectorChannelItem } from './InspectorChannelItem';
import { InspectorCurveFx } from './InspectorCurveFx';
import { InspectorCurveNode } from './InspectorCurveNode';
import { InspectorGeneral } from './InspectorGeneral';
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

// == component ====================================================================================
const Inspector = ( { className }: {
  className?: string;
} ): JSX.Element => {
  const {
    selectedCurve,
    stateSelectedNodes,
    stateSelectedFxs,
    stateSelectedTimelineItems
  } = useSelector( ( state: State ) => ( {
    selectedCurve: state.curveEditor.selectedCurve,
    stateSelectedNodes: state.curveEditor.selectedItems.nodes,
    stateSelectedFxs: state.curveEditor.selectedItems.fxs,
    stateSelectedTimelineItems: state.timeline.selectedItems
  } ) );
  const stateCurve = useSelector(
    ( state: State ) => state.automaton.curves[ selectedCurve! ]
  );
  const settingsMode = useSelector( ( state: State ) => state.settings.mode );

  let content: JSX.Element | null = null;
  if ( settingsMode === 'snapping' ) {
    content = <InspectorSnapping />;
  } else if ( settingsMode === 'general' ) {
    content = <InspectorGeneral />;
  } else if ( stateSelectedNodes.length === 1 ) {
    content = <InspectorCurveNode node={ stateCurve.nodes[ 0 ] } />;
  } else if ( stateSelectedFxs.length === 1 ) {
    content = <InspectorCurveFx fx={ stateCurve.fxs[ 0 ] } />;
  } else if ( stateSelectedTimelineItems.size === 1 ) {
    content = <InspectorChannelItem
      item={ Array.from( stateSelectedTimelineItems.values() )[ 0 ] }
    />;
  }

  return <Root className={ className }>
    <StyledScrollable>
      <Container>
        { content }
      </Container>
    </StyledScrollable>
    { content == null && <Logo as={ Icons.AutomatonA } /> };
  </Root>;
};

export { Inspector };
