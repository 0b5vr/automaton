export function smoothstep( a: number, b: number, k: number ): number {
  const smooth = k * k * ( 3.0 - 2.0 * k );
  return a + ( b - a ) * smooth;
}
