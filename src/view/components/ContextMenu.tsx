import React, { useContext, useRef } from 'react';
import { Colors } from '../constants/Colors';
import { ContextMenuEntry } from './ContextMenuEntry';
import { Contexts } from '../contexts/Context';
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
  const { state, dispatch } = useContext( Contexts.Store );
  const refRoot = useRef<HTMLDivElement>( null );

  const rect = refRoot.current?.getBoundingClientRect();
  const x = state.contextMenu.position.x - ( rect?.left || 0.0 );
  const y = state.contextMenu.position.y - ( rect?.top || 0.0 );

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
      { state.contextMenu.commands.map( ( command ) => (
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
