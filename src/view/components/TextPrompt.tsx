import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { ToastyKind, showToasty } from '../states/Toasty';
import { useDispatch, useSelector } from '../states/store';
import { Colors } from '../constants/Colors';
import styled from 'styled-components';

// == styles =======================================================================================
const Input = styled.input< { isValid: boolean } >`
  display: block;
  position: absolute;
  overflow: hidden;
  padding: 4px;
  border-radius: 4px;
  background: ${ ( { isValid } ) => ( isValid ? Colors.foresub : Colors.errorBright ) };
  color: ${ Colors.back1 };
  width: 240px;
  filter: drop-shadow( 0 0 2px ${ Colors.black } );
  font-size: 0.8rem;
  font-family: 'Roboto', sans-serif;
  line-height: 1em;
  border: none;
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
const TextPrompt = ( { className }: {
  className?: string;
} ): JSX.Element => {
  const dispatch = useDispatch();

  const {
    isVisible,
    position,
    text,
    placeholder,
    checkValid,
    callback
  } = useSelector( ( state ) => ( {
    isVisible: state.textPrompt.isVisible,
    position: state.textPrompt.position,
    text: state.textPrompt.text,
    placeholder: state.textPrompt.placeholder,
    checkValid: state.textPrompt.checkValid,
    callback: state.textPrompt.callback
  } ) );

  const refInput = useRef<HTMLInputElement>( null );

  const style: React.CSSProperties = useMemo(
    () => {
      const width = document.documentElement.clientWidth;
      const height = document.documentElement.clientHeight;

      const ret: React.CSSProperties = {};
      ( position.x < width - 240 )
        ? ( ret.left = position.x )
        : ( ret.right = width - position.x );
      ( position.y < height - 120 )
        ? ( ret.top = position.y )
        : ( ret.bottom = height - position.y );
      return ret;
    },
    [ position ]
  );

  const isInputValid = useMemo(
    () => !checkValid || checkValid( text ) === null,
    [ text, checkValid ]
  );

  const handleChange = useCallback(
    ( event: React.ChangeEvent<HTMLInputElement> ) => {
      dispatch( {
        type: 'TextPrompt/SetText',
        text: event?.target.value
      } );
    },
    []
  );

  const handleKeyDown = useCallback(
    ( event: React.KeyboardEvent<HTMLInputElement> ) => {
      if ( event.nativeEvent.key === 'Enter' ) {
        const error = checkValid && checkValid( text );
        if ( error != null ) {
          showToasty( {
            dispatch,
            kind: ToastyKind.Error,
            message: error
          } );
        } else {
          callback!( text );
        }
        dispatch( { type: 'TextPrompt/Close' } );
      } else if ( event.nativeEvent.key === 'Escape' ) {
        dispatch( { type: 'TextPrompt/Close' } );
      }
    },
    [ text, checkValid, callback ]
  );

  useEffect(
    () => {
      if ( isVisible ) {
        refInput.current?.focus();
        refInput.current?.select();
      }
    },
    [ isVisible ]
  );

  return <Root
    className={ className }
  >
    <OverlayBG
      onClick={ () => dispatch( { type: 'TextPrompt/Close' } ) }
    />
    <Input
      ref={ refInput }
      style={ style }
      value={ text }
      placeholder={ placeholder }
      onChange={ handleChange }
      onKeyDown={ handleKeyDown }
      isValid={ isInputValid }
    />
  </Root>;
};

export { TextPrompt };
