import { useCallback } from 'react';
import { useDispatch, useStore } from '../states/store';

export function useSelectAllItemsInChannel(): ( channelName: string ) => void {
  const dispatch = useDispatch();
  const store = useStore();

  const selectAllItemsInChannel = useCallback(
    ( channelName: string ): void => {
      const state = store.getState();

      const stateChannel = state.automaton.channels[ channelName ];

      if ( stateChannel == null ) {
        throw new Error( 'The specified channel is not found??????? why' );
      }

      const items = Object.keys( stateChannel.items ).map( ( id ) => ( {
        id,
        channel: channelName,
      } ) );

      dispatch( {
        type: 'Timeline/SelectItems',
        items,
      } );
    },
    [ dispatch, store ]
  );

  return selectAllItemsInChannel;
}
