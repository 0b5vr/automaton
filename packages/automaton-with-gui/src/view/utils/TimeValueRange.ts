import { GUISettings } from '../../types/GUISettings';

export interface TimeRange {
  t0: number;
  t1: number;
}

export interface ValueRange {
  v0: number;
  v1: number;
}

export interface TimeValueRange extends TimeRange {}
export interface TimeValueRange extends ValueRange {}

export function x2t( x: number, range: TimeRange, width: number ): number {
  return ( x / width ) * ( range.t1 - range.t0 ) + range.t0;
}

export function t2x( t: number, range: TimeRange, width: number ): number {
  return ( ( t - range.t0 ) / ( range.t1 - range.t0 ) ) * width;
}

export function y2v( y: number, range: ValueRange, height: number ): number {
  return ( 1.0 - y / height ) * ( range.v1 - range.v0 ) + range.v0;
}

export function v2y( v: number, range: ValueRange, height: number ): number {
  return ( 1.0 - ( v - range.v0 ) / ( range.v1 - range.v0 ) ) * height;
}

export function dx2dt( x: number, range: TimeRange, width: number ): number {
  return ( x / width ) * ( range.t1 - range.t0 );
}

export function dt2dx( t: number, range: TimeRange, width: number ): number {
  return t / ( range.t1 - range.t0 ) * width;
}

export function dy2dv( y: number, range: ValueRange, height: number ): number {
  return -y / height * ( range.v1 - range.v0 );
}

export function dv2dy( v: number, range: ValueRange, height: number ): number {
  return -v / ( range.v1 - range.v0 ) * height;
}

export function snapTime(
  time: number,
  range: TimeRange,
  width: number,
  settings: GUISettings
): number {
  let t = time;

  if ( settings?.snapTimeActive ) {
    const interval = settings.snapTimeInterval;
    const threshold = dx2dt( 5.0, range, width );
    const nearest = Math.round( t / interval ) * interval;
    t = Math.abs( t - nearest ) < threshold ? nearest : t;
  }

  if ( settings?.snapBeatActive ) {
    let interval = 60.0 / settings.snapBeatBPM;
    const order = Math.floor( Math.log( ( range.t1 - range.t0 ) / interval ) / Math.log( 4.0 ) );
    interval *= Math.pow( 4.0, order - 1.0 );
    const threshold = dx2dt( 5.0, range, width );
    const nearest = Math.round( t / interval ) * interval;
    t = Math.abs( t - nearest ) < threshold ? nearest : t;
  }

  return t;
}

export function snapValue(
  value: number,
  range: ValueRange,
  height: number,
  settings: GUISettings | null
): number {
  let v = value;

  if ( settings?.snapValueActive ) {
    const interval = settings.snapValueInterval;
    const threshold = dy2dv( -5.0, range, height );
    const nearest = Math.round( v / interval ) * interval;
    v = Math.abs( v - nearest ) < threshold ? nearest : v;
  }

  return v;
}
