import { InspectorHeader, InspectorHr, InspectorItem, InspectorLabel } from './InspectorComponents';
import React, { useContext } from 'react';
import { BezierNode } from '@fms-cat/automaton';
import { Contexts } from '../contexts/Context';
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
        <InspectorHeader>Node</InspectorHeader>

        <InspectorHr />

        <InspectorItem>
          <InspectorLabel>Time</InspectorLabel>
          <NumberParam
            type="float"
            value={ node.time }
            onChange={ ( value ) => { param.moveNodeTime( node.$id, value ); } }
            historyDescription="Change Node Time"
          />
        </InspectorItem>
        <InspectorItem>
          <InspectorLabel>Value</InspectorLabel>
          <NumberParam
            type="float"
            value={ node.value }
            onChange={ ( value ) => { param.moveNodeValue( node.$id, value ); } }
            historyDescription="Change Node Value"
          />
        </InspectorItem>

        <InspectorHr />

        <InspectorItem>
          <InspectorLabel>In Time</InspectorLabel>
          <NumberParam
            type="float"
            value={ node.in?.time || 0.0 }
            onChange={ ( value ) => { param.moveHandleTime( node.$id, 'in', value ); } }
            historyDescription="Change Node Handle Time"
          />
        </InspectorItem>
        <InspectorItem>
          <InspectorLabel>In Value</InspectorLabel>
          <NumberParam
            type="float"
            value={ node.in?.value || 0.0 }
            onChange={ ( value ) => { param.moveHandleValue( node.$id, 'in', value ); } }
            historyDescription="Change Node Handle Value"
          />
        </InspectorItem>

        <InspectorHr />

        <InspectorItem>
          <InspectorLabel>Out Time</InspectorLabel>
          <NumberParam
            type="float"
            value={ node.out?.time || 0.0 }
            onChange={ ( value ) => { param.moveHandleTime( node.$id, 'out', value ); } }
            historyDescription="Change Node Handle Time"
          />
        </InspectorItem>
        <InspectorItem>
          <InspectorLabel>Out Value</InspectorLabel>
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
