import { Action, State } from '../states/store';
import { useDispatch, useSelector } from 'react-redux';
import { Colors } from '../constants/Colors';
import { ContextMenuEntry } from './ContextMenuEntry';
import { Dispatch } from 'redux';
import React from 'react';
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
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background: rgba( 0, 0, 0, 0 );
`;

// == element ======================================================================================
export interface ContextMenuProps {
  className?: string;
}

const ContextMenu = ( { className }: ContextMenuProps ): JSX.Element => {
  const dispatch = useDispatch<Dispatch<Action>>();

  const position = useSelector( ( state: State ) => state.contextMenu.position );

  const commands = useSelector( ( state: State ) => state.contextMenu.commands );

  return <Root
    className={ className }
  >
    <OverlayBG
      onClick={ () => dispatch( { type: 'ContextMenu/Close' } ) }
    />
    <Container
      style={ {
        left: `${ position.x }px`,
        top: `${ position.y }px`
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

export { ContextMenu };
