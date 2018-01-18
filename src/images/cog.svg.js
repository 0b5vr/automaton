let s = 100.0;
let c = s / 2.0;
for ( let i = 0; i < 24; i ++ ) {
  let r = ( i & 2 ) === 0 ? 100 * 0.42 : 100 * 0.30;
  let t = Math.PI * ( i - 0.5 ) / 12.0;

  console.log(
    "L " +
    Math.round( c + Math.cos( t ) * r ) + " " +
    Math.round( c + Math.sin( t ) * r )
  );
}