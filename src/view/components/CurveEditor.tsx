import { MouseComboBit, mouseCombo } from '../utils/mouseCombo';
import React, { useCallback, useEffect, useRef } from 'react';
import { TimeValueRange, x2t, y2v } from '../utils/TimeValueRange';
import { ToastyKind, showToasty } from '../states/Toasty';
import { useDispatch, useSelector } from '../states/store';
import { Colors } from '../constants/Colors';
import { CurveEditorFx } from './CurveEditorFx';
import { CurveEditorFxBg } from './CruveEditorFxBg';
import { CurveEditorGraph } from './CurveEditorGraph';
import { CurveEditorNode } from './CurveEditorNode';
import { RangeBar } from './RangeBar';
import { Resolution } from '../utils/Resolution';
import { TimeValueGrid } from './TimeValueGrid';
import { TimeValueLines } from './TimeValueLines';
import { registerMouseEvent } from '../utils/registerMouseEvent';
import styled from 'styled-components';
import { useDoubleClick } from '../utils/useDoubleClick';
import { useRect } from '../utils/useRect';

// == microcomponent ===============================================================================
const Lines = ( { curve, range, size }: {
  curve: number;
  range: TimeValueRange;
  size: Resolution;
} ): JSX.Element => {
  const { time, value } = useSelector( ( state ) => ( {
    time: state.automaton.curvesPreview[ curve ].previewTime,
    value: state.automaton.curvesPreview[ curve ].previewValue
  } ) );

  return <TimeValueLines
    range={ range }
    size={ size }
    time={ time ?? undefined }
    value={ value ?? undefined }
  />;
};

const Nodes = ( { curve, range, size }: {
  curve: number;
  range: TimeValueRange;
  size: Resolution;
} ): JSX.Element => {
  const { nodes } = useSelector( ( state ) => ( {
    nodes: state.automaton.curves[ curve ].nodes
  } ) );

  return <>
    { nodes && Object.values( nodes ).map( ( node ) => (
      <CurveEditorNode
        key={ node.$id }
        curve={ curve }
        node={ node }
        range={ range }
        size={ size }
      />
    ) ) }
  </>;
};

const Fxs = ( { curve, range, size }: {
  curve: number;
  range: TimeValueRange;
  size: Resolution;
} ): JSX.Element => {
  const { fxs } = useSelector( ( state ) => ( {
    fxs: state.automaton.curves[ curve ].fxs
  } ) );

  return <>
    { fxs && Object.values( fxs ).map( ( fx ) => (
      <CurveEditorFxBg
        key={ fx.$id }
        curve={ curve }
        fx={ fx }
        range={ range }
        size={ size }
      />
    ) ) }
    { fxs && Object.values( fxs ).map( ( fx ) => (
      <CurveEditorFx
        key={ fx.$id }
        curve={ curve }
        fx={ fx }
        range={ range }
        size={ size }
      />
    ) ) }
  </>;
};

// == styles =======================================================================================
const SVGRoot = styled.svg`
  width: 100%;
  height: 100%;
`;

const Body = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: calc( 100% - 4px );
  background: ${ Colors.back1 };
  pointer-events: auto;
`;

const StyledLines = styled( Lines )`
  position: absolute;
`;

const StyledRangeBar = styled( RangeBar )`
  position: absolute;
  left: 0;
  bottom: 0;
  height: 4px;
`;

const Root = styled.div`
  background: ${ Colors.black };
