import React, { useEffect, useRef, useState } from 'react';
import { Colors } from '../constants/Colors';
import { registerMouseEvent } from '../utils/registerMouseEvent';
import styled from 'styled-components';
import { useDispatch } from '../states/store';
import { useDoubleClick } from '../utils/useDoubleClick';

// == styles =======================================================================================
const Input = styled.input< { isInvalid: boolean } >`
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
type ValueType = 'int' | 'float';

function inputToValue( value: string, type: ValueType ): number | null {
  if ( type === 'int' ) {
    const result = parseInt( value );
    if ( Number.isNaN( result ) ) { return null; }
    return result;
  } else {
    const result = parseFloat( value );
    if ( Number.isNaN( result ) ) { return null; }
    return result;
  }
}

function valueToInput( value: number, type: ValueType ): string {
  if ( type === 'int' ) {
    return Math.floor( value ).toString();
  } else {
    return ( value ).toFixed( 3 );
  }
}

// == element ======================================================================================
export interface NumberParamProps {
  type: ValueType;
  value: number;

  /**
   * A description text that will be showed at the undo / redo button.
   * If it is not given, **changing this value doesn't do anything to the history stack**.
   */
  historyDescription?: string;
  className?: string;
  onChange?: ( value: number ) => void;
}

const NumberParam = ( props: NumberParamProps ): JSX.Element => {
  const dispatch = useDispatch();
  const { className, type, value, historyDescription, onChange } = props;
  const [ isInput, setIsInput ] = useState<boolean>( false );
  const refInput = useRef<HTMLInputElement>( null );
  const [ inputValue, setInputValue ] = useState<string>( '' );
  const [ inputPrevValue, setInputPrevValue ] = useState<number>( 0.0 );
  const [ isInputInvalid, setIsInputInvalid ] = useState<boolean>( false );
  const checkDoubleClick = useDoubleClick();

  useEffect( () => { // focus on the input
    if ( isInput ) {
      refInput.current!.focus();
    }
  }, [ isInput ] );

  const pushHistoryAndDo = ( v: number | null, vPrev: number ): void => {
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
      } else {
        if ( props.type === 'int' ) {
          const vPrev = value;
          let v = vPrev;
          let hasMoved = false;

          registerMouseEvent(
            ( event, movementSum ) => {
              hasMoved = true;

              const exp = event.shiftKey;
              // const exp = event.ctrlKey || event.metaKey;
              const fine = event.altKey;

              if ( exp ) {
                const dyAbs = Math.abs( -movementSum.y );
                const dySign = Math.sign( -movementSum.y );
                for ( let i = 0; i < dyAbs; i ++ ) {
                  const vAbs = Math.abs( v );
                  const vSign = Math.sign( v + 1E-4 * dySign );
                  const order = Math.floor(
                    Math.log10( vAbs + 1E-4 * dySign * vSign )
                  ) - 1 - ( fine ? 1 : 0 );
                  v += Math.max( 0.1, Math.pow( 10.0, order ) ) * dySign;
                }
              } else {
                v += ( fine ? 0.1 : 1.0 ) * -movementSum.y;
              }

              onChange && onChange( Math.round( v ) );
            },
            () => {
              if ( !hasMoved ) { return; }

              pushHistoryAndDo( v, vPrev );
            }
          );
        } else {
          const vPrev = value;
          let v = vPrev;
          let hasMoved = false;

          registerMouseEvent(
            ( event, movementSum ) => {
              hasMoved = true;

              const exp = event.shiftKey;
              // const exp = event.ctrlKey || event.metaKey;
              const fine = event.altKey;

              if ( exp ) {
                const dyAbs = Math.abs( -movementSum.y );
                const dySign = Math.sign( -movementSum.y );
                for ( let i = 0; i < dyAbs; i ++ ) {
                  const vAbs = Math.abs( v );
                  const vSign = Math.sign( v + 1E-4 * dySign );
                  const order = Math.floor(
                    Math.log10( vAbs + 1E-4 * dySign * vSign )
                  ) - 1 - ( fine ? 1 : 0 );
                  v += Math.max( 0.001, Math.pow( 10.0, order ) ) * dySign;
                }
              } else {
                v += ( fine ? 0.001 : 0.01 ) * -movementSum.y;
              }

              onChange && onChange( v );
            },
            () => {
              if ( !hasMoved ) { return; }

              pushHistoryAndDo( v, vPrev );
            }
          );
        }
      }
    }
  };

  const handleChange = ( event: React.ChangeEvent<HTMLInputElement> ): void => {
    setInputValue( event.target.value );

    const v = inputToValue( event.target.value, type );
    setIsInputInvalid( v == null );
    if ( v != null ) {
      onChange && onChange( v );
    }
  };

  const handleKeyDown = ( event: React.KeyboardEvent<HTMLInputElement> ): void => {
    if ( event.nativeEvent.key === 'Enter' ) {
      event.preventDefault();

      const v = inputToValue( inputValue, type );
      pushHistoryAndDo( v, inputPrevValue );

      setIsInput( false );
    } else if ( event.nativeEvent.key === 'Escape' ) {
      event.preventDefault();

      onChange && onChange( inputPrevValue );

      setIsInput( false );
    }
  };

  const handleBlur = (): void => {
    const v = inputToValue( inputValue, type );
    pushHistoryAndDo( v, inputPrevValue );

    setIsInput( false );
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
            onBlur={ handleBlur }
            isInvalid={ isInputInvalid }
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

export { NumberParam };
