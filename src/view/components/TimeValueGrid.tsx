import React, { useMemo } from 'react';
import { TimeValueRange, t2x, v2y } from '../utils/TimeValueRange';
import { Colors } from '../constants/Colors';
import { Resolution } from '../utils/Resolution';
import { clamp } from '../../utils/clamp';
import { genGrid } from '../utils/genGrid';
import styled from 'styled-components';
import { useSelector } from '../states/store';

// == helpers ======================================================================================
function closeTo( a: number, b: number ): boolean {
  return Math.abs( a - b ) < 1E-9;
}

function intOrEmpty( value: number ): string {
  const rounded = Math.round( value );
  return closeTo( value, rounded ) ? rounded.toFixed( 0 ) : '';
}

// == styles =======================================================================================
const GridLine = styled.line`
  stroke: ${ Colors.fore };
  stroke-width: 0.0625rem;
  pointer-events: none;
`;

const GridText = styled.text`
  fill: ${ Colors.fore };
  font-size: 0.6rem;
  pointer-events: none;
`;

// == element ======================================================================================
export interface TimeValueGridProps {
  range: TimeValueRange;
  size: Resolution;
  hideValue?: boolean;
}

interface GridLineEntry {
  value: string;
  position: number;
  opacity: number;
}

const TimeValueGrid = ( props: TimeValueGridProps ): JSX.Element => {
  const { range, size, hideValue } = props;

  const { snapBeatActive, snapBeatBPM } = useSelector( ( state ) => ( {
    snapBeatActive: state.automaton.guiSettings.snapBeatActive,
    snapBeatBPM: state.automaton.guiSettings.snapBeatBPM,
  } ) );

  const hlines: GridLineEntry[] = useMemo(
    (): GridLineEntry[] => {
      const grid = genGrid( range.t0, range.t1, { details: 1 } );
      return grid.map( ( entry ) => ( {
        value: ( entry.value + 1E-9 ).toFixed( 3 ), // trick: to prevent -0.000
        position: t2x( entry.value, range, size.width ),
        opacity: clamp( entry.importance - 0.01, 0.0, 0.4 )
      } ) );
    },
    [ range, size ]
  );

  const vlines: GridLineEntry[] = useMemo(
    (): GridLineEntry[] => {
      const grid = genGrid( range.v0, range.v1, { details: 1 } );
      return grid.map( ( entry ) => ( {
        value: ( entry.value + 1E-9 ).toFixed( 3 ), // trick: to prevent -0.000
        position: v2y( entry.value, range, size.height ),
        opacity: clamp( entry.importance - 0.01, 0.0, 0.4 )
      } ) );
    },
    [ range, size ]
  );

  const beatlines: GridLineEntry[] = useMemo(
    (): GridLineEntry[] => {
      if ( !snapBeatActive ) { return []; }

      const bps = snapBeatBPM / 60.0;
      const grid = genGrid( bps * range.t0, bps * range.t1, { details: 2, base: 4 } );
      return grid.map( ( entry ) => ( {
        value: intOrEmpty( entry.value ), // trick: to prevent -0.000
        position: t2x( entry.value / bps, range, size.width ),
        opacity: 4.0 * clamp( entry.importance - 0.0625, 0.0, 0.1 )
      } ) );
    },
    [ snapBeatActive, snapBeatBPM, range, size ]
  );

  return <>
    { useMemo(
      () => (
        hlines.map( ( hline, i ): JSX.Element => (
          <g
            key={ i }
            opacity={ hline.opacity }
            transform={ `translate(${ hline.position },${ size.height })` }
          >
            { !snapBeatActive && <GridLine y2={ -size.height } /> }
            <GridText x="2" y="-2">{ hline.value }</GridText>
          </g>
        ) )
      ),
      [ snapBeatActive, hlines, size ]
    ) }

    { useMemo(
      () => !hideValue && (
        vlines.map( ( vline, i ): JSX.Element => (
          <g
            key={ i }
            opacity={ vline.opacity }
            transform={ `translate(0,${ vline.position })` }
          >
            <GridLine x2={ size.width } />
            <GridText x="2" y="-2">{ vline.value }</GridText>
          </g>
        ) )
      ),
      [ vlines, size ]
    ) }

    { useMemo(
      () => (
        snapBeatActive && beatlines.map( ( beatline, i ): JSX.Element => (
          <g
            key={ i }
            opacity={ beatline.opacity }
            transform={ `translate(${ beatline.position },${ size.height })` }
          >
            <GridLine y2={ -size.height } />
            <GridText x="2" y="-12">{ beatline.value }</GridText>
          </g>
        ) )
      ),
      [ snapBeatActive, beatlines, size ]
    ) }
  </>;
};

export { TimeValueGrid };
