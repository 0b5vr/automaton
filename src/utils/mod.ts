export function mod( t: number, d: number ): number {
  const i = Math.floor( t / d );
  return t - i * d;
}
