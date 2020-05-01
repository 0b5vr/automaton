import React, { useCallback } from 'react';
import { useDispatch, useSelector } from '../states/store';

import { Colors } from '../constants/Colors';
import { CurveListEntry } from './CurveListEntry';
import { Icons } from '../icons/Icons';
import { Metrics } from '../constants/Metrics';
import { Scrollable } from './Scrollable';
import styled from 'styled-components';

// == styles =======================================================================================
const NewCurveIcon = styled.img`
  fill: ${ Colors.gray };
  height: 16px;
`;

const NewCurveButton = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: calc( 100% - 4px );
  height: ${ Metrics.curveListEntryHeight }px;
  margin: 2px;
  cursor: pointer;
  background: ${ Colors.back3 };

  &:active {
    background: ${ Colors.back4 };
  }
`;

const StyledCurveListEntry = styled( CurveListEntry )`
  width: calc( 100% - 4px );
  height: ${ Metrics.curveListEntryHeight }px;
  margin: 2px;
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
  const dispatch = useDispatch();
  const { automaton, curves } = useSelector( ( state ) => ( {
    automaton: state.automaton.instance,
    curves: state.automaton.curves
  } ) );

  const handleClickNewCurve = useCallback(
    () => {
      if ( !automaton ) { return; }

      const curve = automaton.createCurve();
      const index = automaton.getCurveIndex( curve );

      dispatch( {
        type: 'CurveEditor/SelectCurve',
        curve: index
      } );

      dispatch( {
        type: 'History/Push',
        description: 'Create Curve',
        commands: [
          {
            type: 'automaton/createCurve',
            index
          }
        ],
      } );
    },
    [ automaton ]
  );

  return (
    <Root className={ className } barPosition='left'>
      { curves.map( ( curve, iCurve ) => (
        <StyledCurveListEntry
          key={ iCurve }
          index={ iCurve }
        />
      ) ) }
      <NewCurveButton
        data-stalker="Create a new curve"
        onClick={ handleClickNewCurve }
      >
        <NewCurveIcon as={ Icons.Plus } />
      </NewCurveButton>
    </Root>
  );
};

export { CurveList };
