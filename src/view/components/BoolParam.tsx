import { Colors } from '../constants/Colors';
import { MouseComboBit, mouseCombo } from '../utils/mouseCombo';
import { useDoubleClick } from '../utils/useDoubleClick';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

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

  /**
   * Will be called whenever it changes its value.
   * See also: onSettle
   */
  onChange?: ( value: boolean ) => void;

  /**
   * Will be called when the user finished tweaking the value.
   * onChange will also be called.
   * See also: onChange
   */
  onSettle?: ( value: boolean, valuePrev: boolean ) => void;

  className?: string;
}

const BoolParam = ( props: BoolParamProps ): JSX.Element => {
  const { className, value, onChange, onSettle } = props;
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

  const trySettle = useCallback(
    ( value: boolean | null, valuePrev: boolean ): void => {
      if ( value == null ) {
        onChange && onChange( valuePrev );
        return;
      }

      if ( value === valuePrev ) {
        return;
      }

      onChange && onChange( value );
      onSettle && onSettle( value, valuePrev );
    },
    [ onChange, onSettle ]
  );

  const handleClick = useCallback(
    ( event ) => mouseCombo( event, {
      [ MouseComboBit.LMB ]: () => {
        if ( checkDoubleClick() ) {
          setIsInput( true );
          setInputValue( String( value ) );
          setInputPrevValue( value );
          setIsInputInvalid( false );
        }
      }
    } ),
    [ checkDoubleClick, value ]
  );

  const handleClickBox = useCallback(
    ( event ) => mouseCombo( event, {
      [ MouseComboBit.LMB ]: () => {
        trySettle( !value, value );
      }
    } ),
    [ value, trySettle ]
  );

  const handleChange = ( event: React.ChangeEvent<HTMLInputElement> ): void => { // TODO: useCallback
    setInputValue( event.target.value );

    const v = inputToValue( event.target.value );
    setIsInputInvalid( v == null );
    if ( v != null ) {
      onChange && onChange( v );
    }
  };

  const handleKeyDown = ( event: React.KeyboardEvent<HTMLInputElement> ): void => { // TODO: useCallback
    if ( event.nativeEvent.key === 'Enter' ) {
      event.preventDefault();

      const v = inputToValue( inputValue );
      trySettle( v, inputPrevValue );

      setIsInput( false );
    } else if ( event.nativeEvent.key === 'Escape' ) {
      event.preventDefault();

      onChange && onChange( inputPrevValue );

      setIsInput( false );
    }
  };

  const handleBlur = (): void => { // TODO: useCallback
    const v = inputToValue( inputValue );
    trySettle( v, inputPrevValue );

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

export { BoolParam };
