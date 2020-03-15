import { SerializedDataWithGUI, defaultDataWithGUI } from '../types/SerializedDataWithGUI';
import { compat1 } from './compat1';
import { compat2 } from './compat2';
import { compatPreVersions } from './compatPreVersions';
import { jsonCopy } from '../utils/jsonCopy';

export function compat( data?: any ): SerializedDataWithGUI {
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
    newData = compatPreVersions( newData );
    if ( newData === null ) {
      return Object.assign( {}, defaultDataWithGUI );
    }
  }

  if ( newData.rev ) { // fuck
    version = 1.0;
    delete newData.rev;
  }

  if ( version < 2.0 ) { // v1, modes and modifiers, CURSED
    newData = compat1( newData );
  }

  if ( version < 3.0 ) { // v2
    newData = compat2( newData );
  }

  newData.v = process.env.VERSION;
  return newData;
}
