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

let compat = ( _data ) => {
  if ( !_data ) {
    return Object.assign( {}, defaultData );
  }

  let data;
  if ( typeof _data === 'object' ) {
    data = _data;
  } else if ( typeof _data === 'string' ) {
    try {
      data = JSON.parse( _data );
    } catch ( e ) {
      console.error( 'Loaded data is invalid' );
      return Object.assign( {}, defaultData );
    }
  } else {
    console.error( 'Loaded data is invalid' );
    return Object.assign( {}, defaultData );
  }

  let v = parseFloat( data.v );

  if ( !v && !data.rev ) {
    if ( data.gui ) { // "Shift" version of automaton, has incompatible gui params
      delete data.gui;
      data.gui = Object.assign( {}, defaultData.gui );
    } else {
      console.error( 'Loaded data is not compatible with this revision' );
      return Object.assign( {}, defaultData );
    }
  }

  if ( data.rev ) { // fuck
    v = 1.0;
    delete data.rev;
  }

  if ( v < 2.0 ) { // v1, modes and modifiers, CURSED
    for ( const name in data.params ) {
      let param = data.params[ name ];
      data.params[ name ] = {
        nodes: param.map( ( node, i ) => ( {
          time: node.time,
          value: node.value,
          in: i === 0 ? undefined : { time: 0.0, value: 0.0 },
          out: ( i === param.length - 1 ) ? undefined : { time: 0.0, value: 0.0 }
        } ) ),
        fxs: []
      };
    }
  }

  data.v = process.env.VERSION;
  return data;
};

export default compat;