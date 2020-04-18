export enum MouseComboBit {
  LMB = 1,
  RMB = 2,
  MMB = 4,
  Shift = 8,
  Ctrl = 16,
  Alt = 32
}

export function mouseCombo(
  callbacks: { [ combo: number ]: ( event: React.MouseEvent ) => void }
): ( event: React.MouseEvent ) => void {
  return ( event: React.MouseEvent ) => {
    let bits = 0;

    if ( ( event.buttons & 1 ) === 1 ) { bits += MouseComboBit.LMB; }
    if ( ( event.buttons & 2 ) === 2 ) { bits += MouseComboBit.RMB; }
    if ( ( event.buttons & 4 ) === 4 ) { bits += MouseComboBit.MMB; }
    if ( event.shiftKey ) { bits += MouseComboBit.Shift; }
    if ( event.ctrlKey ) { bits += MouseComboBit.Ctrl; }
    if ( event.altKey ) { bits += MouseComboBit.Alt; }

    const callback = callbacks[ bits ];
    if ( !callback ) { return; }

    event.preventDefault();
    event.stopPropagation();

    callback( event );
  };
}
