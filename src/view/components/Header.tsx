import React, { useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Colors } from '../constants/Colors';
import { HeaderSeekbar } from './HeaderSeekbar';
import { Icons } from '../icons/Icons';
import { Metrics } from '../constants/Metrics';
import { State } from '../states/store';
import styled from 'styled-components';
import { writeClipboard } from '../utils/clipboard';

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
  const dispatch = useDispatch();
  const [ cantUndoThis, setCantUndoThis ] = useState( 0 );
  const [ isSavedRecently, setIsSavedRecently ] = useState( false );
  const automaton = useSelector( ( state: State ) => state.automaton.instance );
  const isPlaying = useSelector( ( state: State ) => state.automaton.isPlaying );
  const settingsMode = useSelector( ( state: State ) => state.settings.mode );
  const historyIndex = useSelector( ( state: State ) => state.history.index );
  const historyEntries = useSelector( ( state: State ) => state.history.entries );

  const handlePlay = useCallback(
    (): void => {
      if ( !automaton ) { return; }
      automaton.togglePlay();
    },
    [ automaton ]
  );

  const handleUndo = useCallback(
    (): void => {
      if ( historyIndex !== 0 ) {
        historyEntries[ historyIndex - 1 ].undo();
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
    [ historyIndex, historyEntries, cantUndoThis ]
  );

  const handleRedo = useCallback(
    (): void => {
      if ( historyIndex !== historyEntries.length ) {
        historyEntries[ historyIndex ].redo();
        dispatch( { type: 'History/Redo' } );
      }
      setCantUndoThis( 0 );
    },
    [ historyIndex, historyEntries ]
  );

  const undoText = useMemo(
    () => (
      historyIndex !== 0
        ? 'Undo: ' + historyEntries[ historyIndex - 1 ].description
        : 'Can\'t Undo'
    ),
    [ historyIndex, historyEntries ]
  );

  const redoText = useMemo(
    () => (
      historyIndex !== historyEntries.length
        ? 'Redo: ' + historyEntries[ historyIndex ].description
        : 'Can\'t Redo'
    ),
    [ historyIndex, historyEntries ]
  );

  return (
    <Root className={ className }>
      <Section>
        <Button
          as={ isPlaying ? Icons.Pause : Icons.Play }
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
          disabled={ historyIndex === 0 }
          data-stalker={ undoText }
        />
        <Button
          as={ Icons.Redo }
          onClick={ handleRedo }
          disabled={ historyIndex === historyEntries.length }
          data-stalker={ redoText }
        />
        <Button
          as={ Icons.Snap }
          onClick={ () => {
            dispatch( {
              type: 'Settings/ChangeMode',
              mode: settingsMode === 'snapping' ? 'none' : 'snapping'
            } );
          } }
          active={ ( settingsMode === 'snapping' ? 1 : 0 ) as any as boolean } // fuck
          data-stalker="Snapping"
        />
        <Button
          as={ Icons.Cog }
          onClick={ () => {
            dispatch( {
              type: 'Settings/ChangeMode',
              mode: settingsMode === 'general' ? 'none' : 'general'
            } );
          } }
          active={ ( settingsMode === 'general' ? 1 : 0 ) as any as boolean } // fuck
          data-stalker="General Settings"
        />
        <Button as={ Icons.Save }
          onClick={ () => {
            const data = automaton!.serialize();
            writeClipboard( JSON.stringify( data ) );
            setIsSavedRecently( true );
            setTimeout( () => {
              setIsSavedRecently( false );
            }, 3000 );
          } }
          data-stalker={ isSavedRecently ? 'Copied!' : 'Copy current status as JSON' }
        />
      </Section>
    </Root>
  );
};
