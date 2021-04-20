import { registerMouseEvent } from './registerMouseEvent';

export function registerMouseNoDragEvent(
  handler: ( event: MouseEvent ) => void
): void {
  let isMoved = false;

  registerMouseEvent(
    () => {
      isMoved = true;
    },
    ( event ) => {
      if ( !isMoved ) {
        handler( event );
      }
    },
  );
}
