import { DopeSheetEntry } from './DopeSheetEntry';
import { Metrics } from '../constants/Metrics';
import { MouseComboBit, mouseCombo } from '../utils/mouseCombo';
import { RectSelectView } from './RectSelectView';
import { registerMouseEvent } from '../utils/registerMouseEvent';
import { useDispatch, useSelector } from '../states/store';
import { useRect } from '../utils/useRect';
import { useSelectAllEntities } from '../gui-operation-hooks/useSelectAll';
import { useTimeValueRangeFuncs } from '../utils/useTimeValueRange';
import { useWheelEvent } from '../utils/useWheelEvent';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';

// == rect select - interface ======================================================================
export interface DopeSheetRectSelectState {
  isSelecting: boolean;
  channels: string[];
  t0: number;
  t1: number;
}

// == styles =======================================================================================
const StyledDopeSheetEntry = styled( DopeSheetEntry )`
  margin: 2px 0;
`;

const Root = styled.div`
  position: relative;
  overflow: hidden;
`;

// == props ========================================================================================
export interface DopeSheetProps {
  className?: string;
  intersectionRoot: HTMLElement | null;
  refScrollTop: React.RefObject<number>;
}

// == component ====================================================================================
const DopeSheet = (
  { className, refScrollTop, intersectionRoot }: DopeSheetProps
): JSX.Element => {
  const dispatch = useDispatch();
  const refRoot = useRef<HTMLDivElement>( null );
  const rect = useRect( refRoot );
  const {
    automaton,
    channelNames,
    range,
  } = useSelector( ( state ) => ( {
    automaton: state.automaton.instance,
    channelNames: state.automaton.channelNames,
    range: state.timeline.range,
  } ) );
  const selectAllEntities = useSelectAllEntities();

  const {
    x2t,
    t2x,
    dx2dt,
    snapTime,
  } = useTimeValueRangeFuncs( range, rect );

  const timeRange = useMemo(
    () => ( {
      t0: range.t0,
      t1: range.t1,
    } ),
    [ range.t0, range.t1 ]
  );

  const move = useCallback(
    ( dx: number ): void => {
      dispatch( {
        type: 'Timeline/MoveRange',
        size: rect,
        dx,
        dy: 0.0,
      } );
    },
    [ dispatch, rect ]
  );

  const zoom = useCallback(
    ( cx: number, dx: number ): void => {
      dispatch( {
        type: 'Timeline/ZoomRange',
        size: rect,
        cx,
        cy: 0.0,
        dx,
        dy: 0.0,
      } );
    },
    [ dispatch, rect ]
  );

  const startSeek = useCallback(
    ( x: number ): void => {
      if ( !automaton ) { return; }

      const isPlaying = automaton.isPlaying;
      automaton.pause();

      const t0 = x2t( x - rect.left );
      automaton.seek( t0 );

      let dx = 0.0;
      let t = t0;

      registerMouseEvent(
        ( event, movementSum ) => {
          dx += movementSum.x;
          t = t0 + dx2dt( dx );
          automaton.seek( t );
        },
        () => {
          automaton.seek( t );
          if ( isPlaying ) { automaton.play(); }
        }
      );
    },
    [ automaton, x2t, rect.left, dx2dt ]
  );

  const startSetLoopRegion = useCallback(
    ( x: number ): void => {
      if ( !automaton ) { return; }

      const t0Raw = x2t( x - rect.left );
      const t0 = snapTime( t0Raw );

      let dx = 0.0;
      let t = t0;

      registerMouseEvent(
        ( event, movementSum ) => {
          dx += movementSum.x;

          const tRaw = t0 + dx2dt( dx );
          t = snapTime( tRaw );

          if ( t - t0 === 0.0 ) {
            automaton.setLoopRegion( null );
          } else {
            const begin = Math.min( t, t0 );
            const end = Math.max( t, t0 );
            automaton.setLoopRegion( { begin, end } );
          }
        },
        () => {
          if ( t - t0 === 0.0 ) {
            automaton.setLoopRegion( null );
          } else {
            const begin = Math.min( t, t0 );
            const end = Math.max( t, t0 );
            automaton.setLoopRegion( { begin, end } );
          }
        }
      );
    },
    [ automaton, x2t, rect.left, snapTime, dx2dt ]
  );

  const refX2t = useRef( x2t );
  useEffect( () => { refX2t.current = x2t; }, [ x2t ] );

  const [ rectSelectState, setRectSelectState ] = useState<DopeSheetRectSelectState>( {
    isSelecting: false,
    channels: [],
    t0: Infinity,
    t1: -Infinity,
  } );
  const [ rectSelectYRange, setRectSelectYRange ] = useState<[ number, number ]>( [ 0.0, 0.0 ] );

  const startRectSelect = useCallback(
    ( x: number, y: number ) => {
      const t0 = refX2t.current( x - rect.left );
      const y0 = y - rect.top - ( refScrollTop.current ?? 0.0 );
      let t1 = t0;
      let y1 = y0;
      let channels = channelNames.slice(
        Math.max( 0, Math.floor( y0 / Metrics.channelListEntyHeight ) ),
        Math.ceil( y1 / Metrics.channelListEntyHeight ),
      );

      setRectSelectState( {
        isSelecting: true,
        channels,
        t0,
        t1,
      } );
      setRectSelectYRange( [
        Math.min( y0, y1 ),
        Math.max( y0, y1 ),
      ] );

      registerMouseEvent(
        ( event ) => {
          t1 = refX2t.current( event.clientX - rect.left );
          y1 = event.clientY - rect.top - ( refScrollTop.current ?? 0.0 );
          channels = channelNames.slice(
            Math.max( 0, Math.floor( Math.min( y0, y1 ) / Metrics.channelListEntyHeight ) ),
            Math.ceil( Math.max( y0, y1 ) / Metrics.channelListEntyHeight ),
          );

          setRectSelectState( {
            isSelecting: true,
            channels,
            t0: Math.min( t0, t1 ),
            t1: Math.max( t0, t1 ),
          } );
          setRectSelectYRange( [
            Math.min( y0, y1 ),
            Math.max( y0, y1 ),
          ] );
        },
        () => {
          setRectSelectState( {
            isSelecting: false,
            channels: [],
            t0: Infinity,
            t1: -Infinity,
          } );
          setRectSelectYRange( [
            Infinity,
            -Infinity,
          ] );
        },
      );
    },
    [ channelNames, rect.left, rect.top, refScrollTop ]
  );

  const handleMouseDown = useCallback(
    ( event ) => mouseCombo( event, {
      [ MouseComboBit.LMB ]: ( event ) => {
        dispatch( {
          type: 'Timeline/SelectItems',
          items: [],
        } );

        startRectSelect( event.clientX, event.clientY );
      },
      [ MouseComboBit.LMB + MouseComboBit.Ctrl ]: ( event ) => {
        startRectSelect( event.clientX, event.clientY );
      },
      [ MouseComboBit.LMB + MouseComboBit.Alt ]: ( event ) => {
        startSeek( event.clientX );
      },
      [ MouseComboBit.LMB + MouseComboBit.Shift + MouseComboBit.Alt ]: ( event ) => {
        startSetLoopRegion( event.clientX );
      },
      [ MouseComboBit.MMB ]: () => {
        registerMouseEvent(
          ( event, movementSum ) => move( movementSum.x )
        );
      }
    } ),
    [ dispatch, move, startRectSelect, startSeek, startSetLoopRegion ]
  );

  const createLabel = useCallback(
    ( x: number, y: number ): void => {
      if ( !automaton ) { return; }

      const time = x2t( x - rect.left );

      dispatch( {
        type: 'TextPrompt/Open',
        position: { x, y },
        placeholder: 'A name for the new label',
        checkValid: ( name: string ) => {
          if ( name === '' ) { return 'Create Label: Name cannot be empty.'; }
          if ( automaton.labels[ name ] != null ) { return 'Create Label: A label for the given name already exists.'; }
          return null;
        },
        callback: ( name ) => {
          automaton.setLabel( name, time );

          dispatch( {
            type: 'History/Push',
            description: 'Set Label',
            commands: [
              {
                type: 'automaton/createLabel',
                name,
                time
              }
            ],
          } );
        }
      } );
    },
    [ automaton, x2t, rect.left, dispatch ]
  );

  const handleContextMenu = useCallback(
    ( event: React.MouseEvent ): void => {
      event.preventDefault();

      const x = event.clientX;
      const y = event.clientY;

      dispatch( {
        type: 'ContextMenu/Push',
        position: { x, y },
        commands: [
          {
            name: 'Create Label',
            description: 'Create a label.',
            callback: () => createLabel( x, y )
          },
          {
            name: 'Select All...',
            description: 'Select all items or labels.',
            more: [
              {
                name: 'Select All Items',
                description: 'Select all items.',
                callback: () => selectAllEntities( { items: true } ),
              },
              {
                name: 'Select All Labels',
                description: 'Select all labels.',
                callback: () => selectAllEntities( { labels: true } ),
              },
              {
                name: 'Select Everything',
                description: 'Select all items and labels.',
                callback: () => selectAllEntities( { items: true, labels: true } ),
              },
            ],
          },
        ]
      } );
    },
    [ dispatch, createLabel, selectAllEntities ]
  );

  const handleWheel = useCallback(
    ( event: WheelEvent ): void => {
      if ( event.shiftKey ) {
        event.preventDefault();
        zoom( event.clientX - rect.left, event.deltaY );
      } else {
        if ( event.deltaX !== 0 ) {
          move( -event.deltaX );
        }
      }
    },
    [ rect, zoom, move ]
  );

  useWheelEvent( refRoot, handleWheel );

  const entries = useMemo(
    () => (
      channelNames.map( ( channel ) => (
        <StyledDopeSheetEntry
          key={ channel }
          channel={ channel }
          range={ timeRange }
          rectSelectState={ rectSelectState }
          intersectionRoot={ intersectionRoot }
        />
      ) )
    ),
    [ channelNames, intersectionRoot, rectSelectState, timeRange ]
  );

  return (
    <Root
      className={ className }
      ref={ refRoot }
      onMouseDown={ handleMouseDown }
      onContextMenu={ handleContextMenu }
    >
      { entries }
      { rectSelectState.isSelecting && (
        <RectSelectView
          x0={ t2x( rectSelectState.t0 ) }
          x1={ t2x( rectSelectState.t1 ) }
          y0={ rectSelectYRange[ 0 ] }
          y1={ rectSelectYRange[ 1 ] }
        />
      ) }
    </Root>
  );
};

export { DopeSheet };
