export function clamp( x: number, a: number, b: number ): number {
  return Math.min( Math.max( x, a ), b );
}
