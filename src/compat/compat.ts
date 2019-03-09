import { SerializedData, defaultData } from '../types/SerializedData';
import { compat1 } from './compat1';
import { compatPreVersions } from './compatPreVersions';

export function compat( data: any ): SerializedData {
  if ( !data ) {
    return Object.assign( {}, defaultData );
  }

  let newData;
  if ( typeof data === 'object' ) {
    newData = data;
  } else if ( typeof data === 'string' ) {
    console.error( 'Data should be parsed JSON' );
    return Object.assign( {}, defaultData );
  } else {
    console.error( 'Loaded data is invalid' );
    return Object.assign( {}, defaultData );
  }

  let v = parseFloat( newData.v );

  if ( !v && !newData.rev ) {
    newData = compatPreVersions( newData );
    if ( newData === null ) {
      return Object.assign( {}, defaultData );
    }
  }

  if ( newData.rev ) { // fuck
    v = 1.0;
    delete newData.rev;
  }

  if ( v < 2.0 ) { // v1, modes and modifiers, CURSED
    newData = compat1( newData );
  }

  newData.v = process.env.VERSION;
  return newData;
}

export default compat;