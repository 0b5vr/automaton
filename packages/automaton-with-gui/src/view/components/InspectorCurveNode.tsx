import { InspectorHeader } from './InspectorHeader';
import { InspectorHr } from './InspectorHr';
import { InspectorItem } from './InspectorItem';
import { NumberParam } from './NumberParam';
import { useDispatch, useSelector } from '../states/store';
import { useTimeUnit } from '../utils/useTimeUnit';
import React from 'react';

// == compoennt ====================================================================================
interface Props {
  curveId: string;
  node: string;
}

const InspectorCurveNode = ( props: Props ): JSX.Element | null => {
  const dispatch = useDispatch();
  const { automaton, curves, useBeatInGUI } = useSelector( ( state ) => ( {
    automaton: state.automaton.instance,
    curves: state.automaton.curves,
    useBeatInGUI: state.automaton.guiSettings.useBeatInGUI,
  } ) );
  const curve = automaton?.getCurveById( props.curveId ) || null;
  const node = curves[ props.curveId ].nodes[ props.node ];
  const { displayToTime, timeToDisplay } = useTimeUnit();

  return ( curve && <>
    <InspectorHeader text="Node" />

    <InspectorHr />

    <InspectorItem name={ useBeatInGUI ? 'Beat' : 'Time' }>
      <NumberParam
        type="float"
        value={ timeToDisplay( node[ 0 ] ) }
        onChange={ ( time ) => { curve.moveNodeTime( node.$id, displayToTime( time ) ); } }
        onSettle={ ( value, valuePrev ) => {
          dispatch( {
            type: 'History/Push',
            description: 'Change Node Time',
            commands: [
              {
                type: 'curve/moveNodeTime',
                curveId: props.curveId,
                node: node.$id,
                time: displayToTime( value ),
                timePrev: displayToTime( valuePrev ),
              }
            ]
          } );
        } }
      />
    </InspectorItem>
    <InspectorItem name="Value">
      <NumberParam
        type="float"
        value={ node[ 1 ] }
        onChange={ ( value ) => { curve.moveNodeValue( node.$id, value ); } }
        onSettle={ ( value, valuePrev ) => {
          dispatch( {
            type: 'History/Push',
            description: 'Change Node Value',
            commands: [
              {
                type: 'curve/moveNodeValue',
                curveId: props.curveId,
                node: node.$id,
                value,
                valuePrev,
              }
            ]
          } );
        } }
      />
    </InspectorItem>

    <InspectorHr />

    <InspectorItem name={ useBeatInGUI ? 'In Beat' : 'In Time' }>
      <NumberParam
        type="float"
        value={ timeToDisplay( node[ 2 ] ) }
        onChange={ ( value ) => { curve.moveHandleTime( node.$id, 'in', displayToTime( value ) ); } }
        onSettle={ ( value, valuePrev ) => {
          dispatch( {
            type: 'History/Push',
            description: 'Change Node Handle Time',
            commands: [
              {
                type: 'curve/moveHandleTime',
                curveId: props.curveId,
                node: node.$id,
                dir: 'in',
                time: displayToTime( value ),
                timePrev: displayToTime( valuePrev ),
              }
            ]
          } );
        } }
      />
    </InspectorItem>
    <InspectorItem name="In Value">
      <NumberParam
        type="float"
        value={ node[ 3 ] }
        onChange={ ( value ) => { curve.moveHandleValue( node.$id, 'in', value ); } }
        onSettle={ ( value, valuePrev ) => {
          dispatch( {
            type: 'History/Push',
            description: 'Change Node Handle Value',
            commands: [
              {
                type: 'curve/moveHandleValue',
                curveId: props.curveId,
                node: node.$id,
                dir: 'in',
                value,
                valuePrev,
              }
            ]
          } );
        } }
      />
    </InspectorItem>

    <InspectorHr />

    <InspectorItem name={ useBeatInGUI ? 'Out Beat' : 'Out Time' }>
      <NumberParam
        type="float"
        value={ timeToDisplay( node[ 4 ] ) }
        onChange={ ( value ) => { curve.moveHandleTime( node.$id, 'out', displayToTime( value ) ); } }
        onSettle={ ( value, valuePrev ) => {
          dispatch( {
            type: 'History/Push',
            description: 'Change Node Handle Time',
            commands: [
              {
                type: 'curve/moveHandleTime',
                curveId: props.curveId,
                node: node.$id,
                dir: 'out',
                time: displayToTime( value ),
                timePrev: displayToTime( valuePrev ),
              }
            ]
          } );
        } }
      />
    </InspectorItem>
    <InspectorItem name="Out Value">
      <NumberParam
        type="float"
        value={ node[ 5 ] }
        onChange={ ( value ) => { curve.moveHandleValue( node.$id, 'out', value ); } }
        onSettle={ ( value, valuePrev ) => {
          dispatch( {
            type: 'History/Push',
            description: 'Change Node Handle Value',
            commands: [
              {
                type: 'curve/moveHandleValue',
                curveId: props.curveId,
                node: node.$id,
                dir: 'out',
                value,
                valuePrev,
              }
            ]
          } );
        } }
      />
    </InspectorItem>
  </> ) ?? null;
};

export { InspectorCurveNode };
