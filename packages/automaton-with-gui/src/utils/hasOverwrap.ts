/**
 * Math
 * @param t1 time 1
 * @param l1 length 1
 * @param t2 time 2
 * @param l2 length 2
 */
export function hasOverwrap( t1: number, l1: number, t2: number, l2: number ): boolean {
  if ( l2 < l1 ) { return hasOverwrap( t2, l2, t1, l1 ); }

  return (
    t2 < t1 && t1 < t2 + l2 ||
    t2 < t1 + l1 && t1 + l1 < t2 + l2
  );
}
