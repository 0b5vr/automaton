let defObj = () => ( {
  length: 1.0,
  resolution: 1000.0,
  params: []
} );

let compat = ( json ) => {
  if ( !json ) {
    return defObj();
  }

  let data = JSON.parse( json );
  let rev = data.rev;

  if ( rev === 20170418 ) {
    return data;
  } else {
    if ( data.gui ) { // The "Shift" revision of automaton, has uncompatible gui params
      delete data.gui;
      return data;
    } else {
      console.log( "Loaded data is invalid or not compatible with this revision" );
      return defObj();
    }
  }
};

export default compat;