import { Resolution } from './Resolution';
import { TimeValueRange } from './TimeValueRange';
import { useCallback } from 'react';
import { useSelector } from '../states/store';

export function useTimeValueRangeFuncs(
  range: TimeValueRange,
  size: Resolution,
): {
    x2t: ( x: number ) => number,
    t2x: ( t: number ) => number,
    y2v: ( y: number ) => number,
    v2y: ( v: number ) => number,
    dx2dt: ( x: number ) => number,
    dt2dx: ( t: number ) => number,
    dy2dv: ( y: number ) => number,
    dv2dy: ( v: number ) => number,
    snapTime: ( t: number ) => number,
    snapValue: ( v: number ) => number,
  } {
  const {
    snapTimeActive,
    snapBeatActive,
    snapTimeInterval,
    bpm,
    beatOffset,
    snapValueActive,
    snapValueInterval,
  } = useSelector( ( state ) => state.automaton.guiSettings );
  const { t0, t1, v0, v1 } = range;
  const { width, height } = size;

  const x2t = useCallback(
    ( x: number ) => ( x / width ) * ( t1 - t0 ) + t0,
    [ t0, t1, width ]
  );

  const t2x = useCallback(
    ( t: number ) => ( ( t - t0 ) / ( t1 - t0 ) ) * width,
    [ t0, t1, width ]
  );

  const y2v = useCallback(
    ( y: number ) => ( 1.0 - y / height ) * ( v1 - v0 ) + v0,
    [ height, v0, v1 ]
  );

  const v2y = useCallback(
    ( v: number ) => ( 1.0 - ( v - v0 ) / ( v1 - v0 ) ) * height,
    [ height, v0, v1 ]
  );

  const dx2dt = useCallback(
    ( dx: number ) => ( dx / width ) * ( t1 - t0 ),
    [ t0, t1, width ]
  );

  const dt2dx = useCallback(
    ( dt: number ) => dt / ( t1 - t0 ) * width,
    [ t0, t1, width ]
  );

  const dy2dv = useCallback(
    ( dy: number ) => -dy / height * ( v1 - v0 ),
    [ height, v0, v1 ]
  );

  const dv2dy = useCallback(
    ( dv: number ) => -dv / ( v1 - v0 ) * height,
    [ height, v0, v1 ]
  );

  const snapTime = useCallback(
    ( t: number ) => {
      let result = t;

      if ( snapTimeActive ) {
        const interval = snapTimeInterval;
        const threshold = dx2dt( 5.0 );
        const nearest = Math.round( t / interval ) * interval;
        result = Math.abs( t - nearest ) < threshold ? nearest : result;
      }

      if ( snapBeatActive ) {
        let interval = 60.0 / bpm;
        const order = Math.floor( Math.log( ( t1 - t0 ) / interval ) / Math.log( 4.0 ) );
        interval *= Math.pow( 4.0, order - 2.0 );
        const threshold = dx2dt( 5.0 );
        const nearest = Math.round( ( t - beatOffset ) / interval ) * interval + beatOffset;
        result = Math.abs( t - nearest ) < threshold ? nearest : result;
      }

      return result;
    },
    [ beatOffset, bpm, dx2dt, snapBeatActive, snapTimeActive, snapTimeInterval, t0, t1 ]
  );

  const snapValue = useCallback(
    ( v: number ) => {
      let result = v;

      if ( snapValueActive ) {
        const interval = snapValueInterval;
        const threshold = dy2dv( -5.0 );
        const nearest = Math.round( result / interval ) * interval;
        result = Math.abs( result - nearest ) < threshold ? nearest : result;
      }

      return result;
    },
    [ dy2dv, snapValueActive, snapValueInterval ]
  );

  return {
    x2t,
    t2x,
    y2v,
    v2y,
    dx2dt,
    dt2dx,
    dy2dv,
    dv2dy,
    snapTime,
    snapValue,
  };
}
