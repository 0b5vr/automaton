let def = ( _a, _b ) => {
  return typeof _a === "number" ? _a : _b;
};

// ------

let Interpolator = {};

// ------

Interpolator.MODE_LINEAR = 0;
Interpolator.MODE_SMOOTH = 1;
Interpolator.MODE_EXP = 2;
Interpolator.MODE_SPRING = 3;
Interpolator.MODE_GRAVITY = 4;
Interpolator.MODES = 5;

// ------

Interpolator.generate = ( _params ) => {
  let params = typeof _params === "object" ? _params : {};

  let mode = def( params.mode, Interpolator.MODE_LINEAR );
  let start = def( params.start, 0.0 );
  let end = def( params.end, 1.0 );
  let length = def( params.length, 32 );
  let deltaTime = def( params.deltaTime, 0.01 );

  let arr = [ start ];

  if ( mode === Interpolator.MODE_LINEAR ) {
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

  return arr;
};

// ------

export default Interpolator;