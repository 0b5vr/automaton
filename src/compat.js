let defaultData = {
  v: process.env.VERSION,

  length: 1.0,
  resolution: 1000.0,
  params: [],

  gui: {
    snap: {
      enable: false,
      bpm: 120,
      offset: 0
    }
  }
};

let compat = ( json ) => {
  if ( !json ) {
    return Object.assign( {}, defaultData );
  }

  let data;
  try {
    data = JSON.parse( json );
  } catch ( e ) {
    console.error( "Automaton: Loaded data is invalid" );
    return Object.assign( {}, defaultData );
  }

  let v = parseFloat( data.v );

  if ( !v && !data.rev ) {
    if ( data.gui ) { // "Shift" version of automaton, has incompatible gui params
      delete data.gui;
      data.gui = Object.assign( {}, defaultData.gui );
    } else {
      console.error( "Automaton: Loaded data is not compatible with this revision" );
      return Object.assign( {}, defaultData );
    }
  }

  if ( data.rev ) { // fuck
    v = 1.0;
    delete data.rev;
  }

  data.v = process.env.VERSION;
  return data;
};

export default compat;