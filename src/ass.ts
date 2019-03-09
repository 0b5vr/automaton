/**
 * ass
 * @param value ass
 * @param message ass
 */
export function ass( value: any, message: string ): boolean {
  if ( value ) {
    return true;
  } else {
    throw new Error( message );
  }
}
