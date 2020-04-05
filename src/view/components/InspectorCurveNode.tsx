import { InspectorHeader } from './InspectorHeader';
import { InspectorHr } from './InspectorHr';
import { InspectorItem } from './InspectorItem';
import { NumberParam } from './NumberParam';
import React from 'react';
import { useSelector } from '../states/store';

// == compoennt ====================================================================================
interface Props {
  curve: number;
  node: string;
}

const InspectorCurveNode = ( props: Props ): JSX.Element => {
  const { automaton, curves } = useSelector( ( state ) => ( {
    automaton: state.automaton.instance,
    curves: state.automaton.curves
  } ) );
  const curve = automaton?.getCurve( props.curve ) || null;
  const node = curves[ props.curve ].nodes[ props.node ];

  return <>
    { curve && <>
      <InspectorHeader text="Node" />

      <InspectorHr />

      <InspectorItem name="Time">
        <NumberParam
          type="float"
          value={ node.time }
          onChange={ ( value ) => { curve.moveNodeTime( node.$id, value ); } }
          historyDescription="Change Node Time"
        />
      </InspectorItem>
      <InspectorItem name="Value">
        <NumberParam
          type="float"
          value={ node.value }
          onChange={ ( value ) => { curve.moveNodeValue( node.$id, value ); } }
          historyDescription="Change Node Value"
        />
      </InspectorItem>

      <InspectorHr />

      <InspectorItem name="In Time">
        <NumberParam
          type="float"
          value={ node.in?.time || 0.0 }
          onChange={ ( value ) => { curve.moveHandleTime( node.$id, 'in', value ); } }
          historyDescription="Change Node Handle Time"
        />
      </InspectorItem>
      <InspectorItem name="In Value">
        <NumberParam
          type="float"
          value={ node.in?.value || 0.0 }
          onChange={ ( value ) => { curve.moveHandleValue( node.$id, 'in', value ); } }
          historyDescription="Change Node Handle Value"
        />
      </InspectorItem>

      <InspectorHr />

      <InspectorItem name="Out Time">
        <NumberParam
          type="float"
          value={ node.out?.time || 0.0 }
          onChange={ ( value ) => { curve.moveHandleTime( node.$id, 'out', value ); } }
          historyDescription="Change Node Handle Time"
        />
      </InspectorItem>
      <InspectorItem name="Out Value">
        <NumberParam
          type="float"
          value={ node.out?.value || 0.0 }
          onChange={ ( value ) => { curve.moveHandleValue( node.$id, 'out', value ); } }
          historyDescription="Change Node Handle Value"
        />
      </InspectorItem>
    </> }
  </>;
};

export { InspectorCurveNode };
