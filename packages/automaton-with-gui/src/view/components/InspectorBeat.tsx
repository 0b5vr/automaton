import { BoolParam } from './BoolParam';
import { InspectorHeader } from './InspectorHeader';
import { InspectorHr } from './InspectorHr';
import { InspectorItem } from './InspectorItem';
import { NumberParam } from './NumberParam';
import { useSelector } from '../states/store';
import React from 'react';

// == component ====================================================================================
const InspectorBeat = (): JSX.Element | null => {
  const { automaton, guiSettings } = useSelector( ( state ) => ( {
    automaton: state.automaton.instance,
    guiSettings: state.automaton.guiSettings
  } ) );

  return ( automaton && <>
    <InspectorHeader text="Beat" />

    <InspectorHr />

    <InspectorItem
      name="BPM"
      description="Beat per minute of the song."
    >
      <NumberParam
        type="float"
        value={ guiSettings.bpm }
        onChange={ ( value ) => {
          automaton.setGUISettings( 'bpm', Math.max( 0.0, value ) );
        } }
      />
    </InspectorItem>

    <InspectorItem
      name="Beat Offset"
      description="Offset from the beginning of the beat."
    >
      <NumberParam
        type="float"
        value={ guiSettings.beatOffset }
        onChange={ ( value ) => {
          automaton.setGUISettings( 'beatOffset', value );
        } }
      />
    </InspectorItem>

    <InspectorHr />

    <InspectorItem
      name="Beat Snap"
      description="Make items snap to the beat."
    >
      <BoolParam
        value={ guiSettings.snapBeatActive }
        onChange={ ( value ) => {
          automaton.setGUISettings( 'snapBeatActive', value );
        } }
      />
    </InspectorItem>
    <InspectorItem
      name="Use Beat in GUI"
      description="Show beat instead of time in GUI."
    >
      <BoolParam
        value={ guiSettings.useBeatInGUI }
        onChange={ ( value ) => {
          automaton.setGUISettings( 'useBeatInGUI', value );
        } }
      />
    </InspectorItem>
  </> ) ?? null;
};

export { InspectorBeat };
