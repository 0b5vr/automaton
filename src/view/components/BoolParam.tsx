import React, { useContext, useEffect, useRef, useState } from 'react';
import { Colors } from '../constants/Colors';
import { Contexts } from '../contexts/Context';
import styled from 'styled-components';
import { useDoubleClick } from '../utils/useDoubleClick';

// == styles =======================================================================================
const Input = styled.input< { isInvalid?: boolean } >`
  display: block;
  width: calc( 100% - 0.2rem );
  height: calc( 100% - 0.2rem );
  font-size: 0.8rem;
  font-family: 'Roboto', sans-serif;
  padding: 0.1rem;
  border: none;
  background: ${ ( { isInvalid } ) => ( isInvalid ? Colors.errorBright : Colors.foresub ) };
  color: ${ Colors.back1 };
  pointer-events: auto;
`;

const Check = styled.div`
  width: 0.5rem;
  height: 0.5rem;
  margin: 0.25rem;
  background: ${ Colors.fore };
`;

const Box = styled.div`
  display: inline-block;
  width: 1rem;
  height: 1rem;
  background: ${ Colors.back3 };
  cursor: pointer;
  pointer-events: auto;

  &:active {
    opacity: 0.5;
  }
`;

const Root = styled.div`
  overflow: hidden;
  width: 4rem;
  height: 1rem;
  text-align: center;
`;

// == functions ====================================================================================
function inputToValue( value: string ): boolean | null {
  if ( value === 'true' ) {
    return true;
  } else if ( value === 'false' ) {
    return false;
  } else {
    return null;
  }
}

// == element ======================================================================================
export interface BoolParamProps {
  value: boolean;
  historyDescription?: string;
  className?: string;
  onChange?: ( value: boolean ) => void;
}

export const BoolParam = ( props: BoolParamProps ): JSX.Element => {
  const { dispatch } = useContext( Contexts.Store );
  const { className, value, historyDescription, onChange } = props;
  const [ isInput, setIsInput ] = useState<boolean>( false );
  const refInput = useRef<HTMLInputElement>( null );
  const [ inputValue, setInputValue ] = useState<string>( '' );
  const [ inputPrevValue, setInputPrevValue ] = useState<boolean>( false );
  const [ isInputInvalid, setIsInputInvalid ] = useState<boolean>( false );
  const checkDoubleClick = useDoubleClick();

  useEffect( () => { // focus on the input
    if ( isInput ) {
      refInput.current!.focus();
    }
  }, [ isInput ] );

  const pushHistoryAndDo = ( v: boolean | null, vPrev: boolean ): void => {
    if ( v == null ) {
      onChange && onChange( vPrev );
      return;
    }

    const redo = (): void => {
      onChange && onChange( v );
    };

    if ( historyDescription ) {
      const undo = (): void => {
        onChange && onChange( vPrev );
      };

      dispatch( {
        type: 'History/Push',
        entry: {
          description: historyDescription,
          redo,
          undo
        }
      } );
    }
    redo();
  };

  const handleClick = ( event: React.MouseEvent ): void => {
    event.preventDefault();
    event.stopPropagation();

    if ( event.buttons === 1 ) {
      if ( checkDoubleClick() ) {
        setIsInput( true );
        setInputValue( String( value ) );
        setInputPrevValue( value );
        setIsInputInvalid( false );
      }
    }
  };

  const handleClickBox = ( event: React.MouseEvent ): void => {
    event.preventDefault();
    event.stopPropagation();

    if ( event.buttons === 1 ) {
      pushHistoryAndDo( !value, value );
    }
  };

  const handleChange = ( event: React.ChangeEvent<HTMLInputElement> ): void => {
    setInputValue( event.target.value );

    const v = inputToValue( event.target.value );
    setIsInputInvalid( v == null );
    if ( v != null ) {
      onChange && onChange( v );
    }
  };

  const handleKeyDown = ( event: React.KeyboardEvent<HTMLInputElement> ): void => {
    if ( event.nativeEvent.key === 'Enter' ) {
      event.preventDefault();

      const v = inputToValue( inputValue );
      pushHistoryAndDo( v, inputPrevValue );

      setIsInput( false );
    } else if ( event.nativeEvent.key === 'Escape' ) {
      event.preventDefault();

      onChange && onChange( inputPrevValue );

      setIsInput( false );
    }
  };

  const handleBlur = (): void => {
    const v = inputToValue( inputValue );
    pushHistoryAndDo( v, inputPrevValue );

    setIsInput( false );
  };

  return (
    <Root className={ className }
      onMouseDown={ handleClick }
    >
      {
        isInput ? (
          <Input
            ref={ refInput }
            value={ inputValue }
            onChange={ handleChange }
            onKeyDown={ handleKeyDown }
            onBlur={ handleBlur }
            isInvalid={ isInputInvalid }
          />
        ) : (
          <Box
            onMouseDown={ handleClickBox }
          >
            { value && <Check /> }
          </Box>
        )
      }
    </Root>
  );
};
