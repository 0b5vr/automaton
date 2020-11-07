import { BoolParam } from './BoolParam';
import { InspectorHeader } from './InspectorHeader';
import { InspectorHr } from './InspectorHr';
import { InspectorItem } from './InspectorItem';
import { NumberParam } from './NumberParam';
import { useSelector } from '../states/store';
import React from 'react';

// == component ====================================================================================
const InspectorSnapping = (): JSX.Element | null => {
  const { automaton, guiSettings } = useSelector( ( state ) => ( {
    automaton: state.automaton.instance,
    guiSettings: state.automaton.guiSettings
  } ) );

  return ( automaton && <>
    <InspectorHeader text="Snapping" />

    <InspectorHr />

    <InspectorItem name="Time">
      <BoolParam
        value={ guiSettings.snapTimeActive }
        onChange={ ( value ) => {
          automaton.setGUISettings( 'snapTimeActive', value );
        } }
      />
    </InspectorItem>
    <InspectorItem name="Time Interval">
      <NumberParam
        type="float"
        value={ guiSettings.snapTimeInterval }
        onChange={ ( value ) => {
          automaton.setGUISettings( 'snapTimeInterval', Math.max( 0.0, value ) );
        } }
      />
    </InspectorItem>

    <InspectorHr />

    <InspectorItem name="Value">
      <BoolParam
        value={ guiSettings.snapValueActive }
        onChange={ ( value ) => {
          automaton.setGUISettings( 'snapValueActive', value );
        } }
      />
    </InspectorItem>
    <InspectorItem name="Value Interval">
      <NumberParam
        type="float"
        value={ guiSettings.snapValueInterval }
        onChange={ ( value ) => {
          automaton.setGUISettings( 'snapValueInterval', Math.max( 0.0, value ) );
        } }
      />
    </InspectorItem>

    <InspectorHr />

    <InspectorItem name="Beat">
      <BoolParam
        value={ guiSettings.snapBeatActive }
        onChange={ ( value ) => {
          automaton.setGUISettings( 'snapBeatActive', value );
        } }
      />
    </InspectorItem>
    <InspectorItem name="BPM">
      <NumberParam
        type="float"
        value={ guiSettings.snapBeatBPM }
        onChange={ ( value ) => {
          automaton.setGUISettings( 'snapBeatBPM', Math.max( 0.0, value ) );
        } }
      />
    </InspectorItem>
  </> ) ?? null;
};

export { InspectorSnapping };
