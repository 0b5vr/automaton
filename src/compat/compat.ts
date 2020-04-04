import { SerializedAutomatonWithGUI, defaultDataWithGUI } from '../types/SerializedAutomatonWithGUI';
import { jsonCopy } from '../utils/jsonCopy';
import { preversionCompat } from './preversionCompat';
import { v1Compat } from './v1Compat';
import { v2Compat } from './v2Compat';

export function compat( data?: any ): SerializedAutomatonWithGUI {
  if ( !data ) {
    return Object.assign( {}, jsonCopy( defaultDataWithGUI ) );
  }

  let newData;
  if ( typeof data === 'object' ) {
    newData = jsonCopy( data );
  } else {
    console.error( 'Loaded data is invalid' );
    return Object.assign( {}, defaultDataWithGUI );
  }

  let version = parseFloat( newData.version ) || parseFloat( newData.v );

  if ( !version && !newData.rev ) {
    newData = preversionCompat( newData );
    if ( newData === null ) {
      return Object.assign( {}, defaultDataWithGUI );
    }
  }

  if ( newData.rev ) { // fuck
    version = 1.0;
    delete newData.rev;
  }

  if ( version < 2.0 ) { // v1, modes and modifiers, CURSED
    newData = v1Compat( newData );
  }

  if ( version < 3.0 ) { // v2
    newData = v2Compat( newData );
  }

  newData.v = process.env.VERSION;
  return newData;
}
