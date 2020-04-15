import React, { useEffect } from 'react';
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
  const { historyIndex, historyEntries, cantUndoThis } = useSelector( ( state ) => ( {
    historyIndex: state.history.index,
    historyEntries: state.history.entries,
    cantUndoThis: state.history.cantUndoThis
  } ) );

  useEffect(
    () => {
      const handleUndo = guiRemocon.on( 'undo', () => {
        if ( historyIndex !== 0 ) {
          historyEntries[ historyIndex - 1 ].undo();
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
    [ guiRemocon, historyIndex, historyEntries, cantUndoThis ]
  );

  useEffect(
    () => {
      const handle = guiRemocon.on( 'redo', () => {
        if ( historyIndex !== historyEntries.length ) {
          historyEntries[ historyIndex ].redo();
          dispatch( { type: 'History/Redo' } );
        }
        dispatch( {
          type: 'History/SetCantUndoThis',
          cantUndoThis: 0
        } );
      } );

      return () => guiRemocon.off( 'redo', handle );
    },
    [ guiRemocon, historyIndex, historyEntries ]
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
