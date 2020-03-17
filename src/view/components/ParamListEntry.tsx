import { useDispatch, useSelector } from 'react-redux';
import { Colors } from '../constants/Colors';
import { Icons } from '../icons/Icons';
import { ParamStatusLevel } from '../../ParamWithGUI';
import React from 'react';
import { State } from '../states/store';
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
export interface ParamListEntryProps {
  className?: string;
  name: string;
}

export const ParamListEntry = ( props: ParamListEntryProps ): JSX.Element => {
  const { className, name } = props;
  const dispatch = useDispatch();
  const { selectedParam, value, status } = useSelector( ( state: State ) => ( {
    selectedParam: state.curveEditor.selectedParam,
    value: state.automaton.params[ name ].value,
    status: state.automaton.params[ name ].status
  } ) );

  function handleClick(): void {
    dispatch( {
      type: 'CurveEditor/SelectParam',
      param: name
    } );
  }

  return (
    <Root
      className={ className }
      onClick={ handleClick }
      isSelected={ selectedParam === name }
      data-stalker={ name }
    >
      <Name>{ name }</Name>
      {
        status === null
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
