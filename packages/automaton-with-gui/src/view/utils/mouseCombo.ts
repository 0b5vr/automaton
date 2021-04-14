export enum MouseComboBit {
  LMB = 1,
  RMB = 2,
  MMB = 4,
  Shift = 8,
  Ctrl = 16,
  Alt = 32,
  DoubleClick = 64,
}

/**
 * Do a job based on mouse button + key combination.
 * It will event.preventDefault + event.stopPropagation automatically.
 *
 * @param event The mouse event
 * @param callbacks A map of mouse button + key combination bits vs. callbacks. set or return `false` to bypass
 * @returns The return value of the callback it executed. If it couldn't execute any callbacks, returns `null` instead.
 */
export function mouseCombo<T>(
  event: React.MouseEvent,
  callbacks: { [ combo: number ]: ( ( event: React.MouseEvent ) => T | false ) | false },
): T | false | null {
  let bits = 0;

  // set bits
  if ( ( event.buttons & 1 ) === 1 ) { bits += MouseComboBit.LMB; }
  if ( ( event.buttons & 2 ) === 2 ) { bits += MouseComboBit.RMB; }
  if ( ( event.buttons & 4 ) === 4 ) { bits += MouseComboBit.MMB; }
  if ( event.shiftKey ) { bits += MouseComboBit.Shift; }
  if ( event.ctrlKey ) { bits += MouseComboBit.Ctrl; }
  if ( event.altKey ) { bits += MouseComboBit.Alt; }

  // sort from highest bits to lowest bits
  const sortedCallbacks = Object.entries( callbacks );
  sortedCallbacks.sort( ( [ aBits ], [ bBits ] ) => parseInt( bBits ) - parseInt( aBits ) );

  // search and execute
  for ( const [ cbBitsStr, cb ] of sortedCallbacks ) {
    const cbBits = parseInt( cbBitsStr );
    if ( ( cbBits & bits ) === cbBits ) {
      if ( cb ) {
        const ret = cb( event );

        if ( ret !== false ) {
          event.preventDefault();
          event.stopPropagation();
        }

        return ret;
      } else {
        return null;
      }
    }
  }

  return null;
}
