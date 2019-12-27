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
  const contexts = useContext( Contexts.Store );
  const [ cantUndoThis, setCantUndoThis ] = useState( 0 );
  const automaton = contexts.state.automaton.instance;

  const handlePlay = useCallback(
    (): void => {
      if ( !automaton ) { return; }
      automaton.togglePlay();
    },
    [ automaton ]
  );

  const handleUndo = useCallback(
    (): void => {
      if ( contexts.state.history.index !== 0 ) {
        contexts.state.history.entries[ contexts.state.history.index - 1 ].undo();
        contexts.dispatch( { type: 'History/Undo' } );
      } else {
        if ( cantUndoThis === 9 ) {
          window.open( 'https://youtu.be/bzY7J0Xle08', '_blank' );
          setCantUndoThis( 0 );
        } else {
          setCantUndoThis( cantUndoThis + 1 );
        }
      }
    },
    [ contexts.state.history, cantUndoThis ]
  );

  const handleRedo = useCallback(
    (): void => {
      if ( contexts.state.history.index !== contexts.state.history.entries.length ) {
        contexts.state.history.entries[ contexts.state.history.index ].redo();
        contexts.dispatch( { type: 'History/Redo' } );
      }
    },
    [ contexts.state.history ]
  );

  const undoText = useMemo(
    () => (
      contexts.state.history.index !== 0
        ? 'Undo: ' + contexts.state.history.entries[ contexts.state.history.index - 1 ].description
        : 'Can\'t Undo'
    ),
    [ contexts.state.history ]
  );

  const redoText = useMemo(
    () => (
      contexts.state.history.index !== contexts.state.history.entries.length
        ? 'Redo: ' + contexts.state.history.entries[ contexts.state.history.index ].description
        : 'Can\'t Redo'
    ),
    [ contexts.state.history ]
  );

  return (
    <Root className={ className }>
      <Section>
        <Button
          as={ contexts.state.automaton.isPlaying ? Icons.Pause : Icons.Play }
          onClick={ handlePlay }
          data-stalker='Play / Pause'
        />
        <StyledHeaderSeekbar />
      </Section>
      <Logo as={ Icons.Automaton }
        onClick={ () => contexts.dispatch( { type: 'About/Open' } ) }
      />
      <Section>
        <Button
          as={ Icons.Undo }
          onClick={ handleUndo }
          disabled={ contexts.state.history.index === 0 }
          data-stalker={ undoText }
        />
        <Button
          as={ Icons.Redo }
          onClick={ handleRedo }
          disabled={ contexts.state.history.index === contexts.state.history.entries.length }
          data-stalker={ redoText }
        />
        <Button as={ Icons.Snap } />
        <Button as={ Icons.Cog } />
        <Button as={ Icons.Save } />
      </Section>
    </Root>
  );
};
