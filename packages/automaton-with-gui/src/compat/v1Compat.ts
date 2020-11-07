export function v1Compat( data: any ): any {
  const newData = data;

  for ( const name in newData.params ) {
    const oldParam: any[] = newData.params[ name ];
    const newParam = {
      nodes: oldParam.map( ( node, i ) => ( {
        time: node.time,
        value: node.value,
        in: i === 0 ? undefined : { time: 0.0, value: 0.0 },
        out: ( i === oldParam.length - 1 ) ? undefined : { time: 0.0, value: 0.0 }
      } ) ),
      fxs: [] as any[]
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
            time: oldParam[ i - 1 ].time - 1.0 / newData.resolution, // 🔥
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
            time: oldParam[ i - 1 ].time - 1.0 / newData.resolution, // 🔥
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
            time: oldParam[ i - 1 ].time - 1.0 / newData.resolution, // 🔥
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
    newData.params[ name ] = newParam;
  }

  newData.guiSettings = {
    snapActive: false,
    snapTime: 0.1,
    snapValue: 0.1
  };

  return newData;
}
