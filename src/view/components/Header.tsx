import React, { useCallback, useMemo } from 'react';
import { performRedo, performUndo } from '../history/HistoryCommand';
import { useDispatch, useSelector } from '../states/store';
import { AutomatonWithGUI } from '../../AutomatonWithGUI';
import { Colors } from '../constants/Colors';
import { HeaderSeekbar } from './HeaderSeekbar';
import { Icons } from '../icons/Icons';
import { Metrics } from '../constants/Metrics';
import { showToasty } from '../states/Toasty';
import styled from 'styled-components';
import { writeClipboard } from '../utils/clipboard';

// == microcomponent ===============================================================================
const ShouldSaveIndicator = ( { className }: {
  className?: string;
} ): JSX.Element => {
  const shouldSave = useSelector( ( state ) => state.automaton.shouldSave );

  return <div
    className={ className }
    style={ {
      visibility: shouldSave ? 'visible' : 'hidden'
    } }
    data-stalker={ 'You might want to save the file before leave' }
  />;
};

// == styles =======================================================================================
const StyledHeaderSeekbar = styled( HeaderSeekbar )`
  width: 124px;
  height: ${ Metrics.headerHeight - 4 }px;
  margin: 2px;
`;

const Section = styled.div`
  display: flex;
`;

const Button = styled.img<{ disabled?: boolean; active?: boolean }>`
  width: ${ Metrics.headerHeight - 4 }px;
  height: ${ Metrics.headerHeight - 4 }px;
  fill: ${ ( { disabled: disabled, active: active } ) => disabled ? Colors.gray : active ? Colors.accent : Colors.fore };
  cursor: pointer;
  margin: 2px 4px;

  &:hover {
    fill: ${ ( { disabled: disabled, active: active } ) => disabled ? Colors.gray : active ? Colors.accentdark : Colors.foredark };
  }
`;

const PlayPause = styled.img`
  width: ${ Metrics.headerHeight + 4 }px;
  height: ${ Metrics.headerHeight }px;
  padding: 2px 4px;
  fill: ${ Colors.fore };
  cursor: pointer;

  &:hover {
    fill: ${ Colors.foredark };
  }
`;

const Logo = styled.img`
  height: ${ 0.5 * Metrics.headerHeight }px;
  margin: ${ 0.25 * Metrics.headerHeight }px;
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

const StyledShouldSaveIndicator = styled( ShouldSaveIndicator )`
  width: 6px;
  height: 6px;
  border-radius: 3px;
  margin: auto 0 auto 4px;
  background: ${ Colors.accent };
`;

const Root = styled.div`
  display: flex;
  justify-content: space-between;
  background: ${ Colors.back4 };
`;

// == element ======================================================================================
export interface HeaderProps {
  className?: string;
}

const Header = ( { className }: HeaderProps ): JSX.Element => {
  const dispatch = useDispatch();
  const {
    automaton,
    isPlaying,
    settingsMode,
    historyIndex,
    historyEntries,
    cantUndoThis
  } = useSelector( ( state ) => ( {
    automaton: state.automaton.instance,
    isPlaying: state.automaton.isPlaying,
    settingsMode: state.settings.mode,
    historyIndex: state.history.index,
    historyEntries: state.history.entries,
    cantUndoThis: state.history.cantUndoThis
  } ) );

  const save = useCallback(
    ( data: string ): void => {
      if ( !automaton ) { return; }

      writeClipboard( data );

      automaton.shouldSave = false;

      showToasty( {
        dispatch,
        kind: 'info',
        message: 'Copied to clipboard!',
        timeout: 2.0
      } );
    },
    [ automaton ]
  );

  const handlePlay = useCallback(
    (): void => {
      if ( !automaton ) { return; }
      automaton.togglePlay();
    },
    [ automaton ]
  );

  const handleUndo = useCallback(
    (): void => {
      if ( !automaton ) { return; }

      if ( historyIndex !== 0 ) {
        performUndo( automaton, historyEntries[ historyIndex - 1 ].commands );
        dispatch( { type: 'History/Undo' } );
      } else {
        if ( cantUndoThis === 9 ) {
          window.open( 'https://youtu.be/bzY7J0Xle08', '_blank' );
          dispatch( {
            type: 'History/SetCantUndoThis',
            cantUndoThis: 0
          } );
        } else {
          dispatch( {
            type: 'History/SetCantUndoThis',
            cantUndoThis: cantUndoThis + 1
          } );
        }
      }
    },
    [ automaton, historyIndex, historyEntries, cantUndoThis ]
  );

  const handleRedo = useCallback(
    (): void => {
      if ( !automaton ) { return; }

      if ( historyIndex !== historyEntries.length ) {
        performRedo( automaton, historyEntries[ historyIndex ].commands );
        dispatch( { type: 'History/Redo' } );
      }
      dispatch( {
        type: 'History/SetCantUndoThis',
        cantUndoThis: 0
      } );
    },
    [ automaton, historyIndex, historyEntries ]
  );

  const handleSave = useCallback(
    () => {
      if ( !automaton ) { return; }

      if ( automaton.overrideSave ) {
        automaton.overrideSave();
      } else {
        const data = automaton.serialize();
        save( JSON.stringify( data ) );
      }
    },
    [ automaton, save ]
  );

  const handleSaveContextMenu = useCallback(
    ( event: React.MouseEvent ) => {
      if ( !automaton ) { return; }

      event.preventDefault();
      event.stopPropagation();

      if ( automaton.saveContextMenuCommands ) {
        dispatch( {
          type: 'ContextMenu/Push',
          position: { x: event.clientX, y: event.clientY },
          commands: automaton.saveContextMenuCommands
        } );
      } else {
        dispatch( {
          type: 'ContextMenu/Push',
          position: { x: event.clientX, y: event.clientY },
          commands: [
            {
              name: 'Save',
              description: 'Copy its serialized data to clipboard.',
              callback: () => {
                const data = automaton.serialize();
                save( JSON.stringify( data ) );
              }
            },
            {
              name: 'Minimal Export',
              description: 'Same as Save, but way more minimized data.',
              callback: () => {
                const data = automaton.serialize();
                const options = {
                  precisionTime: automaton.guiSettings.minimizedPrecisionTime,
                  precisionValue: automaton.guiSettings.minimizedPrecisionValue
                };
                const minimized = AutomatonWithGUI.minimizeData( data, options );
                save( JSON.stringify( minimized ) );
              }
            }
          ]
        } );
      }
    },
    [ automaton ]
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
        <PlayPause
          as={ isPlaying ? Icons.Pause : Icons.Play }
          onClick={ handlePlay }
          data-stalker="Play / Pause"
        />
        <StyledHeaderSeekbar />
      </Section>
      <Section>
        <Logo as={ Icons.Automaton }
          onClick={ () => dispatch( { type: 'About/Open' } ) }
          data-stalker={ `Automaton v${ process.env.VERSION! }` }
        />
        <StyledShouldSaveIndicator />
      </Section>
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
          onClick={ handleSave }
          onContextMenu={ handleSaveContextMenu }
          data-stalker={ 'Save' }
        />
      </Section>
    </Root>
  );
};

export { Header };
