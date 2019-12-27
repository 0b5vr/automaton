import { ParamStatus, ParamStatusLevel } from '../../ParamWithGUI';
import React, { useContext } from 'react';
import { Colors } from '../constants/Colors';
import { Contexts } from '../contexts/Context';
import { Icons } from '../icons/Icons';
import styled from 'styled-components';

// == styles =======================================================================================
const Name = styled.div`
  position: absolute;
  left: 0.2rem;
  top: 0;
  width: calc( 100 - 2rem );
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Value = styled.div`
  position: absolute;
  right: 0.2rem;
  bottom: 0.1rem;
  font-size: 0.6rem;
  opacity: 0.7;
`;

const Icon = styled.img`
  position: absolute;
  right: 0.2rem;
  bottom: 0.1rem;
  height: calc( 100% - 0.2rem );
`;

const Root = styled.div<{ isSelected: boolean }>`
  position: relative;
  height: 1.25rem;
  background: ${ ( { isSelected } ) => ( isSelected ? Colors.back4 : Colors.back3 ) };
`;

// == element ======================================================================================
export interface ParamEntryProps {
  className?: string;
  name: string;
  value: number;
  status: ParamStatus;
}

export const ParamEntry = ( { className, name, value, status }: ParamEntryProps ): JSX.Element => {
  const contexts = useContext( Contexts.Store );

  function handleClick(): void {
    contexts.dispatch( {
      type: 'CurveEditor/SelectParam',
      param: name
    } );
  }

  return (
    <Root
      className={ className }
      onClick={ handleClick }
      isSelected={ contexts.state.curveEditor.selectedParam === name }
      data-stalker={ name }
    >
      <Name>{ name }</Name>
      {
        status.level === ParamStatusLevel.OK
          ? <Value>{ value.toFixed( 3 ) }</Value>
          : <Icon
            as={
              status.level === ParamStatusLevel.ERROR
                ? Icons.Error
                : Icons.Warning
            }
            data-stalker={ status.message }
          />
      }
    </Root>
  );
};
