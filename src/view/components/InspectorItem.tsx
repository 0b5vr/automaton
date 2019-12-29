import React from 'react';
import styled from 'styled-components';

// == styles =======================================================================================
export const Label = styled.div`
  margin: 0.15rem;
  font-size: 0.7rem;
  line-height: 1em;
`;

export const Root = styled.div`
  display: flex;
  justify-content: space-between;
  margin: 0.125em 0;
`;

// == components ===================================================================================
export interface InspectorItemProps {
  className?: string;
  children?: JSX.Element;
  name?: string;
}

export const InspectorItem = ( { className, children, name }: InspectorItemProps ): JSX.Element => (
  <Root
    className={ className }
    data-stalker={ name }
  >
    <Label>{ name }</Label>
    { children }
  </Root>
);
