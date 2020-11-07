import { Colors } from '../constants/Colors';
import { Icons } from '../icons/Icons';
import { Metrics } from '../constants/Metrics';
import { useDispatch, useSelector } from '../states/store';
import React, { useCallback } from 'react';
import styled from 'styled-components';

// == styles =======================================================================================
const Button = styled.img<{ active?: boolean }>`
  width: calc( ${ Metrics.modeSelectorWidth }px );
  height: calc( ${ Metrics.modeSelectorWidth }px );
  padding: 6px;
  margin: 2px 0;
  fill: ${ ( { active } ) => active ? Colors.accent : Colors.fore };
  cursor: pointer;

  &:hover {
    fill: ${ ( { active } ) => active ? Colors.accentdark : Colors.foredark };
  }
`;

const Root = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background: ${ Colors.back3 };
`;

// == component ====================================================================================
const ModeSelector = ( props: {
  className?: string;
} ): JSX.Element => {
  const { className } = props;
  const dispatch = useDispatch();
  const { mode } = useSelector( ( state ) => ( {
    mode: state.workspace.mode
  } ) );

  const handleClickDopeSheet = useCallback(
    () => {
      dispatch( {
        type: 'Workspace/ChangeMode',
        mode: 'dope'
      } );
    },
    [ dispatch ]
  );

  const handleClickChannel = useCallback(
    () => {
      dispatch( {
        type: 'Workspace/ChangeMode',
        mode: 'channel'
      } );

      dispatch( {
        type: 'Timeline/UnselectItemsOfOtherChannels',
        mode: 'channel'
      } );
    },
    [ dispatch ]
  );

  const handleClickCurve = useCallback(
    () => {
      dispatch( {
        type: 'Workspace/ChangeMode',
        mode: 'curve'
      } );
    },
    [ dispatch ]
  );

  return <Root className={ className }>
    <Button as={ Icons.DopeSheet }
      onClick={ handleClickDopeSheet }
      active={ ( mode === 'dope' ? 1 : 0 ) as any as boolean }
      data-stalker={ 'Dope Sheet' }
    />
    <Button as={ Icons.Channel }
      onClick={ handleClickChannel }
      active={ ( mode === 'channel' ? 1 : 0 ) as any as boolean }
      data-stalker={ 'Channel Editor' }
    />
    <Button as={ Icons.Curve }
      onClick={ handleClickCurve }
      active={ ( mode === 'curve' ? 1 : 0 ) as any as boolean }
      data-stalker={ 'Curve Editor' }
    />
  </Root>;
};

export { ModeSelector };
