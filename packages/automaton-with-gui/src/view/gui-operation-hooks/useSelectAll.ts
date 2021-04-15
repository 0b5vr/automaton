import { useCallback } from 'react';
import { useDispatch, useStore } from '../states/store';

interface Options {
  items?: boolean;
  labels?: boolean;
}

export function useSelectAllEntities(): ( options: Options ) => void {
  const dispatch = useDispatch();
  const store = useStore();

  const selectAllEntities = useCallback(
    ( options: Options ): void => {
      const state = store.getState();

      dispatch( {
        type: 'Timeline/SelectItems',
        items: [],
      } );

      if ( options.items ) {
        const items = Object.entries( state.automaton.channels ).map(
          ( [ channel, { items } ] ) => (
            Object.keys( items ).map( ( id ) => ( { id, channel } ) )
          )
        ).flat();

        dispatch( {
          type: 'Timeline/SelectItemsAdd',
          items,
        } );
      }

      if ( options.labels ) {
        const labels = Object.keys( state.automaton.labels );

        dispatch( {
          type: 'Timeline/SelectLabelsAdd',
          labels,
        } );
      }
    },
    [ dispatch, store ]
  );

  return selectAllEntities;
}
