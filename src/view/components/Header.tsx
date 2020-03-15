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

const Button = styled.img<{ disabled?: boolean; active?: boolean }>`
  width: calc( ${ Metrics.headerHeight } - 0.25rem );
  height: calc( ${ Metrics.headerHeight } - 0.25rem );
  fill: ${ ( { disabled: disabled, active: active } ) => disabled ? Colors.gray : active ? Colors.accent : Colors.fore };
  cursor: pointer;

  &:hover {
    fill: ${ ( { disabled: disabled, active: active } ) => disabled ? Colors.gray : active ? Colors.accentdark : Colors.foresub };
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
  const { state, dispatch } = useContext( Contexts.Store );
  const [ cantUndoThis, setCantUndoThis ] = useState( 0 );
  const automaton = state.automaton.instance;

  const handlePlay = useCallback(
    (): void => {
      if ( !automaton ) { return; }
      automaton.togglePlay();
    },
    [ automaton ]
  );

  const handleUndo = useCallback(
    (): void => {
      if ( state.history.index !== 0 ) {
        state.history.entries[ state.history.index - 1 ].undo();
        dispatch( { type: 'History/Undo' } );
      } else {
        if ( cantUndoThis === 9 ) {
          window.open( 'https://youtu.be/bzY7J0Xle08', '_blank' );
          setCantUndoThis( 0 );
        } else {
          setCantUndoThis( cantUndoThis + 1 );
        }
      }
    },
    [ state.history, cantUndoThis ]
  );

  const handleRedo = useCallback(
    (): void => {
      if ( state.history.index !== state.history.entries.length ) {
        state.history.entries[ state.history.index ].redo();
        dispatch( { type: 'History/Redo' } );
      }
      setCantUndoThis( 0 );
    },
    [ state.history ]
  );

  const undoText = useMemo(
    () => (
      state.history.index !== 0
        ? 'Undo: ' + state.history.entries[ state.history.index - 1 ].description
        : 'Can\'t Undo'
    ),
    [ state.history ]
  );

  const redoText = useMemo(
    () => (
      state.history.index !== state.history.entries.length
        ? 'Redo: ' + state.history.entries[ state.history.index ].description
        : 'Can\'t Redo'
    ),
    [ state.history ]
  );

  return (
    <Root className={ className }>
      <Section>
        <Button
          as={ state.automaton.isPlaying ? Icons.Pause : Icons.Play }
          active={ 1 as any as boolean } // fuck
          onClick={ handlePlay }
          data-stalker="Play / Pause"
        />
        <StyledHeaderSeekbar />
      </Section>
      <Logo as={ Icons.Automaton }
        onClick={ () => dispatch( { type: 'About/Open' } ) }
      />
      <Section>
        <Button
          as={ Icons.Undo }
          onClick={ handleUndo }
          disabled={ state.history.index === 0 }
          data-stalker={ undoText }
        />
        <Button
          as={ Icons.Redo }
          onClick={ handleRedo }
          disabled={ state.history.index === state.history.entries.length }
          data-stalker={ redoText }
        />
        <Button
          as={ Icons.Snap }
          onClick={ () => {
            dispatch( {
              type: 'Settings/ChangeMode',
              mode: state.settings.mode === 'snapping' ? 'none' : 'snapping'
            } );
          } }
          active={ ( state.settings.mode === 'snapping' ? 1 : 0 ) as any as boolean } // fuck
          data-stalker="Snapping"
        />
        <Button
          as={ Icons.Cog }
          onClick={ () => {
            dispatch( {
              type: 'Settings/ChangeMode',
              mode: state.settings.mode === 'general' ? 'none' : 'general'
            } );
          } }
          active={ ( state.settings.mode === 'general' ? 1 : 0 ) as any as boolean } // fuck
          data-stalker="General Settings"
        />
        <Button as={ Icons.Save }
          onClick={ () => {
            throw new Error( 'Not implemented' );
          } }
          data-stalker="Copy current status as JSON"
        />
      </Section>
    </Root>
  );
};
