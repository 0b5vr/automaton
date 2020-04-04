import React, { useMemo } from 'react';
import { TimeValueRange, t2x, v2y } from '../utils/TimeValueRange';
import { Colors } from '../constants/Colors';
import { Resolution } from '../utils/Resolution';
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

const Root = styled.svg`
  position: absolute;
`;

// == element ======================================================================================
export interface TimeValueGridProps {
  className?: string;
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
  const { className, range, size, hideValue } = props;

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
    <Root
      style={ {
        width: `${ size.width }px`,
        height: `${ size.height }px`
      } }
      className={ className }
    >
      { useMemo( () => (
        hlines.map( ( hline, i ): JSX.Element => (
          <g
            key={ i }
            opacity={ hline.opacity }
            transform={ `translate(${ hline.position },${ size.height })` }
          >
            <GridLine y2={ -size.height } />
            <GridText x="2" y="-2">{ hline.value }</GridText>
          </g>
        ) )
      ), [ hlines, size ] ) }
      { useMemo( () => !hideValue && (
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
      ), [ vlines, size ] ) }
    </Root>
  );
};

export { TimeValueGrid };
