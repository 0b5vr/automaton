function closeToZero( a: number ): boolean {
  return Math.abs( a ) < 1E-9;
}

function mod( x: number, d: number ): number {
  return x - Math.floor( x / d ) * d;
}

interface GridEntry {
  value: number;
  importance: number;
}

export function genGrid(
  t0: number,
  t1: number,
  options: {
    base?: number;
    details?: number;
  } = {}
): GridEntry[] {
  const base = options.base ?? 10;
  const details = options.details ?? 0;

  const delta = t1 - t0;
  const logDelta = Math.log( delta ) / Math.log( base );
  const div = Math.pow( base, Math.floor( logDelta ) - details );
  const begin = Math.ceil( t0 / div ) * div;

  const result: GridEntry[] = [];

  let value = begin;
  let i = 0;
  while ( value <= t1 ) {
    let importanceRaw = div;
    if ( closeToZero( value ) ) {
      importanceRaw = Infinity;
    } else {
      let d = ( mod( value + 0.5 * importanceRaw, importanceRaw ) ) - 0.5 * importanceRaw;
      while ( closeToZero( d ) ) {
        importanceRaw *= base;
        d = ( mod( value + 0.5 * importanceRaw, importanceRaw ) ) - 0.5 * importanceRaw;
      }
      importanceRaw /= base;
    }

    result.push( {
      value,
      importance: importanceRaw / delta
    } );

    i ++;
    value = begin + i * div;
  }

  return result;
}
