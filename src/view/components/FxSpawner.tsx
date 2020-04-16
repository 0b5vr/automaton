import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from '../states/store';
import { Colors } from '../constants/Colors';
import { FxSpawnerEntry } from './FxSpawnerEntry';
import { Scrollable } from './Scrollable';
import { combineArraysUnique } from '../utils/combineArraysUnique';
import styled from 'styled-components';

// == styles =======================================================================================
const Input = styled.input`
  display: block;
  width: calc( 100% - 0.5rem );
  font-size: 1rem;
  font-family: 'Roboto', sans-serif;
  line-height: 1em;
  padding: 0.25rem;
  border: none;
  background: ${ Colors.back1 };
  color: ${ Colors.fore };
  pointer-events: auto;
`;

const FxList = styled( Scrollable )`
  height: 10rem;
`;

const Container = styled.div`
  position: absolute;
  left: calc( 50% - 10rem );
  top: 1rem;
  width: 20rem;
  overflow: hidden;
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
  background: ${ Colors.black };
  opacity: 0.6;
`;

const Root = styled.div`
`;

// == element ======================================================================================
export interface FxSpawnerProps {
  className?: string;
}

const FxSpawner = ( { className }: FxSpawnerProps ): JSX.Element => {
  const dispatch = useDispatch();
  const [ query, setQuery ] = useState<string>( '' );
  const [ focus, setFocus ] = useState<number>( 0 );
  const refInput = useRef<HTMLInputElement>( null );
  const { isVisible, recently, callback, automaton, fxDefinitions } = useSelector( ( state ) => ( {
    isVisible: state.fxSpawner.isVisible,
    recently: state.fxSpawner.recently,
    callback: state.fxSpawner.callback,
    automaton: state.automaton.instance,
    fxDefinitions: state.automaton.fxDefinitions
  } ) );

  useEffect( () => { // focus the input when it gets activated
    if ( isVisible ) {
      refInput.current?.focus();
    }
  }, [ isVisible ] );

  const fxs = useMemo( () => (
    combineArraysUnique(
      recently,
      Object.keys( fxDefinitions )
    )
  ), [ fxDefinitions, recently ] );

  const filteredFxs = useMemo( () => {
    const queries = query.split( /\s+/ );
    return fxs.filter( ( fx ) => queries.every( ( query ) => (
      fx.toLowerCase().includes( query.toLowerCase() ) ||
      automaton?.getFxDefinitionName( fx )?.toLowerCase().includes( query.toLowerCase() ) ||
      automaton?.getFxDefinitionDescription( fx )?.toLowerCase().includes( query.toLowerCase() )
    ) ) );
  }, [ fxs, query ] );

  function selectFx( name: string ): void {
    callback!( name );
    dispatch( {
      type: 'FxSpawner/AddRecently',
      name
    } );
    dispatch( { type: 'FxSpawner/Close' } );
  }

  function handleChange( event: React.ChangeEvent<HTMLInputElement> ): void {
    setQuery( event.target.value );
    setFocus( 0 );
  }

  function handleKeyDown( event: React.KeyboardEvent<HTMLInputElement> ): void {
    if ( event.nativeEvent.key === 'Enter' ) {
      const fx = filteredFxs[ focus ];
      if ( fx ) {
        selectFx( fx );
      } else {
        dispatch( { type: 'FxSpawner/Close' } );
      }
    } else if ( event.nativeEvent.key === 'Escape' ) {
      dispatch( { type: 'FxSpawner/Close' } );
    } else if ( event.nativeEvent.key === 'ArrowDown' ) {
      event.preventDefault();

      let newFocus = focus + 1;
      if ( !filteredFxs || newFocus === filteredFxs.length ) {
        newFocus = 0;
      }
      setFocus( newFocus );
    } else if ( event.nativeEvent.key === 'ArrowUp' ) {
      event.preventDefault();

      let newFocus = focus - 1;
      if ( newFocus === -1 ) {
        newFocus = ( filteredFxs && filteredFxs.length !== 0 ) ? ( filteredFxs.length - 1 ) : 0;
      }
      setFocus( newFocus );
    }
  }

  return <>
    { automaton && (
      <Root className={ className }>
        <OverlayBG
          onClick={ () => dispatch( { type: 'FxSpawner/Close' } ) }
        />
        <Container>
          <Input
            ref={ refInput }
            value={ query }
            placeholder="Add an fx..."
            onChange={ handleChange }
            onKeyDown={ handleKeyDown }
          />
          <FxList>
            { filteredFxs!.map( ( fx, i ) => (
              <FxSpawnerEntry
                key={ fx }
                name={ automaton.getFxDefinitionName( fx ) || undefined }
                id={ fx }
                description={ automaton.getFxDefinitionDescription( fx ) || undefined }
                isSelected={ focus === i }
                onClick={ () => selectFx( fx ) }
              />
            ) ) }
            { filteredFxs.length === 0 && (
              <FxSpawnerEntry
                name="No result found"
                id=":("
                description="Try another word!"
              />
            ) }
          </FxList>
        </Container>
      </Root>
    ) }
  </>;
};

export { FxSpawner };
