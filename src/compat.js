import ParamWithGUI from './param-gui';

const defaultData = {
  v: process.env.VERSION,

  length: 1.0,
  resolution: 1000.0,
  params: {},

  guiSettings: {
    snapActive: false,
    snapTime: 0.1,
    snapValue: 0.1
  }
};

const compat = ( _data ) => {
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
    } else { // wtf is this
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
      const oldParam = data.params[ name ];
      const newParam = {
        nodes: oldParam.map( ( node, i ) => ( {
          time: node.time,
          value: node.value,
          in: i === 0 ? undefined : { time: 0.0, value: 0.0 },
          out: ( i === oldParam.length - 1 ) ? undefined : { time: 0.0, value: 0.0 }
        } ) ),
        fxs: []
      };

      let head = 0;
      for ( let i = 1; i < oldParam.length; i ++ ) {
        head ++;

        if ( oldParam[ i ].mode === 0 ) { // hold
          newParam.nodes.splice( head, 0, {
            time: oldParam[ i ].time,
            value: oldParam[ i - 1 ].value,
            in: { time: 0.0, value: 0.0 },
            out: { time: 0.0, value: 0.0 }
          } );
          head ++;
        } else if ( oldParam[ i ].mode === 1 ) { // linear
          // do nothing
        } else if ( oldParam[ i ].mode === 2 ) { // cosine
          const l = newParam.nodes[ head ].time - newParam.nodes[ head - 1 ].time;
          newParam.nodes[ head - 1 ].out = { time: l * 0.37, value: 0.0 };
          newParam.nodes[ head ].in = { time: -l * 0.37, value: 0.0 };
        } else {
          newParam.nodes.splice( head, 0, {
            time: oldParam[ i - 1 ].time,
            value: oldParam[ i ].value,
            in: { time: 0.0, value: 0.0 },
            out: { time: 0.0, value: 0.0 }
          } );
          head ++;

          if ( oldParam[ i ].mode === 3 ) { // exp
            newParam.fxs.push( {
              name: 'Exponential Smoothing',
              bypass: false,
              row: 0,
              time: oldParam[ i - 1 ].time - 1.0 / data.resolution, // 🔥
              length: oldParam[ i ].time - oldParam[ i - 1 ].time,
              params: {
                factor: oldParam[ i ].params.factor,
                preserve: true
              }
            } );
          } else if ( oldParam[ i ].mode === 4 ) { // spring
            newParam.fxs.push( {
              name: 'Critically Damped Spring',
              bypass: false,
              row: 0,
              time: oldParam[ i - 1 ].time - 1.0 / data.resolution, // 🔥
              length: oldParam[ i ].time - oldParam[ i - 1 ].time,
              params: {
                factor: oldParam[ i ].params.rate,
                ratio: oldParam[ i ].params.damp,
                preserve: true
              }
            } );
          } else if ( oldParam[ i ].mode === 5 ) { // gravity
            newParam.fxs.push( {
              name: 'Gravity',
              bypass: false,
              row: 0,
              time: oldParam[ i - 1 ].time - 1.0 / data.resolution, // 🔥
              length: oldParam[ i ].time - oldParam[ i - 1 ].time,
              params: {
                a: oldParam[ i ].params.gravity,
                e: oldParam[ i ].params.bounce,
                preserve: true
              }
            } );
          }
        }

        if ( oldParam[ i ].mods[ 1 ] ) {
          newParam.fxs.push( {
            name: 'Sinewave',
            bypass: false,
            row: 1,
            time: oldParam[ i - 1 ].time,
            length: oldParam[ i ].time - oldParam[ i - 1 ].time,
            params: {
              freq: oldParam[ i ].mods[ 1 ].freq,
              amp: oldParam[ i ].mods[ 1 ].amp,
              phase: oldParam[ i ].mods[ 1 ].phase
            }
          } );
        }

        if ( oldParam[ i ].mods[ 2 ] ) {
          newParam.fxs.push( {
            name: 'Fractal Noise',
            bypass: false,
            row: 2,
            time: oldParam[ i - 1 ].time,
            length: oldParam[ i ].time - oldParam[ i - 1 ].time,
            params: {
              amp: oldParam[ i ].mods[ 2 ].amp,
              recursion: oldParam[ i ].mods[ 2 ].recursion,
              freq: oldParam[ i ].mods[ 2 ].freq,
              reso: oldParam[ i ].mods[ 2 ].reso,
              seed: oldParam[ i ].mods[ 2 ].seed
            }
          } );
        }

        if ( oldParam[ i ].mods[ 3 ] ) {
          newParam.fxs.push( {
            name: 'Lo-Fi',
            bypass: false,
            row: 3,
            time: oldParam[ i - 1 ].time,
            length: oldParam[ i ].time - oldParam[ i - 1 ].time,
            params: {
              resolution: oldParam[ i ].mods[ 3 ].freq,
              relative: true
            }
          } );
        }
      }
      data.params[ name ] = newParam;
    }

    data.guiSettings = {
      snapActive: false,
      snapTime: 0.1,
      snapValue: 0.1
    };
  }

  data.v = process.env.VERSION;
  return data;
};

export default compat;