import type { BezierNode } from '../types/BezierNode';

interface CubicBezierControlPoints {
  p0: number;
  p1: number;
  p2: number;
  p3: number;
}

const NEWTON_ITER = 4;
const NEWTON_EPSILON = 0.001;
const SUBDIV_ITER = 10;
const SUBDIV_EPSILON = 0.000001;
const TABLE_SIZE = 21;

const __cache: number[] = [];

function clamp( x: number, min: number, max: number ): number {
  return Math.min( Math.max( x, min ), max );
}

/*
 * (1-t)(1-t)(1-t) a0 = (1-2t+tt)(1-t) a0
 *                    = (1-t-2t+2tt+tt-ttt) a0
 *                    = (1-3t+3tt-ttt) a0
 *
 * 3(1-t)(1-t)t a1 = 3(1-2t+tt)t a1
 *                 = (3t-6tt+3ttt) a1
 *
 * 3(1-t)tt a2 = (3tt-3ttt) a2
 *
 * ttt a3
 *
 * (a3-3a2+3a1-a0) ttt + (3a2-6a1+3a0) tt + (3a1-3a0) t + a0
 */

function A( cps: CubicBezierControlPoints ): number {
  return cps.p3 - 3.0 * cps.p2 + 3.0 * cps.p1 - cps.p0;
}

function B( cps: CubicBezierControlPoints ): number {
  return 3.0 * cps.p2 - 6.0 * cps.p1 + 3.0 * cps.p0;
}

function C( cps: CubicBezierControlPoints ): number {
  return 3.0 * cps.p1 - 3.0 * cps.p0;
}

function cubicBezier( t: number, cps: CubicBezierControlPoints ): number {
  return ( ( A( cps ) * t + B( cps ) ) * t + C( cps ) ) * t + cps.p0;
}

function deltaCubicBezier( t: number, cps: CubicBezierControlPoints ): number {
  return ( 3.0 * A( cps ) * t + 2.0 * B( cps ) ) * t + C( cps );
}

function subdiv( x: number, a: number, b: number, cps: CubicBezierControlPoints ): number {
  let candidateX = 0;
  let t = 0;

  for ( let i = 0; i < SUBDIV_ITER; i ++ ) {
    t = a + ( b - a ) / 2.0;
    candidateX = cubicBezier( t, cps ) - x;
    ( 0.0 < candidateX ) ? ( b = t ) : ( a = t );
    if ( SUBDIV_EPSILON < Math.abs( candidateX ) ) { break; }
  }

  return t;
}

function newton( x: number, t: number, cps: CubicBezierControlPoints ): number {
  for ( let i = 0; i < NEWTON_ITER; i ++ ) {
    const d = deltaCubicBezier( t, cps );
    if ( d === 0.0 ) { return t; }
    const cx = cubicBezier( t, cps ) - x;
    t -= cx / d;
  }

  return t;
}

export function rawBezierEasing(
  cpsx: CubicBezierControlPoints,
  cpsy: CubicBezierControlPoints,
  x: number
): number {
  if ( x <= cpsx.p0 ) { return cpsy.p0; } // clamped
  if ( cpsx.p3 <= x ) { return cpsy.p3; } // clamped

  cpsx.p1 = clamp( cpsx.p1, cpsx.p0, cpsx.p3 );
  cpsx.p2 = clamp( cpsx.p2, cpsx.p0, cpsx.p3 );

  for ( let i = 0; i < TABLE_SIZE; i ++ ) {
    __cache[ i ] = cubicBezier( i / ( TABLE_SIZE - 1.0 ), cpsx );
  }

  let sample = 0;
  for ( let i = 1; i < TABLE_SIZE; i ++ ) {
    sample = i - 1;
    if ( x < __cache[ i ] ) { break; }
  }

  const dist = ( x - __cache[ sample ] ) / ( __cache[ sample + 1 ] - __cache[ sample ] );
  let t = ( sample + dist ) / ( TABLE_SIZE - 1 );
  const d = deltaCubicBezier( t, cpsx ) / ( cpsx.p3 - cpsx.p0 );

  if ( NEWTON_EPSILON <= d ) {
    t = newton( x, t, cpsx );
  } else if ( d !== 0.0 ) {
    t = subdiv( x, ( sample ) / ( TABLE_SIZE - 1 ), ( sample + 1.0 ) / ( TABLE_SIZE - 1 ), cpsx );
  }

  return cubicBezier( t, cpsy );
}

export function bezierEasing( node0: BezierNode, node1: BezierNode, time: number ): number {
  return rawBezierEasing(
    {
      p0: node0.time,
      p1: node0.time + node0.outTime,
      p2: node1.time + node1.inTime,
      p3: node1.time
    },
    {
      p0: node0.value,
      p1: node0.value + node0.outValue,
      p2: node1.value + node1.inValue,
      p3: node1.value
    },
    time
  );
}
