import { Metrics } from '../constants/Metrics';
import { ToastyEntry } from './ToastyEntry';
import { useSelector } from '../states/store';
import React from 'react';
import styled from 'styled-components';

// == styles =======================================================================================
const Root = styled.div`
  position: absolute;
  right: 0;
  bottom: 0;
  width: ${ Metrics.toastyWidth }px;
  pointer-events: none;
`;

// == component ====================================================================================
const Toasty = ( { className }: {
  className?: string;
} ): JSX.Element | null => {
  const { entries } = useSelector( ( state ) => ( {
    entries: state.toasty.entries
  } ) );

  return (
    <Root className={ className }>
      { Object.values( entries ).map( ( entry ) => (
        <ToastyEntry
          key={ entry.$id }
          id={ entry.$id }
          kind={ entry.kind }
          closing={ entry.closing }
          message={ entry.message }
        />
      ) ) }
    </Root>
  );
};

export { Toasty };
