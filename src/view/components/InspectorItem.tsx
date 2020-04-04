import React, { ReactNode } from 'react';
import styled from 'styled-components';

// == styles =======================================================================================
const Label = styled.div`
  margin: 0.15rem;
  font-size: 0.7rem;
  line-height: 1em;
  overflow: hidden;
  width: calc( 100% - 4.3rem );
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Root = styled.div`
  display: flex;
  justify-content: space-between;
  margin: 0.125rem 0;
`;

// == components ===================================================================================
export interface InspectorItemProps {
  className?: string;
  children?: ReactNode;
  name?: string;
}

const InspectorItem = ( { className, children, name }: InspectorItemProps ): JSX.Element => (
  <Root
    className={ className }
    data-stalker={ name }
  >
    <Label>{ name }</Label>
    { children }
  </Root>
);

export { InspectorItem };
