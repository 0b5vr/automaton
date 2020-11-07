export function preversionCompat( data: any ): any {
  if ( data.gui ) {
    delete data.gui; // the gui settings are incompatible
    return data;
  } else {
    console.error( 'Loaded data is not compatible with this revision' );
    return null;
  }
}
