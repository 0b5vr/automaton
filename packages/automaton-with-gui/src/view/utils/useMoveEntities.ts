import { HistoryCommand } from '../history/HistoryCommand';
import { dx2dt, dy2dv, snapTime, snapValue } from './TimeValueRange';
import { registerMouseEvent } from './registerMouseEvent';
import { useCallback } from 'react';
import { useDispatch, useStore } from '../states/store';

export function useMoveEntites( { width, height }: { width: number, height: number } ): {
  moveEntities: ( options: {
    moveValue: boolean;
    snapOriginTime?: number;
    snapOriginValue?: number;
  } ) => void,
} {
  const dispatch = useDispatch();
  const store = useStore();

  const moveEntities = useCallback(
    ( { moveValue, snapOriginTime, snapOriginValue }: {
      moveValue: boolean;
      snapOriginTime?: number;
      snapOriginValue?: number;
    } ): void => {
      const state = store.getState();

      const automaton = state.automaton.instance;
      if ( !automaton ) { return; }

      const selected = state.timeline.selected;
      const selectedItemsAsc = Object.values( selected.items ).map( ( { id, channel } ) => (
        { ...state.automaton.channels[ channel ].items[ id ], channel }
      ) ).sort( ( a, b ) => a.time - b.time );
      const selectedItemsDesc = selectedItemsAsc.concat().reverse();

      // -- decide history description -------------------------------------------------------------
      let historyDescription = '';
      if ( selected.labels.length > 0 ) {
        if ( selectedItemsAsc.length > 0 ) {
          historyDescription = 'Move Timeline Entities';
        } else if ( selected.labels.length > 1 ) {
          historyDescription = 'Move Labels';
        } else {
          historyDescription = `Move Label: ${ selected.labels[ 0 ] }`;
        }
      } else if ( selectedItemsAsc.length > 0 ) {
        if ( selectedItemsAsc.length > 1 ) {
          historyDescription = 'Move Items';
        } else {
          historyDescription = `Move Item: ${ selectedItemsAsc[ 0 ].channel }`;
        }
      }

      // if nothing is selected, abort
      if ( historyDescription === '' ) {
        return;
      }

      // -- things needed for items ----------------------------------------------------------------
      const itemsState0Map = new Map( selectedItemsAsc.map( ( item ) => (
        [ item.$id, item ]
      ) ) );
      const itemsNewTimeMap = new Map<string, number>();
      const itemsNewValueMap = new Map<string, number>();

      // -- things needed for labels ---------------------------------------------------------------
      const labelsTime0Map = new Map( selected.labels.map( ( name ) => (
        [ name, state.automaton.labels[ name ] ]
      ) ) );
      const labelsNewTimeMap = new Map<string, number>();

      // -- common stuff ---------------------------------------------------------------------------
      const range = state.timeline.range;
      const guiSettings = state.automaton.guiSettings;

      let dx = 0.0;
      let dt = 0.0;
      let dy = 0.0;
      let dv = 0.0;

      const originTime = snapOriginTime ?? 0.0;
      const originValue = snapOriginValue ?? 0.0;

      // -- do the move ----------------------------------------------------------------------------
      registerMouseEvent(
        ( event, movementSum ) => {
          dx += movementSum.x;
          dy += movementSum.y;

          // -- keyboards --------------------------------------------------------------------------
          const holdTime = ( event.ctrlKey || event.metaKey ) && moveValue;
          const holdValue = event.shiftKey;
          const ignoreSnap = event.altKey;

          // -- calc dt / dv -----------------------------------------------------------------------
          if ( !holdTime ) {
            let t = originTime + dx2dt( dx, range, width );

            if ( !ignoreSnap && snapOriginTime != null ) {
              t = snapTime( t, range, width, guiSettings );
            }

            dt = t - originTime;
          }

          if ( !holdValue && moveValue ) {
            let v = originValue + dy2dv( dy, range, height );

            if ( !ignoreSnap && snapOriginValue != null ) {
              v = snapValue( v, range, height, guiSettings );
            }

            dv = v - originValue;
          }

          // -- move items -------------------------------------------------------------------------
          ( movementSum.x > 0.0 ? selectedItemsDesc : selectedItemsAsc ).forEach( ( item ) => {
            const newTime = itemsState0Map.get( item.$id )!.time + dt;
            const newValue = itemsState0Map.get( item.$id )!.value + dv;

            itemsNewTimeMap.set( item.$id, newTime );
            itemsNewValueMap.set( item.$id, newValue );

            const channel = automaton.getChannel( item.channel )!;
            channel.moveItem( item.$id, newTime );
            channel.changeItemValue( item.$id, newValue );
          } );

          // -- move labels ------------------------------------------------------------------------
          selected.labels.forEach( ( name ) => {
            const newTime = labelsTime0Map.get( name )! + dt;

            labelsNewTimeMap.set( name, newTime );

            automaton.setLabel( name, newTime );
          } );
        },
        () => {
          if ( dt === 0.0 && dv === 0.0 ) { return; }

          const commands: HistoryCommand[] = [];

          // -- push item commands -----------------------------------------------------------------
          ( dt > 0.0 ? selectedItemsDesc : selectedItemsAsc ).forEach( ( item ) => {
            commands.push( {
              type: 'channel/moveItem',
              channel: item.channel,
              item: item.$id,
              time: itemsNewTimeMap.get( item.$id )!,
              timePrev: itemsState0Map.get( item.$id )!.time,
            } );

            commands.push( {
              type: 'channel/changeItemValue',
              channel: item.channel,
              item: item.$id,
              value: itemsNewValueMap.get( item.$id )!,
              valuePrev: itemsState0Map.get( item.$id )!.value,
            } );
          } );

          // -- push label commands ----------------------------------------------------------------
          selected.labels.forEach( ( name ) => {
            commands.push( {
              type: 'automaton/moveLabel',
              name,
              time: labelsNewTimeMap.get( name )!,
              timePrev: labelsTime0Map.get( name )!,
            } );
          } );

          // -- dispatch history command -----------------------------------------------------------
          dispatch( {
            type: 'History/Push',
            description: historyDescription,
            commands,
          } );
        }
      );
    },
    [ dispatch, height, store, width ]
  );

  return { moveEntities };
}
