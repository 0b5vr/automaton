import { minimizeData } from '../../minimizeData';
import { showToasty } from '../states/Toasty';
import { useCallback } from 'react';
import { useDispatch, useStore } from '../states/store';
import { writeClipboard } from '../utils/clipboard';

interface Options {
  /**
   * Use the emergency behavior instead. Intended to be used in {@link OhShit}.
   */
  emergencyMode?: boolean;

  /**
   * Use the minimal export.
   */
  minimize?: boolean;
}

export function useSave(): ( options?: Options ) => void {
  const dispatch = useDispatch();
  const store = useStore();

  const selectAllEntities = useCallback(
    ( options?: Options ): void => {
      const state = store.getState();
      const automaton = state.automaton.instance;
      if ( !automaton ) { return; }

      if ( options?.emergencyMode ) {
        const data = JSON.stringify( automaton.serialize() );

        console.info( data );
        writeClipboard( data );

        showToasty( {
          dispatch,
          kind: 'info',
          message: 'Copied to clipboard. Also printed to the console.',
          timeout: 2.0,
        } );
      } else if ( options?.minimize ) {
        const data = automaton.serialize();

        const minimizeOptions = {
          precisionTime: automaton.guiSettings.minimizedPrecisionTime,
          precisionValue: automaton.guiSettings.minimizedPrecisionValue
        };
        const minimized = minimizeData( data, minimizeOptions );

        const json = JSON.stringify( minimized );
        writeClipboard( json );

        showToasty( {
          dispatch,
          kind: 'info',
          message: `Minimized export!
${ json.length.toLocaleString() } bytes`,
          timeout: 2.0,
        } );
      } else if ( automaton.overrideSave ) {
        automaton.overrideSave();
      } else {
        const data = automaton.serialize();

        writeClipboard( JSON.stringify( data ) );
        automaton.shouldSave = false;

        showToasty( {
          dispatch,
          kind: 'info',
          message: 'Copied to clipboard!',
          timeout: 2.0,
        } );
      }
    },
    [ dispatch, store ],
  );

  return selectAllEntities;
}