`;

// == element ======================================================================================
export interface CurveEditorProps {
  className?: string;
}

const CurveEditor = ( { className }: CurveEditorProps ): JSX.Element => {
  const dispatch = useDispatch();
  const checkDoubleClick = useDoubleClick();
  const {
    selectedCurve,
    range,
    automaton
  } = useSelector( ( state ) => ( {
    selectedCurve: state.curveEditor.selectedCurve,
    range: state.curveEditor.range,
    automaton: state.automaton.instance
  } ) );
  const { curveLength } = useSelector( ( state ) => ( {
    curveLength: selectedCurve != null ? state.automaton.curves[ selectedCurve ].length : null
  } ) );

  const curve = selectedCurve != null && automaton?.getCurve( selectedCurve ) || null;

  const refBody = useRef<HTMLDivElement>( null );
  const rect = useRect( refBody );

  const move = useCallback(
    ( dx: number, dy: number ): void => {
      dispatch( {
        type: 'CurveEditor/MoveRange',
        size: rect,
        dx,
        dy
      } );
    },
    [ rect, curveLength ]
  );

  const zoom = useCallback(
    ( cx: number, cy: number, dx: number, dy: number ): void => {
      dispatch( {
        type: 'CurveEditor/ZoomRange',
        size: rect,
        cx,
        cy,
        dx,
        dy
      } );
    },
    [ rect, curveLength ]
  );

  const createNodeAndGrab = useCallback(
    ( x0: number, y0: number ): void => {
      if ( !curve ) { return; }

      let x = x0;
      let y = y0;

      const data = curve.createNode(
        x2t( x, range, rect.width ),
        y2v( y, range, rect.height )
      );
      dispatch( {
        type: 'CurveEditor/SelectItems',
        nodes: [ data.$id ]
      } );

      registerMouseEvent(
        ( event, movementSum ) => {
          x += movementSum.x;
          y += movementSum.y;

          curve.moveNodeTime( data.$id, x2t( x, range, rect.width ) );
          curve.moveNodeValue( data.$id, y2v( y, range, rect.height ) );
        },
        () => {
          if ( selectedCurve == null ) { return; }

          const t = x2t( x, range, rect.width );
          const v = y2v( y, range, rect.height );
          curve.moveNodeTime( data.$id, t );
          curve.moveNodeValue( data.$id, v );

          data.time = t;
          data.value = v;

          dispatch( {
            type: 'History/Push',
            description: 'Add Node',
            commands: [
              {
                type: 'curve/createNodeFromData',
                curve: selectedCurve,
                data
              }
            ]
          } );
        }
      );
    },
    [ range, rect, curve ]
  );

  const startSeek = useCallback(
    ( x: number ): void => {
      if ( !automaton ) { return; }
      if ( automaton.isDisabledTimeControls ) { return; }

      const isPlaying = automaton.isPlaying;

      automaton.pause();
      automaton.seek( x2t( x, range, rect.width ) );

      registerMouseEvent(
        ( event ) => {
          automaton.seek( x2t( event.clientX - rect.left, range, rect.width ) );
        },
        ( event ) => {
          automaton.seek( x2t( event.clientX - rect.left, range, rect.width ) );
          if ( isPlaying ) { automaton.play(); }
        }
      );
    },
    [ automaton, range, rect ]
  );

  const handleMouseDown = useCallback(
    mouseCombo( {
      [ MouseComboBit.LMB ]: ( event ) => {
        if ( checkDoubleClick() ) {
          createNodeAndGrab( event.clientX - rect.left, event.clientY - rect.top );
        }
      },
      [ MouseComboBit.LMB + MouseComboBit.Alt ]: ( event ) => {
        startSeek( event.clientX - rect.left );
      },
      [ MouseComboBit.MMB ]: () => {
        registerMouseEvent(
          ( event, movementSum ) => move( movementSum.x, movementSum.y )
        );
      }
    } ),
    [ createNodeAndGrab, startSeek, rect, move ]
  );

  const createNode = useCallback(
    ( x: number, y: number ) => {
      if ( !curve || selectedCurve == null ) {
        showToasty( {
          dispatch,
          kind: ToastyKind.Error,
          message: 'Add Node: No curve is selected! Select a curve before creating a node.'
        } );
        return;
      }

      const t = x2t( x, range, rect.width );
      const v = y2v( y, range, rect.height );
      const data = curve.createNode( t, v );
      dispatch( {
        type: 'CurveEditor/SelectItems',
        nodes: [ data.$id ]
      } );

      dispatch( {
        type: 'History/Push',
        description: 'Add Node',
        commands: [
          {
            type: 'curve/createNodeFromData',
            curve: selectedCurve,
            data
          }
        ]
      } );
    },
    [ range, rect, curve, selectedCurve ]
  );

  const createFx = useCallback(
    ( x: number ) => {
      if ( !curve || selectedCurve == null ) {
        showToasty( {
          dispatch,
          kind: ToastyKind.Error,
          message: 'Add Fx: No curve is selected! Select a curve before creating a node.'
        } );
        return;
      }

      dispatch( {
        type: 'FxSpawner/Open',
        callback: ( name: string ) => {
          const t = x2t( x, range, rect.width );
          const data = curve.createFx( t, 1.0, name );
          if ( data ) {
            dispatch( {
              type: 'CurveEditor/SelectItems',
              fxs: [ data.$id ]
            } );

            dispatch( {
              type: 'History/Push',
              description: 'Add Fx',
              commands: [
                {
                  type: 'curve/createFxFromData',
                  curve: selectedCurve,
                  data
                }
              ]
            } );
          }
        }
      } );
    },
    [ range, rect, curve, selectedCurve ]
  );

  const handleContextMenu = useCallback(
    ( event: React.MouseEvent ): void => {
      event.preventDefault();
      event.stopPropagation();

      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      dispatch( {
        type: 'ContextMenu/Open',
        position: { x: event.clientX, y: event.clientY },
        commands: [
          {
            name: 'Add Node',
            description: 'Add a new bezier curve node.',
            callback: () => createNode( x, y )
          },
          {
            name: 'Add Fx',
            description: 'Add a new fx section.',
            callback: () => createFx( x )
          }
        ]
      } );
    },
    [ rect, createNode, createFx ]
  );

  const handleWheel = useCallback(
    ( event: WheelEvent ): void => {
      event.preventDefault();

      if ( event.shiftKey ) {
        zoom( event.offsetX, event.offsetY, event.deltaY, 0.0 );
      } else if ( event.ctrlKey ) {
        zoom( event.offsetX, event.offsetY, 0.0, event.deltaY );
      } else {
        move( -event.deltaX, -event.deltaY );
      }
    },
    [ zoom, move ]
  );

  useEffect( // 🔥 fuck
    () => {
      const body = refBody.current;
      if ( !body ) { return; }

      body.addEventListener( 'wheel', handleWheel, { passive: false } );
      return () => (
        body.removeEventListener( 'wheel', handleWheel )
      );
    },
    [ handleWheel ]
  );

  return (
    <Root className={ className }>
      <Body ref={ refBody }>
        <SVGRoot
          onMouseDown={ handleMouseDown }
          onContextMenu={ handleContextMenu }
        >
          <TimeValueGrid
            range={ range }
            size={ rect }
          />
          { selectedCurve != null && <>
            <Fxs
              curve={ selectedCurve }
              range={ range }
              size={ rect }
            />
            <CurveEditorGraph
              curve={ selectedCurve }
              range={ range }
              size={ rect }
            />
            <Nodes
              curve={ selectedCurve }
              range={ range }
              size={ rect }
            />
            <StyledLines
              curve={ selectedCurve }
              range={ range }
              size={ rect }
            />
          </> }
        </SVGRoot>
      </Body>
      { curveLength != null && (
        <StyledRangeBar
          range={ range }
          width={ rect.width }
          length={ curveLength }
        />
      ) }
    </Root>
  );
};

export { CurveEditor };
