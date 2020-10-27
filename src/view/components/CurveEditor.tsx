import { Colors } from '../constants/Colors';
import { CurveEditorFx } from './CurveEditorFx';
import { CurveEditorFxBg } from './CruveEditorFxBg';
import { CurveEditorGraph } from './CurveEditorGraph';
import { CurveEditorNode } from './CurveEditorNode';
import { MouseComboBit, mouseCombo } from '../utils/mouseCombo';
import { RangeBar } from './RangeBar';
import { Resolution } from '../utils/Resolution';
import { TimeValueGrid } from './TimeValueGrid';
import { TimeValueLines } from './TimeValueLines';
import { TimeValueRange, snapTime, snapValue, x2t, y2v } from '../utils/TimeValueRange';
import { registerMouseEvent } from '../utils/registerMouseEvent';
import { showToasty } from '../states/Toasty';
import { useDispatch, useSelector } from '../states/store';
import { useDoubleClick } from '../utils/useDoubleClick';
import { useRect } from '../utils/useRect';
import React, { useCallback, useEffect, useRef } from 'react';
import styled from 'styled-components';

// == microcomponent ===============================================================================
const Lines = ( { curveId, range, size }: {
  curveId: string;
  range: TimeValueRange;
  size: Resolution;
} ): JSX.Element => {
  const { time, value } = useSelector( ( state ) => ( {
    time: state.automaton.curvesPreview[ curveId ].previewTime,
    value: state.automaton.curvesPreview[ curveId ].previewValue
  } ) );

  return <TimeValueLines
    range={ range }
    size={ size }
    time={ time ?? undefined }
    value={ value ?? undefined }
  />;
};

const Nodes = ( { curveId, range, size }: {
  curveId: string;
  range: TimeValueRange;
  size: Resolution;
} ): JSX.Element => {
  const { nodes } = useSelector( ( state ) => ( {
    nodes: state.automaton.curves[ curveId ].nodes
  } ) );

  // 👾 See: https://github.com/yannickcr/eslint-plugin-react/issues/2584
  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <>
    { nodes && Object.values( nodes ).map( ( node ) => (
      <CurveEditorNode
        key={ node.$id }
        curveId={ curveId }
        node={ node }
        range={ range }
        size={ size }
      />
    ) ) }
  </>;
};

const Fxs = ( { curveId, range, size }: {
  curveId: string;
  range: TimeValueRange;
  size: Resolution;
} ): JSX.Element => {
  const { fxs } = useSelector( ( state ) => ( {
    fxs: state.automaton.curves[ curveId ].fxs
  } ) );

  return <>
    { fxs && Object.values( fxs ).map( ( fx ) => (
      <CurveEditorFxBg
        key={ fx.$id }
        fx={ fx }
        range={ range }
        size={ size }
      />
    ) ) }
    { fxs && Object.values( fxs ).map( ( fx ) => (
      <CurveEditorFx
        key={ fx.$id }
        curveId={ curveId }
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
    guiSettings,
    automaton
  } = useSelector( ( state ) => ( {
    selectedCurve: state.curveEditor.selectedCurve,
    range: state.curveEditor.range,
    guiSettings: state.automaton.guiSettings,
    automaton: state.automaton.instance
  } ) );
  const { curveLength } = useSelector( ( state ) => ( {
    curveLength: selectedCurve != null ? state.automaton.curves[ selectedCurve ].length : null
  } ) );

  const curve = selectedCurve != null && automaton?.getCurveById( selectedCurve ) || null;

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
    [ dispatch, rect ]
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
    [ dispatch, rect ]
  );

  const createNodeAndGrab = useCallback(
    ( x0: number, y0: number ): void => {
      if ( !curve ) { return; }

      let x = x0;
      let y = y0;
      const timePrev = x2t( x, range, rect.width );
      const valuePrev = y2v( y, range, rect.height );
      let time = timePrev;
      let value = valuePrev;

      const data = curve.createNode( time, value );
      dispatch( {
        type: 'CurveEditor/SelectItems',
        nodes: [ data.$id ]
      } );

      registerMouseEvent(
        ( event, movementSum ) => {
          x += movementSum.x;
          y += movementSum.y;

          const holdTime = event.ctrlKey || event.metaKey;
          const holdValue = event.shiftKey;
          const ignoreSnap = event.altKey;

          time = holdTime ? timePrev : x2t( x, range, rect.width );
          value = holdValue ? valuePrev : y2v( y, range, rect.height );

          if ( !ignoreSnap ) {
            if ( !holdTime ) { time = snapTime( time, range, rect.width, guiSettings ); }
            if ( !holdValue ) { value = snapValue( value, range, rect.height, guiSettings ); }
          }

          curve.moveNodeTime( data.$id, time );
          curve.moveNodeValue( data.$id, value );
        },
        () => {
          if ( selectedCurve == null ) { return; }

          curve.moveNodeTime( data.$id, time );
          curve.moveNodeValue( data.$id, value );

          data.time = time;
          data.value = value;

          dispatch( {
            type: 'History/Push',
            description: 'Add Node',
            commands: [
              {
                type: 'curve/createNodeFromData',
                curveId: selectedCurve,
                data
              }
            ]
          } );
        }
      );
    },
    [ range, rect, curve, guiSettings, dispatch, selectedCurve ]
  );

  const handleMouseDown = useCallback(
    ( event ) => mouseCombo( event, {
      [ MouseComboBit.LMB ]: ( event ) => {
        if ( checkDoubleClick() ) {
          createNodeAndGrab( event.clientX - rect.left, event.clientY - rect.top );
        }
      },
      [ MouseComboBit.MMB ]: () => {
        registerMouseEvent(
          ( event, movementSum ) => move( movementSum.x, movementSum.y )
        );
      }
    } ),
    [ checkDoubleClick, createNodeAndGrab, rect.left, rect.top, move ]
  );

  const createNode = useCallback(
    ( x: number, y: number ) => {
      if ( !curve || selectedCurve == null ) {
        showToasty( {
          dispatch,
          kind: 'error',
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
            curveId: selectedCurve,
            data
          }
        ]
      } );
    },
    [ range, rect, curve, selectedCurve, dispatch ]
  );

  const createFx = useCallback(
    ( x: number ) => {
      if ( !curve || selectedCurve == null ) {
        showToasty( {
          dispatch,
          kind: 'error',
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
                  curveId: selectedCurve,
                  data
                }
              ]
            } );
          }
        }
      } );
    },
    [ range, rect, curve, selectedCurve, dispatch ]
  );

  const handleContextMenu = useCallback(
    ( event: React.MouseEvent ): void => {
      event.preventDefault();

      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      dispatch( {
        type: 'ContextMenu/Push',
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
    [ rect, createNode, createFx, dispatch ]
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
              curveId={ selectedCurve }
              range={ range }
              size={ rect }
            />
            <CurveEditorGraph
              curveId={ selectedCurve }
              range={ range }
              size={ rect }
            />
            <Nodes
              curveId={ selectedCurve }
              range={ range }
              size={ rect }
            />
            <StyledLines
              curveId={ selectedCurve }
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
