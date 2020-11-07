import { Colors } from '../constants/Colors';
import React from 'react';
import styled from 'styled-components';

// == styles =======================================================================================
export const Id = styled.div`
  padding: 0.2rem 0.2rem;
  font-size: 0.6rem;
  line-height: 1em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${ Colors.gray };
`;

export const Name = styled.div`
  padding: 0.1rem 0.2rem;
  font-size: 0.8rem;
  line-height: 1em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${ Colors.fore };
`;

export const Root = styled.div<{ isSelected?: boolean }>`
  display: flex;
  width: 100%;
  height: 1rem;
  padding: 0.125rem 0;
  justify-content: space-between;
  background: ${ ( { isSelected } ) => (
    isSelected ? Colors.back3 : Colors.back2
  ) };
  cursor: pointer;

  &:hover {
    background: ${ Colors.back3 };
  }
`;

// == components ===================================================================================
export interface FxSpawnerEntryProps {
  className?: string;
  name?: string;
  id: string;
  description?: string;
  isSelected?: boolean;
  onClick?: ( event: React.MouseEvent<HTMLDivElement> ) => void;
}

const FxSpawnerEntry = ( props: FxSpawnerEntryProps ): JSX.Element => {
  const { className, name, id, description, isSelected, onClick } = props;

  return (
    <Root
      className={ className }
      data-stalker={ description }
      onClick={ onClick }
      isSelected={ isSelected }
    >
      {
        name
          ? <><Name>{ name }</Name> <Id>{ id }</Id></>
          : <Name>{ id }</Name>
      }
    </Root>
  );
};

export { FxSpawnerEntry };
