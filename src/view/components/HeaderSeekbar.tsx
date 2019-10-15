import React, { useContext } from 'react';
import { Colors } from '../style-constants/Colors';
import { Context } from '../contexts/Context';
import { HeaderActionType } from '../contexts/Header';
import { registerMouseEvent } from '../utils/MouseUtils';
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
  const context = useContext( Context.Store );
  const automaton = context.state.automaton.instance!;

  function handleMouseDown( event: React.MouseEvent ): void {
    event.preventDefault();

    if ( event.buttons === 1 ) {
      const width = ( event.target as HTMLDivElement ).clientWidth;
      const x = event.clientX - event.nativeEvent.offsetX;
      const isPlaying = automaton.isPlaying;

      automaton.pause();
      automaton.seek( ( event.clientX - x ) / width * context.state.automaton.length );
      context.dispatch( { type: HeaderActionType.SeekDown } );

      registerMouseEvent(
        ( event ) => {
          automaton.seek( ( event.clientX - x ) / width * context.state.automaton.length );
        },
        ( event ) => {
          automaton.seek( ( event.clientX - x ) / width * context.state.automaton.length );
          if ( isPlaying ) { automaton.play(); }
          context.dispatch( { type: HeaderActionType.SeekUp } );
        }
      );
    }
  }

  function handleMouseEnter(): void {
    context.dispatch( { type: HeaderActionType.SeekbarEnter } );
  }

  function handleMouseLeave(): void {
    context.dispatch( { type: HeaderActionType.SeekbarLeave } );
  }

  const progress = context.state.automaton.time / context.state.automaton.length;

  return (
    <Root
      className={ className }
      onMouseDown={ handleMouseDown }
      onMouseEnter={ handleMouseEnter }
      onMouseLeave={ handleMouseLeave }
    >
      <CurrentTime>{ context.state.automaton.time.toFixed( 3 ) }</CurrentTime>
      <TotalTime> / { context.state.automaton.length.toFixed( 3 ) }</TotalTime>
      <BarBG />
      <BarFG
        style={ { width: progress * 100.0 + '%' } }
        isSeeking={ context.state.header.isSeeking }
        isHovering={ context.state.header.isSeekbarHovered }
      />
    </Root>
  );
};
