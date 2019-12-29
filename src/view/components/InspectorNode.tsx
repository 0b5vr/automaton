import React, { useContext } from 'react';
import { BezierNode } from '@fms-cat/automaton';
import { Contexts } from '../contexts/Context';
import { InspectorHeader } from './InspectorHeader';
import { InspectorHr } from './InspectorHr';
import { InspectorItem } from './InspectorItem';
import { NumberParam } from './NumberParam';
import { WithID } from '../../types/WithID';
import styled from 'styled-components';

// == styles =======================================================================================
const Root = styled.div`
`;

// == element ======================================================================================
export interface InspectorNodeProps {
  className?: string;
  node: BezierNode & WithID;
}

export const InspectorNode = ( { className, node }: InspectorNodeProps ): JSX.Element => {
  const contexts = useContext( Contexts.Store );
  const automaton = contexts.state.automaton.instance;
  const { selectedParam } = contexts.state.curveEditor;
  const param = automaton && selectedParam && automaton.getParam( selectedParam ) || null;

  return <>
    { param && (
      <Root className={ className }>
        <InspectorHeader text="Node" />

        <InspectorHr />

        <InspectorItem name="Time">
          <NumberParam
            type="float"
            value={ node.time }
            onChange={ ( value ) => { param.moveNodeTime( node.$id, value ); } }
            historyDescription="Change Node Time"
          />
        </InspectorItem>
        <InspectorItem name="Value">
          <NumberParam
            type="float"
            value={ node.value }
            onChange={ ( value ) => { param.moveNodeValue( node.$id, value ); } }
            historyDescription="Change Node Value"
          />
        </InspectorItem>

        <InspectorHr />

        <InspectorItem name="In Time">
          <NumberParam
            type="float"
            value={ node.in?.time || 0.0 }
            onChange={ ( value ) => { param.moveHandleTime( node.$id, 'in', value ); } }
            historyDescription="Change Node Handle Time"
          />
        </InspectorItem>
        <InspectorItem name="In Value">
          <NumberParam
            type="float"
            value={ node.in?.value || 0.0 }
            onChange={ ( value ) => { param.moveHandleValue( node.$id, 'in', value ); } }
            historyDescription="Change Node Handle Value"
          />
        </InspectorItem>

        <InspectorHr />

        <InspectorItem name="Out Time">
          <NumberParam
            type="float"
            value={ node.out?.time || 0.0 }
            onChange={ ( value ) => { param.moveHandleTime( node.$id, 'out', value ); } }
            historyDescription="Change Node Handle Time"
          />
        </InspectorItem>
        <InspectorItem name="Out Value">
          <NumberParam
            type="float"
            value={ node.out?.value || 0.0 }
            onChange={ ( value ) => { param.moveHandleValue( node.$id, 'out', value ); } }
            historyDescription="Change Node Handle Value"
          />
        </InspectorItem>
      </Root>
    ) }
  </>;
};
