import { Colors } from '../constants/Colors';
import { InspectorHeader } from './InspectorHeader';
import { InspectorHr } from './InspectorHr';
import { InspectorItem } from './InspectorItem';
import { NumberParam } from './NumberParam';
import { useDispatch, useSelector } from '../states/store';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

// == styles =======================================================================================
const ConfirmButton = styled.div`
  margin: 4px auto 0;
  font-size: 0.8rem;
  line-height: 1.2rem;
  width: 4rem;
  text-align: center;
  background: ${ Colors.back3 };
  cursor: pointer;

  &:hover {
    background: ${ Colors.back4 };
  }

  &:active {
    background: ${ Colors.back1 };
  }
`;

// == element ======================================================================================
export interface InspectorGeneralProps {
  className?: string;
}

const InspectorGeneral = (): JSX.Element | null => {
  const dispatch = useDispatch();
  const {
    automaton,
    settingsMode,
    minimizedPrecisionTime,
    minimizedPrecisionValue,
    initResolution
  } = useSelector( ( state ) => ( {
    automaton: state.automaton.instance,
    settingsMode: state.settings.mode,
    minimizedPrecisionTime: state.automaton.guiSettings.minimizedPrecisionTime,
    minimizedPrecisionValue: state.automaton.guiSettings.minimizedPrecisionValue,
    initResolution: state.automaton.resolution
  } ) );
  const [ resolution, setResolution ] = useState( 0.0 );

  useEffect(
    () => {
      if ( settingsMode === 'general' ) {
        setResolution( initResolution );
      }
    },
    [ automaton, settingsMode, initResolution ]
  );

  return ( automaton && <>
    <InspectorHeader text="General Config" />

    <InspectorHr />

    <InspectorItem
      name="Min Prec Time"
      description="Specify precision of time axis for minimized serialization."
    >
      <NumberParam
        type="int"
        value={ minimizedPrecisionTime }
        onChange={ ( value ) => {
          automaton.setGUISettings( 'minimizedPrecisionTime', Math.max( 0, value ) );
        } }
      />
    </InspectorItem>

    <InspectorItem
      name="Min Prec Value"
      description="Specify precision of value axis for minimized serialization."
    >
      <NumberParam
        type="int"
        value={ minimizedPrecisionValue }
        onChange={ ( value ) => {
          automaton.setGUISettings( 'minimizedPrecisionValue', Math.max( 0, value ) );
        } }
      />
    </InspectorItem>

    <InspectorHr />

    <InspectorItem
      name="Resolution"
      description="Specify samples per second of curves."
    >
      <NumberParam
        type="int"
        value={ resolution }
        onChange={ ( value ) => {
          setResolution( Math.max( 0, value ) );
        } }
      />
    </InspectorItem>

    <ConfirmButton
      data-stalker="Apply the change of resolution."
      onClick={ () => {
        automaton.setResolution( resolution );

        dispatch( {
          type: 'History/Drop'
        } );
      } }
    >
      Apply
    </ConfirmButton>
  </> ) ?? null;
};

export { InspectorGeneral };
