import { BoolParam } from './BoolParam';
import { InspectorHeader } from './InspectorHeader';
import { InspectorHr } from './InspectorHr';
import { InspectorItem } from './InspectorItem';
import { NumberParam } from './NumberParam';
import React from 'react';
import { State } from '../states/store';
import { useSelector } from 'react-redux';

// == component ====================================================================================
const InspectorSnapping = (): JSX.Element => {
  const automaton = useSelector( ( state: State ) => state.automaton.instance );
  const guiSettings = useSelector( ( state: State ) => state.automaton.guiSettings );

  return <>
    { automaton && <>
      <InspectorHeader text="Snapping" />

      <InspectorHr />

      <InspectorItem name="Time">
        <BoolParam
          value={ guiSettings.snapTimeActive }
          onChange={ ( value ) => {
            automaton.setGUISettings( 'snapTimeActive', value );
          } }
          historyDescription="Change Node Time"
        />
      </InspectorItem>
      <InspectorItem name="Time Interval">
        <NumberParam
          type="float"
          value={ guiSettings.snapTimeInterval }
          onChange={ ( value ) => {
            automaton.setGUISettings( 'snapTimeInterval', Math.max( 0.0, value ) );
          } }
          historyDescription="Change Node Time"
        />
      </InspectorItem>

      <InspectorHr />

      <InspectorItem name="Value">
        <BoolParam
          value={ guiSettings.snapValueActive }
          onChange={ ( value ) => {
            automaton.setGUISettings( 'snapValueActive', value );
          } }
          historyDescription="Change Node Value"
        />
      </InspectorItem>
      <InspectorItem name="Value Interval">
        <NumberParam
          type="float"
          value={ guiSettings.snapValueInterval }
          onChange={ ( value ) => {
            automaton.setGUISettings( 'snapValueInterval', Math.max( 0.0, value ) );
          } }
          historyDescription="Change Node Value"
        />
      </InspectorItem>
    </> }
  </>;
};

export { InspectorSnapping };
