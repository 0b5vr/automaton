export function testRectIntersection(
  ax0: number,
  ay0: number,
  ax1: number,
  ay1: number,
  bx0: number,
  by0: number,
  bx1: number,
  by1: number,
): boolean {
  return !( bx0 > ax1 || bx1 < ax0 || by0 > ay1 || by1 < ay0 );
}
