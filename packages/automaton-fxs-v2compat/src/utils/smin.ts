export function smin( a: number, b: number, k: number ): number {
  const h = Math.max( k - Math.abs( a - b ), 0.0 );
  return Math.min( a, b ) - h * h * h / ( 6.0 * k * k );
}
