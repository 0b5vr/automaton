import { BoolParam } from './BoolParam';
import { CURVE_FX_ROW_MAX } from '../../CurveWithGUI';
import { InspectorHeader } from './InspectorHeader';
import { InspectorHr } from './InspectorHr';
import { InspectorItem } from './InspectorItem';
import { NumberParam } from './NumberParam';
import { clamp } from '../../utils/clamp';
import { useDispatch, useSelector } from '../states/store';
import { useTimeUnit } from '../utils/useTimeUnit';
import React from 'react';

// == component ====================================================================================
export interface InspectorCurveFxProps {
  curveId: string;
  fx: string;
}

const InspectorCurveFx = ( props: InspectorCurveFxProps ): JSX.Element | null => {
  const dispatch = useDispatch();
  const { automaton, stateFx, useBeatInGUI } = useSelector( ( state ) => ( {
    automaton: state.automaton.instance,
    stateFx: state.automaton.curves[ props.curveId ]?.fxs[ props.fx ],
    useBeatInGUI: state.automaton.guiSettings.useBeatInGUI,
  } ) );
  const curve = automaton?.getCurveById( props.curveId ) || null;
  const fxDefParams = stateFx && automaton?.getFxDefinitionParams( stateFx.def );
  const { displayToTime, timeToDisplay } = useTimeUnit();

  return ( automaton && curve && stateFx && <>
    <InspectorHeader text={ `Fx: ${ automaton.getFxDefinitionName( stateFx.def ) }` } />

    <InspectorHr />

    <InspectorItem name={ useBeatInGUI ? 'Beat' : 'Time' }>
      <NumberParam
        type="float"
        value={ timeToDisplay( stateFx.time ) }
        onChange={ ( value ) => { curve.moveFx( stateFx.$id, displayToTime( value ) ); } }
        onSettle={ ( value, valuePrev ) => {
          dispatch( {
            type: 'History/Push',
            description: 'Change Fx Length',
            commands: [
              {
                type: 'curve/moveFx',
                curveId: props.curveId,
                fx: stateFx.$id,
                time: displayToTime( value ),
                timePrev: displayToTime( valuePrev ),
              }
            ]
          } );
        } }
      />
    </InspectorItem>
    <InspectorItem name="Length">
      <NumberParam
        type="float"
        value={ timeToDisplay( stateFx.length ) }
        onChange={ ( value ) => { curve.resizeFx( stateFx.$id, displayToTime( value ) ); } }
        onSettle={ ( value, valuePrev ) => {
          dispatch( {
            type: 'History/Push',
            description: 'Change Fx Length',
            commands: [
              {
                type: 'curve/resizeFx',
                curveId: props.curveId,
                fx: stateFx.$id,
                length: displayToTime( value ),
                lengthPrev: displayToTime( valuePrev ),
              }
            ]
          } );
        } }
      />
    </InspectorItem>
    <InspectorItem name="Row">
      <NumberParam
        type="int"
        value={ stateFx.row }
        onChange={ ( row ) => {
          curve.changeFxRow(
            stateFx.$id,
            clamp( row, 0.0, CURVE_FX_ROW_MAX - 1 )
          );
        } }
        onSettle={ ( row, rowPrev ) => {
          dispatch( {
            type: 'History/Push',
            description: 'Change Fx Row',
            commands: [
              {
                type: 'curve/changeFxRow',
                curveId: props.curveId,
                fx: stateFx.$id,
                row: clamp( row, 0, CURVE_FX_ROW_MAX - 1 ),
                rowPrev
              }
            ]
          } );
        } }
      />
    </InspectorItem>
    <InspectorItem name="Bypass">
      <BoolParam
        value={ !!stateFx.bypass }
        onChange={ ( value ) => {
          curve.bypassFx( stateFx.$id, value );
        } }
        onSettle={ ( value ) => {
          dispatch( {
            type: 'History/Push',
            description: 'Toggle Fx Bypass',
            commands: [
              {
                type: 'curve/bypassFx',
                curveId: props.curveId,
                fx: stateFx.$id,
                bypass: value
              }
            ]
          } );
        } }
      />
    </InspectorItem>

    <InspectorHr />

    { fxDefParams && Object.entries( fxDefParams ).map( ( [ name, fxParam ] ) => (
      <InspectorItem name={ fxParam.name || name } key={ name }>
        <>
          { ( fxParam.type === 'float' || fxParam.type === 'int' ) && (
            <NumberParam
              type={ fxParam.type }
              value={ stateFx.params[ name ] }
              onChange={ ( value ) => {
                curve.changeFxParam( stateFx.$id, name, value );
              } }
              onSettle={ ( value, valuePrev ) => {
                dispatch( {
                  type: 'History/Push',
                  description: 'Change Fx Param',
                  commands: [
                    {
                      type: 'curve/changeFxParam',
                      curveId: props.curveId,
                      fx: stateFx.$id,
                      key: name,
                      value,
                      valuePrev
                    }
                  ]
                } );
              } }
            />
          ) }
          { ( fxParam.type === 'boolean' ) && (
            <BoolParam
              value={ stateFx.params[ name ] }
              onChange={ ( value ) => {
                curve.changeFxParam( stateFx.$id, name, value );
              } }
              onSettle={ ( value, valuePrev ) => {
                dispatch( {
                  type: 'History/Push',
                  description: 'Change Fx Param',
                  commands: [
                    {
                      type: 'curve/changeFxParam',
                      curveId: props.curveId,
                      fx: stateFx.$id,
                      key: name,
                      value,
                      valuePrev
                    }
                  ]
                } );
              } }
            />
          ) }
        </>
      </InspectorItem>
    ) ) }
  </> ) ?? null;
};

export { InspectorCurveFx };
