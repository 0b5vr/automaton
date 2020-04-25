import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from '../states/store';
import { Colors } from '../constants/Colors';
import { InspectorHeader } from './InspectorHeader';
import { InspectorHr } from './InspectorHr';
import { InspectorItem } from './InspectorItem';
import { NumberParam } from './NumberParam';
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

const InspectorGeneral = (): JSX.Element => {
  const dispatch = useDispatch();
  const {
    automaton,
    settingsMode,
    initResolution
  } = useSelector( ( state ) => ( {
    automaton: state.automaton.instance,
    settingsMode: state.settings.mode,
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

  return <>
    { automaton && <>
      <InspectorHeader text="General Config" />

      <InspectorHr />

      <InspectorItem name="Resolution">
        <NumberParam
          type="int"
          value={ resolution }
          onChange={ ( value ) => {
            setResolution( Math.max( 0.0, value ) );
          } }
        />
      </InspectorItem>

      <ConfirmButton
        onClick={ () => {
          automaton.setResolution( resolution );

          dispatch( {
            type: 'History/Drop'
          } );
        } }
      >
        Apply
      </ConfirmButton>
    </> }
  </>;
};

export { InspectorGeneral };
