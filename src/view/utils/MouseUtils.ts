export function registerMouseEvent(
  move: ( event: MouseEvent ) => void,
  up?: ( event: MouseEvent ) => void
): void {
  const upt = ( event: MouseEvent ): void => {
    up && up( event );
    window.removeEventListener( 'mousemove', move );
    window.removeEventListener( 'mouseup', upt );
    window.removeEventListener( 'mousedown', upt );
  };

  window.addEventListener( 'mousemove', move );
  window.addEventListener( 'mouseup', upt );
  setTimeout( () => window.addEventListener( 'mousedown', upt ) );
}
