import React, { useContext, useMemo } from 'react';
import { t2x, v2y } from '../utils/CurveEditorUtils';
import { Colors } from '../constants/Colors';
import { Contexts } from '../contexts/Context';
import styled from 'styled-components';

// == styles =======================================================================================
const GridLine = styled.line`
  stroke: ${ Colors.fore };
  stroke-width: 0.0625rem;
`;

const GridText = styled.text`
  fill: ${ Colors.fore };
  font-size: 0.6rem;
`;

const Root = styled.g`
`;

// == element ======================================================================================
export interface CurveEditorGridProps {
  className?: string;
}

interface GridLineEntry {
  value: string;
  position: number;
  opacity: number;
}

export const CurveEditorGrid = ( { className }: CurveEditorGridProps ): JSX.Element => {
  const contexts = useContext( Contexts.Store );
  const { range, size } = contexts.state.curveEditor;

  const hlines: GridLineEntry[] = useMemo(
    (): GridLineEntry[] => {
      const delta = ( range.t1 - range.t0 );
      const logDelta = Math.log10( delta );
      const scale = Math.pow( 10.0, Math.floor( logDelta ) - 1.0 );
      const lineInterval = logDelta - Math.floor( logDelta );
      const num = Math.floor( range.t0 / scale );
      const begin = num * scale;
      let accent10 = num - Math.floor( num / 10 ) * 10;
      let accent100 = num - Math.floor( num / 100 ) * 100;

      const ret: GridLineEntry[] = [];
      for ( let v = begin; v < range.t1; v += scale ) {
        const opacity = (
          accent100 === 0 ? 0.4 :
          accent10 === 0 ? 0.4 - lineInterval * 0.3 :
          0.1 - lineInterval * 0.3
        );
        if ( 0.0 < opacity ) {
          ret.push( {
            value: ( v + 1E-9 ).toFixed( 3 ), // trick: to prevent -0.000
            position: t2x( v, range, size.width ),
            opacity
          } );
        }
        accent10 = ( accent10 + 1 ) % 10;
        accent100 = ( accent100 + 1 ) % 100;
      }

      return ret;
    },
    [ range, size ]
  );
  const vlines: GridLineEntry[] = useMemo(
    (): GridLineEntry[] => {
      const delta = ( range.v1 - range.v0 );
      const logDelta = Math.log10( delta );
      const scale = Math.pow( 10.0, Math.floor( logDelta ) - 1.0 );
      const lineInterval = logDelta - Math.floor( logDelta );
      const num = Math.floor( range.v0 / scale );
      const begin = num * scale;
      let accent10 = num - Math.floor( num / 10 ) * 10;
      let accent100 = num - Math.floor( num / 100 ) * 100;

      const ret: GridLineEntry[] = [];
      for ( let v = begin; v < range.v1; v += scale ) {
        const opacity = (
          accent100 === 0 ? 0.4 :
          accent10 === 0 ? 0.4 - lineInterval * 0.3 :
          0.1 - lineInterval * 0.3
        );
        if ( 0.0 < opacity ) {
          ret.push( {
            value: ( v + 1E-9 ).toFixed( 3 ), // trick: to prevent -0.000
            position: v2y( v, range, size.height ),
            opacity
          } );
        }
        accent10 = ( accent10 + 1 ) % 10;
        accent100 = ( accent100 + 1 ) % 100;
      }

      return ret;
    },
    [ range, size ]
  );

  return (
    <Root className={ className }>
      { hlines.map( ( hline, i ): JSX.Element => (
        <g
          key={ i }
          opacity={ hline.opacity }
          transform={ `translate(${ hline.position },${ size.height })` }
        >
          <GridLine y2={ -size.height } />
          <GridText x="2" y="-2">{ hline.value }</GridText>
        </g>
      ) ) }
      { vlines.map( ( vline, i ): JSX.Element => (
        <g
          key={ i }
          opacity={ vline.opacity }
          transform={ `translate(0,${ vline.position })` }
        >
          <GridLine x2={ size.width } />
          <GridText x="2" y="-2">{ vline.value }</GridText>
        </g>
      ) ) }
    </Root>
  );
};
