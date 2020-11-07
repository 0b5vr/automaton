export function duplicateName( name: string, existingSet: Set<string> ): string {
  const match = name.match( /_(\d+)$/ );
  const i0 = match == null
    ? 1
    : ( parseInt( match[ 1 ] ) + 1 );
  const basename = match == null
    ? name
    : name.substring( 0, name.length - match[ 0 ].length );

  for ( let i = i0; i < 1E9; i ++ ) {
    const newName = `${ basename }_${ i }`;
    if ( !existingSet.has( newName ) ) {
      return newName;
    }
  }

  throw new Error( 'duplicateName: Couldn\'t create a duplicate name. Something really weird is happening 🤔' );
}
