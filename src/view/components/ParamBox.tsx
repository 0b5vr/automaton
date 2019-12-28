import React, { useEffect, useRef, useState } from 'react';
import { Colors } from '../constants/Colors';
import styled from 'styled-components';
import { useDoubleClick } from '../utils/useDoubleClick';

// == styles =======================================================================================
const Input = styled.input`
  display: block;
  width: calc( 100% - 0.2rem );
  height: calc( 100% - 0.2rem );
  font-size: 0.8rem;
  padding: 0.1rem;
  border: none;
  text-align: center;
  background: ${ Colors.foresub };
  color: ${ Colors.back1 };
  pointer-events: auto;
`;

const Value = styled.div`
  width: calc( 100% - 0.2rem );
  height: calc( 100% - 0.2rem );
  margin: 0.1rem;
  font-size: 0.8rem;
  line-height: 1em;
  color: ${ Colors.fore };
  cursor: pointer;
  pointer-events: auto;
`;

const Root = styled.div`
  overflow: hidden;
  width: 4rem;
  height: 1rem;
  text-align: center;
  background: ${ Colors.back3 };
`;

// == functions ====================================================================================
type ValueType = 'int' | 'float' | 'string';

type ActualType<T extends ValueType> =
  T extends 'int' ? number :
  T extends 'float' ? number :
  T extends 'string' ? string :
  never;

function inputToValue<T extends ValueType>( value: string, type: T ): ActualType<T> | null {
  if ( type === 'int' ) {
    const result = parseInt( value );
    if ( Number.isNaN( result ) ) { return null; }
    return result as ActualType<T>;
  } else if ( type === 'float' ) {
    const result = parseFloat( value );
    if ( Number.isNaN( result ) ) { return null; }
    return result as ActualType<T>;
  } else {
    return value as ActualType<T>;
  }
}

function valueToInput<T extends ValueType>( value: ActualType<T>, type: T ): string {
  if ( type === 'int' ) {
    return Math.floor( value as number ).toString();
  } else if ( type === 'float' ) {
    return ( value as number ).toFixed( 3 );
  } else {
    return value as string;
  }
}

// == element ======================================================================================
export interface ParamBoxProps<T extends ValueType> {
  type: T;
  value: ActualType<T>;
  className?: string;
  onChange?: ( value: ActualType<T> ) => void;
  onPressTab?: () => void;
}

export const ParamBox = <T extends ValueType>( props: ParamBoxProps<T> ): JSX.Element => {
  const { className, type, value, onChange: onChange, onPressTab } = props;
  const [ isInput, setIsInput ] = useState<boolean>( false );
  const refInput = useRef<HTMLInputElement>( null );
  const [ inputValue, setInputValue ] = useState<string>( '' );
  const checkDoubleClick = useDoubleClick();

  useEffect( () => { // focus on the input
    if ( isInput ) {
      refInput.current!.focus();
    }
  }, [ isInput ] );

  const handleClick = ( event: React.MouseEvent ): void => {
    event.preventDefault();
    event.stopPropagation();

    if ( event.buttons === 1 ) {
      if ( checkDoubleClick() ) {
        setIsInput( true );
        setInputValue( String( value ) );
      } else {
        // TODO
      }
    }
  };

  const handleChange = ( event: React.ChangeEvent<HTMLInputElement> ): void => {
    setInputValue( event.target.value );
  };

  const handleKeyDown = ( event: React.KeyboardEvent<HTMLInputElement> ): void => {
    if ( event.nativeEvent.key === 'Enter' ) {
      event.preventDefault();

      const result = inputToValue( inputValue, type );
      if ( result != null ) {
        onChange && onChange( result );
      }

      setIsInput( false );
    } else if ( event.nativeEvent.key === 'Escape' ) {
      event.preventDefault();

      setIsInput( false );
    } else if ( event.nativeEvent.key === 'Tab' ) {
      event.preventDefault();

      const result = inputToValue( inputValue, type );
      if ( result != null ) {
        onChange && onChange( result );
      }

      setIsInput( false );
    }
  };

  const displayValue = valueToInput( value, type );

  return (
    <Root className={ className }>
      {
        isInput ? (
          <Input
            ref={ refInput }
            value={ inputValue }
            onChange={ handleChange }
            onKeyDown={ handleKeyDown }
          />
        ) : (
          <Value
            onMouseDown={ handleClick }
          >{ displayValue }</Value>
        )
      }
    </Root>
  );
};
