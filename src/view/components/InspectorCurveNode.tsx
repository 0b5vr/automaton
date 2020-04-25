import { useDispatch, useSelector } from '../states/store';
import { InspectorHeader } from './InspectorHeader';
import { InspectorHr } from './InspectorHr';
import { InspectorItem } from './InspectorItem';
import { NumberParam } from './NumberParam';
import React from 'react';

// == compoennt ====================================================================================
interface Props {
  curve: number;
  node: string;
}

const InspectorCurveNode = ( props: Props ): JSX.Element => {
  const dispatch = useDispatch();
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
          onChange={ ( time ) => { curve.moveNodeTime( node.$id, time ); } }
          onSettle={ ( time, timePrev ) => {
            dispatch( {
              type: 'History/Push',
              description: 'Change Node Time',
              commands: [
                {
                  type: 'curve/moveNodeTime',
                  curve: props.curve,
                  node: node.$id,
                  time,
                  timePrev
                }
              ]
            } );
          } }
        />
      </InspectorItem>
      <InspectorItem name="Value">
        <NumberParam
          type="float"
          value={ node.value }
          onChange={ ( value ) => { curve.moveNodeValue( node.$id, value ); } }
          onSettle={ ( value, valuePrev ) => {
            dispatch( {
              type: 'History/Push',
              description: 'Change Node Value',
              commands: [
                {
                  type: 'curve/moveNodeValue',
                  curve: props.curve,
                  node: node.$id,
                  value,
                  valuePrev
                }
              ]
            } );
          } }
        />
      </InspectorItem>

      <InspectorHr />

      <InspectorItem name="In Time">
        <NumberParam
          type="float"
          value={ node.in?.time || 0.0 }
          onChange={ ( value ) => { curve.moveHandleTime( node.$id, 'in', value ); } }
          onSettle={ ( time, timePrev ) => {
            dispatch( {
              type: 'History/Push',
              description: 'Change Node Handle Time',
              commands: [
                {
                  type: 'curve/moveHandleTime',
                  curve: props.curve,
                  node: node.$id,
                  dir: 'in',
                  time,
                  timePrev
                }
              ]
            } );
          } }
        />
      </InspectorItem>
      <InspectorItem name="In Value">
        <NumberParam
          type="float"
          value={ node.in?.value || 0.0 }
          onChange={ ( value ) => { curve.moveHandleValue( node.$id, 'in', value ); } }
          onSettle={ ( value, valuePrev ) => {
            dispatch( {
              type: 'History/Push',
              description: 'Change Node Handle Value',
              commands: [
                {
                  type: 'curve/moveHandleValue',
                  curve: props.curve,
                  node: node.$id,
                  dir: 'in',
                  value,
                  valuePrev
                }
              ]
            } );
          } }
        />
      </InspectorItem>

      <InspectorHr />

      <InspectorItem name="Out Time">
        <NumberParam
          type="float"
          value={ node.out?.time || 0.0 }
          onChange={ ( value ) => { curve.moveHandleTime( node.$id, 'out', value ); } }
          onSettle={ ( time, timePrev ) => {
            dispatch( {
              type: 'History/Push',
              description: 'Change Node Handle Time',
              commands: [
                {
                  type: 'curve/moveHandleTime',
                  curve: props.curve,
                  node: node.$id,
                  dir: 'out',
                  time,
                  timePrev
                }
              ]
            } );
          } }
        />
      </InspectorItem>
      <InspectorItem name="Out Value">
        <NumberParam
          type="float"
          value={ node.out?.value || 0.0 }
          onChange={ ( value ) => { curve.moveHandleValue( node.$id, 'out', value ); } }
          onSettle={ ( value, valuePrev ) => {
            dispatch( {
              type: 'History/Push',
              description: 'Change Node Handle Value',
              commands: [
                {
                  type: 'curve/moveHandleValue',
                  curve: props.curve,
                  node: node.$id,
                  dir: 'out',
                  value,
                  valuePrev
                }
              ]
            } );
          } }
        />
      </InspectorItem>
    </> }
  </>;
};

export { InspectorCurveNode };
