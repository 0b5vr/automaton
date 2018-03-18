let defObj = () => ( {
  length: 1.0,
  resolution: 1000.0,
  params: []
} );

let compat = ( json ) => {
  if ( !json ) {
    return defObj();
  }

  let data;
  try {
    data = JSON.parse( json );
  } catch ( e ) {
    console.error( "Automaton: Loaded data is invalid" );
    return defObj();
  }

  let v = parseFloat( data.v );

  if ( !v && !data.rev ) {
    if ( data.gui ) { // "Shift" version of automaton, has incompatible gui params
      delete data.gui;
    } else {
      console.error( "Automaton: Loaded data is not compatible with this revision" );
      return defObj();
    }
  }

  if ( data.rev ) { // fuck
    v = 1.0;
  }

  return data;
};

export default compat;