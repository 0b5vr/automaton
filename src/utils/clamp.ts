export function clamp( t: number, min: number, max: number ): number {
  return t < min ? min : max < t ? max : t;
}
