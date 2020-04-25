import React, { useEffect } from 'react';
import { performRedo, performUndo } from '../history/HistoryCommand';
import { useDispatch, useSelector } from '../states/store';
import { GUIRemocon } from '../../GUIRemocon';
import styled from 'styled-components';

// == styles =======================================================================================
const Root = styled.div`
  display: none;
`;

// == element ======================================================================================
const GUIRemoconListener = ( { guiRemocon }: {
  guiRemocon: GUIRemocon;
} ): JSX.Element => {
  const dispatch = useDispatch();
  const { automaton, historyIndex, historyEntries, cantUndoThis } = useSelector( ( state ) => ( {
    automaton: state.automaton.instance,
    historyIndex: state.history.index,
    historyEntries: state.history.entries,
    cantUndoThis: state.history.cantUndoThis
  } ) );

  useEffect(
    () => {
      if ( !automaton ) { return; }

      const handleUndo = guiRemocon.on( 'undo', () => {
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
      } );

      return () => guiRemocon.off( 'undo', handleUndo );
    },
    [ automaton, guiRemocon, historyIndex, historyEntries, cantUndoThis ]
  );

  useEffect(
    () => {
      if ( !automaton ) { return; }

      const handle = guiRemocon.on( 'redo', () => {
        if ( historyIndex !== historyEntries.length ) {
          performRedo( automaton, historyEntries[ historyIndex ].commands );
          dispatch( { type: 'History/Redo' } );
        }
        dispatch( {
          type: 'History/SetCantUndoThis',
          cantUndoThis: 0
        } );
      } );

      return () => guiRemocon.off( 'redo', handle );
    },
    [ automaton, guiRemocon, historyIndex, historyEntries ]
  );

  useEffect(
    () => {
      const handle = guiRemocon.on( 'openAbout', () => {
        dispatch( {
          type: 'About/Open'
        } );
      } );

      return () => guiRemocon.off( 'openAbout', handle );
    },
    [ guiRemocon ]
  );

  return (
    <Root />
  );
};

export { GUIRemoconListener };
