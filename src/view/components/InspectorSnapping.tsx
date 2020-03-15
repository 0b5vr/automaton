import React, { useContext } from 'react';
import { BoolParam } from './BoolParam';
import { Contexts } from '../contexts/Context';
import { InspectorHeader } from './InspectorHeader';
import { InspectorHr } from './InspectorHr';
import { InspectorItem } from './InspectorItem';
import { NumberParam } from './NumberParam';
import styled from 'styled-components';

// == styles =======================================================================================
const Root = styled.div`
`;

// == element ======================================================================================
export interface InspectorSnappingProps {
  className?: string;
}

export const InspectorSnapping = ( { className }: InspectorSnappingProps ): JSX.Element => {
  const { state } = useContext( Contexts.Store );
  const automaton = state.automaton.instance;

  return <>
    { automaton && (
      <Root className={ className }>
        <InspectorHeader text="Snapping" />

        <InspectorHr />

        <InspectorItem name="Time">
          <BoolParam
            value={ state.automaton.guiSettings.snapTimeActive }
            onChange={ ( value ) => {
              automaton.setGUISettings( 'snapTimeActive', value );
            } }
            historyDescription="Change Node Time"
          />
        </InspectorItem>
        <InspectorItem name="Time Interval">
          <NumberParam
            type="float"
            value={ state.automaton.guiSettings.snapTimeInterval }
            onChange={ ( value ) => {
              automaton.setGUISettings( 'snapTimeInterval', Math.max( 0.0, value ) );
            } }
            historyDescription="Change Node Time"
          />
        </InspectorItem>

        <InspectorHr />

        <InspectorItem name="Value">
          <BoolParam
            value={ state.automaton.guiSettings.snapValueActive }
            onChange={ ( value ) => {
              automaton.setGUISettings( 'snapValueActive', value );
            } }
            historyDescription="Change Node Value"
          />
        </InspectorItem>
        <InspectorItem name="Value Interval">
          <NumberParam
            type="float"
            value={ state.automaton.guiSettings.snapValueInterval }
            onChange={ ( value ) => {
              automaton.setGUISettings( 'snapValueInterval', Math.max( 0.0, value ) );
            } }
            historyDescription="Change Node Value"
          />
        </InspectorItem>
      </Root>
    ) }
  </>;
};
