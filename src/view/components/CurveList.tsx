import { Colors } from '../constants/Colors';
import { CurveListEntry } from './CurveListEntry';
import React from 'react';
import { Scrollable } from './Scrollable';
import styled from 'styled-components';
import { useSelector } from '../states/store';

// == styles =======================================================================================
const StyledCurveListEntry = styled( CurveListEntry )`
  width: calc( 100% - 0.25rem );
  margin: 0.125rem;
  cursor: pointer;
`;

const Root = styled( Scrollable )`
  background: ${ Colors.back2 };
`;

// == element ======================================================================================
export interface CurveListProps {
  className?: string;
}

const CurveList = ( { className }: CurveListProps ): JSX.Element => {
  const { curves } = useSelector( ( state ) => ( {
    curves: state.automaton.curves
  } ) );

  return (
    <Root className={ className } barPosition='left'>
      { curves.map( ( curve, iCurve ) => (
        <StyledCurveListEntry
          key={ iCurve }
          index={ iCurve }
        />
      ) ) }
    </Root>
  );
};

export { CurveList };
