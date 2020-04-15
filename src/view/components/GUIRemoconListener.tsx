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
  const { historyIndex, historyEntries } = useSelector( ( state ) => ( {
    historyIndex: state.history.index,
    historyEntries: state.history.entries
  } ) );

  useEffect(
    () => {
      const handleUndo = guiRemocon.on( 'undo', () => {
        if ( historyIndex !== 0 ) {
          historyEntries[ historyIndex - 1 ].undo();
          dispatch( { type: 'History/Undo' } );
        }
      } );

      return () => guiRemocon.off( 'undo', handleUndo );
    },
    [ guiRemocon, historyIndex, historyEntries ]
  );

  useEffect(
    () => {
      const handle = guiRemocon.on( 'redo', () => {
        if ( historyIndex !== historyEntries.length ) {
          historyEntries[ historyIndex ].redo();
          dispatch( { type: 'History/Redo' } );
        }
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
