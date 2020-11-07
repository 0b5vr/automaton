import { InspectorHeader } from './InspectorHeader';
import { InspectorHr } from './InspectorHr';
import { InspectorItem } from './InspectorItem';
import { NumberParam } from './NumberParam';
import { useDispatch, useSelector } from '../states/store';
import React from 'react';

// == compoennt ====================================================================================
interface Props {
  name: string;
}

const InspectorLabel = ( { name }: Props ): JSX.Element | null => {
  const dispatch = useDispatch();
  const { automaton, stateLabels } = useSelector( ( state ) => ( {
    automaton: state.automaton.instance,
    stateLabels: state.automaton.labels
  } ) );
  const time = stateLabels[ name ];

  if ( !automaton ) { return null; }

  return <>
    <InspectorHeader text={ `Label: ${ name }` } />

    <InspectorHr />

    <InspectorItem name="Time">
      <NumberParam
        type="float"
        value={ time }
        onChange={ ( newTime ) => { automaton.setLabel( name, newTime ); } }
        onSettle={ ( newTime, timePrev ) => {
          dispatch( {
            type: 'History/Push',
            description: 'Move Label',
            commands: [
              {
                type: 'automaton/moveLabel',
                name,
                time: newTime,
                timePrev
              }
            ]
          } );
        } }
      />
    </InspectorItem>
  </>;
};

export { InspectorLabel };
