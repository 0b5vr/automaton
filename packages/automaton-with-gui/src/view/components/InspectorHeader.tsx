import { Colors } from '../constants/Colors';
import React from 'react';
import styled from 'styled-components';

// == styles =======================================================================================
const Root = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${ Colors.accent };
`;

// == components ===================================================================================
export interface InspectorHeaderProps {
  className?: string;
  text: string;
}

const InspectorHeader = ( { className, text }: InspectorHeaderProps ): JSX.Element => (
  <Root
    className={ className }
    data-stalker={ text }
  >
    { text }
  </Root>
);

export { InspectorHeader };
