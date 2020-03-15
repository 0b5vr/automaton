import React, { useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Colors } from '../constants/Colors';
import { ContextMenuEntry } from './ContextMenuEntry';
import { State } from '../states/store';
import styled from 'styled-components';

// == styles =======================================================================================
const Container = styled.div`
  position: absolute;
  overflow: hidden;
  padding: 0.25rem;
  border-radius: 0.25rem;
  background: ${ Colors.back2 };
  filter: drop-shadow( 0 0 2px ${ Colors.black } );
  font-size: 0.8rem;
`;

const OverlayBG = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background: rgba( 0, 0, 0, 0 );
`;

const Root = styled.div`
`;

// == element ======================================================================================
export interface ContextMenuProps {
  className?: string;
}

export const ContextMenu = ( { className }: ContextMenuProps ): JSX.Element => {
  const dispatch = useDispatch();
  const refRoot = useRef<HTMLDivElement>( null );

  const rect = refRoot.current?.getBoundingClientRect();
  const position = useSelector( ( state: State ) => state.contextMenu.position );
  const x = position.x - ( rect?.left || 0.0 );
  const y = position.y - ( rect?.top || 0.0 );

  const commands = useSelector( ( state: State ) => state.contextMenu.commands );

  return <Root
    ref={ refRoot }
    className={ className }
  >
    <OverlayBG
      onClick={ () => dispatch( { type: 'ContextMenu/Close' } ) }
    />
    <Container
      style={ {
        left: `${ x }px`,
        top: `${ y }px`
      } }
    >
      { commands.map( ( command ) => (
        <ContextMenuEntry
          key={ command.name }
          name={ command.name }
          description={ command.description }
          onClick={ () => {
            command.command();
            dispatch( { type: 'ContextMenu/Close' } );
          } }
        />
      ) ) }
    </Container>
  </Root>;
};
