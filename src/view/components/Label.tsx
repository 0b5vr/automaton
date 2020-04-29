import React, { useCallback, useEffect, useRef, useState } from 'react';
import { TimeValueRange, t2x } from '../utils/TimeValueRange';
import { useDispatch, useSelector } from '../states/store';
import { Colors } from '../constants/Colors';
import { Resolution } from '../utils/Resolution';
import styled from 'styled-components';

// == styles =======================================================================================
const Rect = styled.rect`
  fill: ${ Colors.foresub };
  pointer-events: auto;
`;

const Line = styled.line`
  stroke: ${ Colors.foresub };
  stroke-width: 1px;
  pointer-events: none;
`;

const Text = styled.text`
  fill: ${ Colors.back1 };
  font-size: 10px;
  pointer-events: auto;
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
  } = useSelector( ( state ) => ( {
    automaton: state.automaton.instance,
  } ) );
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
    [ automaton, time, range ]
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
    [ automaton, time, range ]
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
      onContextMenu={ handleContextMenu }
    >
      <Line y2={ -size.height } />
      <Rect width={ width + 4 } height="12" y="-12" />
      <Text ref={ refText } x="2" y="-2">{ name }</Text>
    </g>
  </>;
};

export { Label };
