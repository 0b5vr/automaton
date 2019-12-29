import React from 'react';
import styled from 'styled-components';

// == styles =======================================================================================
export const Label = styled.div`
  margin: 0.15rem;
  font-size: 0.7rem;
  line-height: 1em;
  overflow: hidden;
  width: calc( 100% - 4.3rem );
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const Root = styled.div`
  display: flex;
  justify-content: space-between;
  margin: 0.125rem 0;
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
