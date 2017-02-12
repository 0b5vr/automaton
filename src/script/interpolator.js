import genNoise from "./noise";

// ------

let def = ( _a, _b ) => {
  return typeof _a === "number" ? _a : _b;
};

// ------

let Interpolator = {};

// ------

Interpolator.MODE_HOLD = 0;
Interpolator.MODE_LINEAR = 1;
Interpolator.MODE_SMOOTH = 2;
Interpolator.MODE_EXP = 3;
Interpolator.MODE_SPRING = 4;
Interpolator.MODE_GRAVITY = 5;
Interpolator.MODES = 6;

Interpolator.modeNames = [
  "Hold",
  "Linear",
  "Smoothstep",
  "Exp. Smooth",
  "Critically Damped Spring",
  "Gravity and Bounce"
];

Interpolator.MOD_RESET = 0;
Interpolator.MOD_SIN = 1;
Interpolator.MOD_NOISE = 2;
Interpolator.MODS = 3;

Interpolator.modNames = [
  "Reset",
  "Sine Curve",
  "Perlin Noise"
];

// ------

Interpolator.generate = ( _params ) => {
  let params = typeof _params === "object" ? _params : {};

  let mode = def( params.mode, Interpolator.MODE_LINEAR );
  let start = def( params.start, 0.0 );
  let end = def( params.end, 1.0 );
  let length = def( params.length, 32 );
  let deltaTime = def( params.deltaTime, 0.01 );
  
  let mods = typeof params.mods === "object" ? params.mods : [];
  for ( let i = 0; i < Interpolator.MODS; i ++ ) {
    mods[ i ] = mods[ i ] ? mods[ i ] : { active: false };
  }

  let arr = [ start ];

  if ( mode === Interpolator.MODE_HOLD ) {
    for ( let i = 1; i < length; i ++ ) {
      arr[ i ] = start;
    }
    arr[ length - 1 ] = end;
  } else if ( mode === Interpolator.MODE_LINEAR ) {
    for ( let i = 1; i < length; i ++ ) {
      let prog = i / ( length - 1 );
      arr[ i ] = start + ( end - start ) * prog;
    }
  } else if ( mode === Interpolator.MODE_SMOOTH ) {
    for ( let i = 1; i < length; i ++ ) {
      let prog = i / ( length - 1 );
      let smooth = prog * prog * ( 3.0 - 2.0 * prog );
      arr[ i ] = start + ( end - start ) * smooth;
    }
  } else if ( mode === Interpolator.MODE_EXP ) {
    let factor = def( params.factor, 10.0 );
    for ( let i = 1; i < length; i ++ ) {
      let time = i * deltaTime;
      let curve = 1.0 - Math.exp( -factor * time );
      arr[ i ] = start + ( end - start ) * curve;
    }
  } else if ( mode === Interpolator.MODE_SPRING ) {
    let rate = def( params.rate, 500.0 );
    let damp = def( params.damp, 1.0 );
    let vel = def( params.vel, 0.0 );
    let pos = start;
    for ( let i = 1; i < length; i ++ ) {
      vel += ( -rate * ( pos - end ) - 2.0 * vel * Math.sqrt( rate ) * damp ) * deltaTime;
      pos += vel * deltaTime;
      arr[ i ] = pos;
    }
  } else if ( mode === Interpolator.MODE_GRAVITY ) {
    let gravity = def( params.gravity, 70.0 );
    let bounce = def( params.bounce, 0.3 );
    let vel = def( params.vel, 0.0 );
    let sig = Math.sign( end - start );
    let pos = start;
    for ( let i = 1; i < length; i ++ ) {
      vel += gravity * sig * deltaTime;
      pos += vel * deltaTime;
      if ( sig !== Math.sign( end - pos ) ) {
        pos = end + ( end - pos ) * bounce;
        vel *= -bounce;
      }
      arr[ i ] = pos;
    }
  }

  if ( mods[ Interpolator.MOD_SIN ].active ) {
    let freq = def( mods[ Interpolator.MOD_SIN ].freq, 2.0 );
    let amp = def( mods[ Interpolator.MOD_SIN ].amp, 0.5 );
    let phase = def( mods[ Interpolator.MOD_SIN ].phase, 0.0 );
    for ( let i = 0; i < length; i ++ ) {
      arr[ i ] += Math.sin( phase * Math.PI * 2.0 ) * amp;
      phase = ( phase + 1.0 / ( length - 1 ) * freq ) % 1.0;
    }
  }

  if ( mods[ Interpolator.MOD_NOISE ].active ) {
    let amp = def( mods[ Interpolator.MOD_NOISE ].amp, 1.0 );

    let noise = genNoise( {
      length: length,
      recursion: def( mods[ Interpolator.MOD_NOISE ].recursion, 3.0 ),
      freq: def( mods[ Interpolator.MOD_NOISE ].freq, 1.0 ) * ( length - 1 ) / length,
      reso: def( mods[ Interpolator.MOD_NOISE ].reso, 4.0 ),
      seed: def( mods[ Interpolator.MOD_NOISE ].seed, 175.0 )
    } );

    for ( let i = 0; i < length; i ++ ) {
      arr[ i ] += noise[ i ] * amp;
    }
  }

  return arr;
};

// ------

export default Interpolator;