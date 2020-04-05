import { BoolParam } from './BoolParam';
import { CHANNEL_FX_ROW_MAX } from '../../ChannelWithGUI';
import { InspectorHeader } from './InspectorHeader';
import { InspectorHr } from './InspectorHr';
import { InspectorItem } from './InspectorItem';
import { NumberParam } from './NumberParam';
import React from 'react';
import { useSelector } from '../states/store';

// == component ====================================================================================
export interface InspectorCurveFxProps {
  curve: number;
  fx: string;
}

const InspectorCurveFx = ( props: InspectorCurveFxProps ): JSX.Element => {
  const { automaton, curves } = useSelector( ( state ) => ( {
    automaton: state.automaton.instance,
    curves: state.automaton.curves
  } ) );
  const curve = automaton?.getCurve( props.curve ) || null;
  const fx = curves[ props.curve ].fxs[ props.fx ];

  return <>
    { automaton && curve && <>
      <InspectorHeader text={ `Fx: ${ automaton.getFxDefinitionName( fx.def ) }` } />

      <InspectorHr />

      <InspectorItem name="Time">
        <NumberParam
          type="float"
          value={ fx.time }
          onChange={ ( value ) => { curve.moveFx( fx.$id, value ); } }
          historyDescription="Change Fx Time"
        />
      </InspectorItem>
      <InspectorItem name="Length">
        <NumberParam
          type="float"
          value={ fx.length }
          onChange={ ( value ) => { curve.resizeFx( fx.$id, value ); } }
          historyDescription="Change Fx Length"
        />
      </InspectorItem>
      <InspectorItem name="Row">
        <NumberParam
          type="int"
          value={ fx.row }
          onChange={ ( value ) => {
            curve.changeFxRow(
              fx.$id,
              Math.min( Math.max( value, 0.0 ), CHANNEL_FX_ROW_MAX - 1 )
            );
          } }
          historyDescription="Change Fx Row"
        />
      </InspectorItem>
      <InspectorItem name="Bypass">
        <BoolParam
          value={ !!fx.bypass }
          onChange={ ( value ) => {
            curve.bypassFx( fx.$id, value );
          } }
          historyDescription="Toggle Fx Bypass"
        />
      </InspectorItem>

      <InspectorHr />

      { Object.entries( automaton.getFxDefinitionParams( fx.def )! )
      .map( ( [ name, fxParam ] ) => (
        <InspectorItem name={ fxParam.name || name } key={ name }>
          <>
            { ( fxParam.type === 'float' || fxParam.type === 'int' ) && (
              <NumberParam
                type={ fxParam.type }
                value={ fx.params[ name ] }
                onChange={ ( value ) => {
                  curve.changeFxParam( fx.$id, name, value );
                } }
                historyDescription="Change Fx Param"
              />
            ) }
            { ( fxParam.type === 'boolean' ) && (
              <BoolParam
                value={ fx.params[ name ] }
                onChange={ ( value ) => {
                  curve.changeFxParam( fx.$id, name, value );
                } }
                historyDescription="Change Fx Param"
              />
            ) }
          </>
        </InspectorItem>
      ) ) }
    </> }
  </>;
};

export { InspectorCurveFx };
