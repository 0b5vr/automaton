import { Colors } from '../constants/Colors';
import { ErrorBoundary } from './ErrorBoundary';
import { Icons } from '../icons/Icons';
import { InspectorBeat } from './InspectorBeat';
import { InspectorChannel } from './InspectorChannel';
import { InspectorChannelItem } from './InspectorChannelItem';
import { InspectorCurveFx } from './InspectorCurveFx';
import { InspectorCurveNode } from './InspectorCurveNode';
import { InspectorGeneral } from './InspectorGeneral';
import { InspectorLabel } from './InspectorLabel';
import { InspectorSnapping } from './InspectorSnapping';
import { InspectorStats } from './InspectorStats';
import { Metrics } from '../constants/Metrics';
import { Scrollable } from './Scrollable';
import { objectMapSize, objectMapValues } from '../utils/objectMap';
import { useSelector } from '../states/store';
import React from 'react';
import styled from 'styled-components';

// == styles =======================================================================================
const Logo = styled.img`
  position: absolute;
  fill: ${ Colors.black };
  left: ${ 0.15 * Metrics.inspectorWidth }px;
  top: calc( 50% - ${ 0.35 * Metrics.inspectorWidth }px );
  width: calc( ${ 0.7 * Metrics.inspectorWidth }px );
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
    stateSelectedChannel,
    stateSelectedTimelineItems,
    stateSelectedTimelineLabels,
    settingsMode,
    mode
  } = useSelector( ( state ) => ( {
    selectedCurve: state.curveEditor.selectedCurve,
    stateSelectedNodes: state.curveEditor.selected.nodes,
    stateSelectedFxs: state.curveEditor.selected.fxs,
    stateSelectedChannel: state.timeline.selectedChannel,
    stateSelectedTimelineItems: state.timeline.selected.items,
    stateSelectedTimelineLabels: state.timeline.selected.labels,
    settingsMode: state.settings.mode,
    mode: state.workspace.mode
  } ) );

  let content: JSX.Element | null = null;
  if ( settingsMode === 'snapping' ) {
    content = <InspectorSnapping />;
  } else if ( settingsMode === 'beat' ) {
    content = <InspectorBeat />;
  } else if ( settingsMode === 'general' ) {
    content = <InspectorGeneral />;
  } else if ( settingsMode === 'stats' ) {
    content = <InspectorStats />;
  } else if ( mode === 'curve' ) {
    if ( selectedCurve != null ) {
      if ( stateSelectedNodes.length === 1 ) {
        content = <InspectorCurveNode
          curveId={ selectedCurve }
          node={ stateSelectedNodes[ 0 ] }
        />;
      } else if ( stateSelectedFxs.length === 1 ) {
        content = <InspectorCurveFx
          curveId={ selectedCurve }
          fx={ stateSelectedFxs[ 0 ] }
        />;
      }
    }
  } else if ( mode === 'channel' || mode === 'dope' ) {
    if ( objectMapSize( stateSelectedTimelineItems ) === 1 ) {
      content = <InspectorChannelItem
        item={ objectMapValues( stateSelectedTimelineItems )[ 0 ] }
      />;
    } else if ( stateSelectedTimelineLabels.length === 1 ) {
      content = <InspectorLabel
        name={ stateSelectedTimelineLabels[ 0 ] }
      />;
    } else if ( stateSelectedChannel != null ) {
      content = <InspectorChannel
        channelName={ stateSelectedChannel }
      />;
    }
  }

  return <Root className={ className }>
    <ErrorBoundary>
      <StyledScrollable>
        <Container>
          { content }
        </Container>
      </StyledScrollable>
      { content == null && <Logo as={ Icons.AutomatonA } /> };
    </ErrorBoundary>
  </Root>;
};

export { Inspector };
