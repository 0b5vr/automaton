import { useDispatch, useSelector } from '../states/store';
import { Colors } from '../constants/Colors';
import React from 'react';
import { registerMouseEvent } from '../utils/registerMouseEvent';
import styled from 'styled-components';

// == microcomponent ===============================================================================
const CurrentTime = ( { className }: { className?: string } ): JSX.Element => {
  const time = useSelector( ( state ) => state.automaton.time );
  return (
    <span className={ className }>
      { time.toFixed( 3 ) }
    </span>
  );
};

const BarFG = ( { className }: { className?: string } ): JSX.Element => {
  const { time, length } = useSelector( ( state ) => ( {
    time: state.automaton.time,
    length: state.automaton.length
  } ) );
  const progress = time / length;

  return (
    <div
      className={ className }
      style={ { width: progress * 100.0 + '%' } }
    />
  );
};

// == styles =======================================================================================
const StyledCurrentTime = styled( CurrentTime )`
  font-size: 0.8rem;
  pointer-events: none;
`;

const TotalTime = styled.span`
  font-size: 0.6rem;
  pointer-events: none;
`;

const BarBG = styled.div`
  position: absolute;
  bottom: 0.25rem;
  height: 0.125rem;
  width: 100%;
  background: ${ Colors.back1 };
  pointer-events: none;
`;

const StyledBarFG = styled( BarFG )<{ isSeeking: boolean; isHovering: boolean }>`
  position: absolute;
  bottom: 0.25rem;
  height: 0.125rem;
  background: ${ ( { isSeeking, isHovering } ) => (
    isSeeking ? Colors.accentdark : isHovering ? Colors.accent : Colors.fore
  ) };
  pointer-events: none;
`;

const Root = styled.div`
  text-align: right;
  position: relative;
  cursor: pointer;
`;

// == component ====================================================================================
export interface HeaderSeekbarProps {
  className?: string;
}

const HeaderSeekbar = ( { className }: HeaderSeekbarProps ): JSX.Element => {
  const dispatch = useDispatch();
  const {
    automaton,
    length,
    isSeeking,
    isSeekbarHovered
  } = useSelector( ( state ) => ( {
    automaton: state.automaton.instance,
    length: state.automaton.length,
    isSeeking: state.header.isSeeking,
    isSeekbarHovered: state.header.isSeekbarHovered
  } ) );

  function handleMouseDown( event: React.MouseEvent ): void {
    event.preventDefault();

    if ( event.buttons === 1 ) {
      const width = ( event.target as HTMLDivElement ).clientWidth;
      const x = event.clientX - event.nativeEvent.offsetX;
      const isPlaying = automaton!.isPlaying;

      automaton!.pause();
      automaton!.seek( ( event.clientX - x ) / width * length );
      dispatch( { type: 'Header/SeekDown' } );

      registerMouseEvent(
        ( event ) => {
          automaton!.seek( ( event.clientX - x ) / width * length );
        },
        ( event ) => {
          automaton!.seek( ( event.clientX - x ) / width * length );
          if ( isPlaying ) { automaton!.play(); }
          dispatch( { type: 'Header/SeekUp' } );
        }
      );
    }
  }

  function handleMouseEnter(): void {
    dispatch( { type: 'Header/SeekbarEnter' } );
  }

  function handleMouseLeave(): void {
    dispatch( { type: 'Header/SeekbarLeave' } );
  }

  return (
    <Root
      className={ className }
      onMouseDown={ handleMouseDown }
      onMouseEnter={ handleMouseEnter }
      onMouseLeave={ handleMouseLeave }
    >
      <StyledCurrentTime />
      <TotalTime> / { length.toFixed( 3 ) }</TotalTime>
      <BarBG />
      <StyledBarFG
        isSeeking={ isSeeking }
        isHovering={ isSeekbarHovered }
      />
    </Root>
  );
};

export { HeaderSeekbar };
