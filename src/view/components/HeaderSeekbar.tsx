import React, { useContext } from 'react';
import { Colors } from '../constants/Colors';
import { Contexts } from '../contexts/Context';
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
  const contexts = useContext( Contexts.Store );
  const automaton = contexts.state.automaton.instance!;

  function handleMouseDown( event: React.MouseEvent ): void {
    event.preventDefault();

    if ( event.buttons === 1 ) {
      const width = ( event.target as HTMLDivElement ).clientWidth;
      const x = event.clientX - event.nativeEvent.offsetX;
      const isPlaying = automaton.isPlaying;

      automaton.pause();
      automaton.seek( ( event.clientX - x ) / width * contexts.state.automaton.length );
      contexts.dispatch( { type: 'Header/SeekDown' } );

      registerMouseEvent(
        ( event ) => {
          automaton.seek( ( event.clientX - x ) / width * contexts.state.automaton.length );
        },
        ( event ) => {
          automaton.seek( ( event.clientX - x ) / width * contexts.state.automaton.length );
          if ( isPlaying ) { automaton.play(); }
          contexts.dispatch( { type: 'Header/SeekUp' } );
        }
      );
    }
  }

  function handleMouseEnter(): void {
    contexts.dispatch( { type: 'Header/SeekbarEnter' } );
  }

  function handleMouseLeave(): void {
    contexts.dispatch( { type: 'Header/SeekbarLeave' } );
  }

  const progress = contexts.state.automaton.time / contexts.state.automaton.length;

  return (
    <Root
      className={ className }
      onMouseDown={ handleMouseDown }
      onMouseEnter={ handleMouseEnter }
      onMouseLeave={ handleMouseLeave }
    >
      <CurrentTime>{ contexts.state.automaton.time.toFixed( 3 ) }</CurrentTime>
      <TotalTime> / { contexts.state.automaton.length.toFixed( 3 ) }</TotalTime>
      <BarBG />
      <BarFG
        style={ { width: progress * 100.0 + '%' } }
        isSeeking={ contexts.state.header.isSeeking }
        isHovering={ contexts.state.header.isSeekbarHovered }
      />
    </Root>
  );
};
