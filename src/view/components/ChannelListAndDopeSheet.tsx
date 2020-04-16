import { ChannelList } from './ChannelList';
import { DopeSheet } from './DopeSheet';
import { DopeSheetOverlay } from './DopeSheetOverlay';
import { DopeSheetUnderlay } from './DopeSheetUnderlay';
import { Metrics } from '../constants/Metrics';
import React from 'react';
import { Scrollable } from './Scrollable';
import styled from 'styled-components';
import { useSelector } from '../states/store';

// == styles =======================================================================================
const StyledChannelList = styled( ChannelList )`
  width: ${ Metrics.channelListWidth - 4 }px;
  margin: 0 2px;
`;

const StyledDopeSheet = styled( DopeSheet )`
  width: calc( 100% - ${ Metrics.channelListWidth }px );
  flex-grow: 1;
`;

const StyledDopeSheetUnderlay = styled( DopeSheetUnderlay )`
  position: absolute;
  width: calc( 100% - ${ Metrics.channelListWidth }px );
  height: 100%;
  left: ${ Metrics.channelListWidth }px;
  top: 0;
`;

const StyledDopeSheetOverlay = styled( DopeSheetOverlay )`
  position: absolute;
  width: calc( 100% - ${ Metrics.channelListWidth }px );
  height: 100%;
  left: ${ Metrics.channelListWidth }px;
  top: 0;
  pointer-events: none;
`;

const ChannelListAndDopeSheetContainer = styled.div`
  display: flex;
  padding-bottom: 4px;
`;

const ChannelListAndDopeSheetScrollable = styled( Scrollable )`
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
`;

const Root = styled.div`
`;

// == component ====================================================================================
const ChannelListAndDopeSheet = ( props: {
  className?: string;
} ): JSX.Element => {
  const {
    selectedChannel,
    selectedCurve
  } = useSelector( ( state ) => ( {
    selectedChannel: state.timeline.selectedChannel,
    selectedCurve: state.curveEditor.selectedCurve
  } ) );

  const realm: 'dopeSheet' | 'timeline' | 'curveEditor' = (
    selectedCurve != null ? 'curveEditor' :
    selectedChannel != null ? 'timeline' :
    'dopeSheet'
  );

  const shouldShowChannelList = realm === 'dopeSheet' || realm === 'timeline';

  const { className } = props;

  return (
    <Root className={ className }>
      { realm === 'dopeSheet' && <StyledDopeSheetUnderlay /> }
      <ChannelListAndDopeSheetScrollable barPosition='left'>
        <ChannelListAndDopeSheetContainer>
          { shouldShowChannelList && <StyledChannelList /> }
          { realm === 'dopeSheet' && <StyledDopeSheet /> }
        </ChannelListAndDopeSheetContainer>
      </ChannelListAndDopeSheetScrollable>
      { realm === 'dopeSheet' && <StyledDopeSheetOverlay /> }
    </Root>
  );
};

export { ChannelListAndDopeSheet };
