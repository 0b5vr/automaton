export enum MouseComboBit {
  LMB = 1,
  RMB = 2,
  MMB = 4,
  Shift = 8,
  Ctrl = 16,
  Alt = 32
}

export function mouseCombo(
  event: React.MouseEvent,
  callbacks: { [ combo: number ]: ( event: React.MouseEvent ) => void },
): void {
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
  for ( const [ cbBits, cb ] of sortedCallbacks ) {
    if ( ( parseInt( cbBits ) & bits ) !== 0 ) {
      event.preventDefault();
      event.stopPropagation();

      cb( event );

      return;
    }
  }

  return;
}
