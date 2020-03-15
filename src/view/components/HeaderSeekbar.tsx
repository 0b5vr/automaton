import { useDispatch, useSelector } from 'react-redux';
import { Colors } from '../constants/Colors';
import React from 'react';
import { State } from '../states/store';
import { registerMouseEvent } from '../utils/registerMouseEvent';
import styled from 'styled-components';

// == styles =======================================================================================
const CurrentTime = styled.span`
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

const BarFG = styled.div<{ isSeeking: boolean; isHovering: boolean }>`
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

// == element ======================================================================================
export interface HeaderSeekbarProps {
  className?: string;
}

export const HeaderSeekbar = ( { className }: HeaderSeekbarProps ): JSX.Element => {
  const dispatch = useDispatch();
  const automaton = useSelector( ( state: State ) => state.automaton.instance );
  const time = useSelector( ( state: State ) => state.automaton.time );
  const length = useSelector( ( state: State ) => state.automaton.length );
  const isSeeking = useSelector( ( state: State ) => state.header.isSeeking );
  const isSeekbarHovered = useSelector( ( state: State ) => state.header.isSeekbarHovered );

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

  const progress = time / length;

  return (
    <Root
      className={ className }
      onMouseDown={ handleMouseDown }
      onMouseEnter={ handleMouseEnter }
      onMouseLeave={ handleMouseLeave }
    >
      <CurrentTime>{ time.toFixed( 3 ) }</CurrentTime>
      <TotalTime> / { length.toFixed( 3 ) }</TotalTime>
      <BarBG />
      <BarFG
        style={ { width: progress * 100.0 + '%' } }
        isSeeking={ isSeeking }
        isHovering={ isSeekbarHovered }
      />
    </Root>
  );
};
