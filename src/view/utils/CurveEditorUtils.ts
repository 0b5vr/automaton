export interface CurveEditorRange {
  t0: number;
  t1: number;
  v0: number;
  v1: number;
}

export interface CurveEditorSize {
  width: number;
  height: number;
}

export function x2t( x: number, range: CurveEditorRange, width: number ): number {
  return ( x / width ) * ( range.t1 - range.t0 ) + range.t0;
}

export function t2x( t: number, range: CurveEditorRange, width: number ): number {
  return ( ( t - range.t0 ) / ( range.t1 - range.t0 ) ) * width;
}

export function y2v( y: number, range: CurveEditorRange, height: number ): number {
  return ( 1.0 - y / height ) * ( range.v1 - range.v0 ) + range.v0;
}

export function v2y( v: number, range: CurveEditorRange, height: number ): number {
  return ( 1.0 - ( v - range.v0 ) / ( range.v1 - range.v0 ) ) * height;
}

export function dx2dt( x: number, range: CurveEditorRange, width: number ): number {
  return ( x / width ) * ( range.t1 - range.t0 );
}

export function dt2dx( t: number, range: CurveEditorRange, width: number ): number {
  return t / ( range.t1 - range.t0 ) * width;
}

export function dy2dv( y: number, range: CurveEditorRange, height: number ): number {
  return -y / height * ( range.v1 - range.v0 );
}

export function dv2dy( v: number, range: CurveEditorRange, height: number ): number {
  return -v / ( range.v1 - range.v0 ) * height;
}
