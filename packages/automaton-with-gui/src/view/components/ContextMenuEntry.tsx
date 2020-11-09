import { Colors } from '../constants/Colors';
import React from 'react';
import styled from 'styled-components';

// == styles =======================================================================================
const Name = styled.div`
  padding: 0.1rem 0.2rem;
  font-size: 0.8rem;
  line-height: 1em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${ Colors.fore };
`;

const Root = styled.div<{ isSelected?: boolean }>`
  display: flex;
  width: 100%;
  height: 1rem;
  border-radius: 0.25rem;
  justify-content: space-between;
  background: ${ ( { isSelected } ) => (
    isSelected ? Colors.back3 : 'none'
  ) };
  cursor: pointer;

  &:hover {
    background: ${ Colors.back3 };
  }

  &:active {
    opacity: 0.5;
  }
`;

// == components ===================================================================================
interface ContextMenuEntryProps {
  className?: string;
  name: string;
  description?: string;
  onClick?: ( event: React.MouseEvent<HTMLDivElement> ) => void;
}

const ContextMenuEntry = ( props: ContextMenuEntryProps ): JSX.Element => {
  const { className, name: text, description, onClick } = props;

  return (
    <Root
      className={ className }
      data-stalker={ description }
      onClick={ onClick }
    >
      <Name>{ text }</Name>
    </Root>
  );
};

export { ContextMenuEntry };
