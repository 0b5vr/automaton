import React, { useCallback, useContext, useMemo, useState } from 'react';
import { Colors } from '../constants/Colors';
import { Contexts } from '../contexts/Context';
import { HeaderSeekbar } from './HeaderSeekbar';
import { Icons } from '../icons/Icons';
import { Metrics } from '../constants/Metrics';
import styled from 'styled-components';

// == styles =======================================================================================
const StyledHeaderSeekbar = styled( HeaderSeekbar )`
  width: 8rem;
  height: calc( ${ Metrics.headerHeight } - 0.25rem );
`;

const Section = styled.div`
  display: flex;

  & > * {
    margin: 0 0.25rem;
  }
`;

const Button = styled.img<{ disabled?: boolean }>`
  width: calc( ${ Metrics.headerHeight } - 0.25rem );
  height: calc( ${ Metrics.headerHeight } - 0.25rem );
  fill: ${ ( { disabled } ) => disabled ? Colors.gray : Colors.accent };
  cursor: pointer;

  &:hover {
    fill: ${ ( { disabled } ) => disabled ? Colors.gray : Colors.accentdark };
  }
`;

const Logo = styled.img`
  height: calc( ( ${ Metrics.headerHeight } - 0.25rem ) * 0.6 );
  margin: calc( ( ${ Metrics.headerHeight } - 0.25rem ) * 0.2 );
  fill: ${ Colors.fore };
  opacity: 0.5;
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }

  &:active {
    opacity: 0.5;
  }
`;

const Root = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.125rem;
  background: ${ Colors.back4 };
`;

// == element ======================================================================================
export interface HeaderProps {
  className?: string;
}

export const Header = ( { className }: HeaderProps ): JSX.Element => {
  const context = useContext( Contexts.Store );
  const [ cantUndoThis, setCantUndoThis ] = useState( 0 );
  const automaton = context.state.automaton.instance;

  const handlePlay = useCallback(
    (): void => {
      if ( !automaton ) { return; }
      automaton.togglePlay();
    },
    [ automaton ]
  );

  const handleUndo = useCallback(
    (): void => {
      if ( context.state.history.index !== 0 ) {
        context.state.history.entries[ context.state.history.index - 1 ].undo();
        context.dispatch( { type: 'History/Undo' } );
      } else {
        if ( cantUndoThis === 9 ) {
          window.open( 'https://youtu.be/bzY7J0Xle08', '_blank' );
          setCantUndoThis( 0 );
        } else {
          setCantUndoThis( cantUndoThis + 1 );
        }
      }
    },
    [ context.state.history, cantUndoThis ]
  );

  const handleRedo = useCallback(
    (): void => {
      if ( context.state.history.index !== context.state.history.entries.length ) {
        context.state.history.entries[ context.state.history.index ].redo();
        context.dispatch( { type: 'History/Redo' } );
      }
    },
    [ context.state.history ]
  );

  const undoText = useMemo(
    () => (
      context.state.history.index !== 0
        ? 'Undo: ' + context.state.history.entries[ context.state.history.index - 1 ].description
        : 'Can\'t Undo'
    ),
    [ context.state.history ]
  );

  const redoText = useMemo(
    () => (
      context.state.history.index !== context.state.history.entries.length
        ? 'Redo: ' + context.state.history.entries[ context.state.history.index ].description
        : 'Can\'t Redo'
    ),
    [ context.state.history ]
  );

  return (
    <Root className={ className }>
      <Section>
        <Button
          as={ context.state.automaton.isPlaying ? Icons.Pause : Icons.Play }
          onClick={ handlePlay }
          data-stalker='Play / Pause'
        />
        <StyledHeaderSeekbar />
      </Section>
      <Logo as={ Icons.Automaton }
        onClick={ () => context.dispatch( { type: 'About/Open' } ) }
      />
      <Section>
        <Button
          as={ Icons.Undo }
          onClick={ handleUndo }
          disabled={ context.state.history.index === 0 }
          data-stalker={ undoText }
        />
        <Button
          as={ Icons.Redo }
          onClick={ handleRedo }
          disabled={ context.state.history.index === context.state.history.entries.length }
          data-stalker={ redoText }
        />
        <Button as={ Icons.Snap } />
        <Button as={ Icons.Cog } />
        <Button as={ Icons.Save } />
      </Section>
    </Root>
  );
};
