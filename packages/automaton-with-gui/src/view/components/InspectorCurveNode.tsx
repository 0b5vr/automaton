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
  const { automaton, stateNode, useBeatInGUI } = useSelector( ( state ) => ( {
    automaton: state.automaton.instance,
    stateNode: state.automaton.curves[ props.curveId ]?.nodes[ props.node ],
    useBeatInGUI: state.automaton.guiSettings.useBeatInGUI,
  } ) );
  const curve = automaton?.getCurveById( props.curveId ) || null;
  const { displayToTime, timeToDisplay } = useTimeUnit();

  return ( curve && stateNode && <>
    <InspectorHeader text="Node" />

    <InspectorHr />

    <InspectorItem name={ useBeatInGUI ? 'Beat' : 'Time' }>
      <NumberParam
        type="float"
        value={ timeToDisplay( stateNode.time ) }
        onChange={ ( time ) => { curve.moveNodeTime( stateNode.$id, displayToTime( time ) ); } }
        onSettle={ ( value, valuePrev ) => {
          dispatch( {
            type: 'History/Push',
            description: 'Change Node Time',
            commands: [
              {
                type: 'curve/moveNodeTime',
                curveId: props.curveId,
                node: stateNode.$id,
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
        value={ stateNode.value }
        onChange={ ( value ) => { curve.moveNodeValue( stateNode.$id, value ); } }
        onSettle={ ( value, valuePrev ) => {
          dispatch( {
            type: 'History/Push',
            description: 'Change Node Value',
            commands: [
              {
                type: 'curve/moveNodeValue',
                curveId: props.curveId,
                node: stateNode.$id,
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
        value={ timeToDisplay( stateNode.inTime ) }
        onChange={ ( value ) => { curve.moveHandleTime( stateNode.$id, 'in', displayToTime( value ) ); } }
        onSettle={ ( value, valuePrev ) => {
          dispatch( {
            type: 'History/Push',
            description: 'Change Node Handle Time',
            commands: [
              {
                type: 'curve/moveHandleTime',
                curveId: props.curveId,
                node: stateNode.$id,
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
        value={ stateNode.inValue }
        onChange={ ( value ) => { curve.moveHandleValue( stateNode.$id, 'in', value ); } }
        onSettle={ ( value, valuePrev ) => {
          dispatch( {
            type: 'History/Push',
            description: 'Change Node Handle Value',
            commands: [
              {
                type: 'curve/moveHandleValue',
                curveId: props.curveId,
                node: stateNode.$id,
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
        value={ timeToDisplay( stateNode.outTime ) }
        onChange={ ( value ) => { curve.moveHandleTime( stateNode.$id, 'out', displayToTime( value ) ); } }
        onSettle={ ( value, valuePrev ) => {
          dispatch( {
            type: 'History/Push',
            description: 'Change Node Handle Time',
            commands: [
              {
                type: 'curve/moveHandleTime',
                curveId: props.curveId,
                node: stateNode.$id,
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
        value={ stateNode.outValue }
        onChange={ ( value ) => { curve.moveHandleValue( stateNode.$id, 'out', value ); } }
        onSettle={ ( value, valuePrev ) => {
          dispatch( {
            type: 'History/Push',
            description: 'Change Node Handle Value',
            commands: [
              {
                type: 'curve/moveHandleValue',
                curveId: props.curveId,
                node: stateNode.$id,
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
