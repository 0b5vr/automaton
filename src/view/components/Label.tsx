import { MouseComboBit, mouseCombo } from '../utils/mouseCombo';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TimeValueRange, dx2dt, snapTime, t2x } from '../utils/TimeValueRange';
import { useDispatch, useSelector } from '../states/store';
import { Colors } from '../constants/Colors';
import { Resolution } from '../utils/Resolution';
import { arraySetHas } from '../utils/arraySet';
import { registerMouseEvent } from '../utils/registerMouseEvent';
import styled from 'styled-components';
import { useDoubleClick } from '../utils/useDoubleClick';

// == styles =======================================================================================
const Rect = styled.rect< { selected: boolean } >`
  fill: ${ ( { selected } ) => selected ? Colors.accent : Colors.foresub };
  pointer-events: auto;
  cursor: pointer;
`;

const Line = styled.line< { selected: boolean } >`
  stroke: ${ ( { selected } ) => selected ? Colors.accent : Colors.foresub };
  stroke-width: 1px;
  pointer-events: none;
`;

const Text = styled.text`
  fill: ${ Colors.back1 };
  font-size: 10px;
  pointer-events: none;
`;

// == component ====================================================================================
const Label = ( { name, time, range, size }: {
  name: string;
  time: number;
  range: TimeValueRange;
  size: Resolution;
} ): JSX.Element => {
  const dispatch = useDispatch();
  const {
    automaton,
    guiSettings,
    selectedLabels
  } = useSelector( ( state ) => ( {
    automaton: state.automaton.instance,
    guiSettings: state.automaton.guiSettings,
    selectedLabels: state.timeline.selected.labels
  } ) );
  const checkDoubleClick = useDoubleClick();
  const [ width, setWidth ] = useState( 0.0 );
  const x = t2x( time, range, size.width );
  const refText = useRef<SVGTextElement>( null );

  useEffect(
    () => {
      const text = refText.current;
      if ( text ) {
        setWidth( text.getBBox().width );
      }
    },
    [ refText.current ]
  );

  const isSelected = useMemo(
    (): boolean => arraySetHas( selectedLabels, name ),
    [ selectedLabels ]
  );

  const grabLabel = useCallback(
    (): void => {
      if ( !automaton ) { return; }

      dispatch( {
        type: 'Timeline/SelectLabels',
        labels: [ name ]
      } );

      const timePrev = time;
      let newTime = time;
      let x = 0.0;
      let hasMoved = false;

      registerMouseEvent(
        ( event, movementSum ) => {
          hasMoved = true;
          x += movementSum.x;

          const ignoreSnap = event.altKey;
          newTime = timePrev + dx2dt( x, range, size.width );

          if ( !ignoreSnap ) {
            newTime = snapTime( newTime, range, size.width, guiSettings );
          }

          automaton.setLabel( name, newTime );
        },
        () => {
          if ( !hasMoved ) { return; }

          automaton.setLabel( name, newTime );

          dispatch( {
            type: 'History/Push',
            description: 'Move Label',
            commands: [
              {
                type: 'automaton/moveLabel',
                name,
                time: newTime,
                timePrev
              }
            ]
          } );
        }
      );
    },
    [ automaton, time, name, range, size, guiSettings ]
  );

  const renameLabel = useCallback(
    ( x: number, y: number ): void => {
      if ( !automaton ) { return; }

      dispatch( {
        type: 'TextPrompt/Open',
        position: { x, y },
        placeholder: 'A new name for the label',
        checkValid: ( newName: string ) => {
          if ( newName === '' ) { return 'Create Label: Name cannot be empty.'; }
          if ( name === newName ) { return null; }
          if ( automaton.labels[ newName ] != null ) { return 'Create Label: A label for the given name already exists.'; }
          return null;
        },
        callback: ( newName ) => {
          if ( name === newName ) { return; }

          automaton.deleteLabel( name );
          automaton.setLabel( newName, time );

          dispatch( {
            type: 'History/Push',
            description: 'Rename Label',
            commands: [
              {
                type: 'automaton/deleteLabel',
                name,
                timePrev: time
              },
              {
                type: 'automaton/createLabel',
                name: newName,
                time
              }
            ],
          } );
        }
      } );

    },
    [ automaton, time ]
  );

  const deleteLabel = useCallback(
    (): void => {
      if ( !automaton ) { return; }

      automaton.deleteLabel( name );

      dispatch( {
        type: 'History/Push',
        description: 'Delete Label',
        commands: [
          {
            type: 'automaton/deleteLabel',
            name,
            timePrev: time
          }
        ],
      } );
    },
    [ automaton, time ]
  );

  const handleMouseDown = useCallback(
    mouseCombo( {
      [ MouseComboBit.LMB ]: () => {
        if ( checkDoubleClick() ) {
          deleteLabel();
        } else {
          grabLabel();
        }
      }
    } ),
    [ grabLabel ]
  );

  const handleContextMenu = useCallback(
    ( event: React.MouseEvent ): void => {
      event.preventDefault();
      event.stopPropagation();

      const x = event.clientX;
      const y = event.clientY;

      dispatch( {
        type: 'ContextMenu/Open',
        position: { x, y },
        commands: [
          {
            name: 'Rename Label',
            description: 'Rename the label.',
            callback: () => renameLabel( x, y )
          },
          {
            name: 'Delete Label',
            description: 'Delete the label.',
            callback: () => deleteLabel()
          }
        ]
      } );
    },
    [ renameLabel, deleteLabel ]
  );

  return <>
    <g
      transform={ `translate(${ x },${ size.height })` }
      onMouseDown={ handleMouseDown }
      onContextMenu={ handleContextMenu }
    >
      <Line
        y2={ -size.height }
        selected={ ( isSelected ? 1 : 0 ) as any as boolean } // fuck
      />
      <Rect
        width={ width + 4 }
        height="12"
        y="-12"
        selected={ ( isSelected ? 1 : 0 ) as any as boolean } // fuck
      />
      <Text
        ref={ refText }
        x="2"
        y="-2"
      >{ name }</Text>
    </g>
  </>;
};

export { Label };
