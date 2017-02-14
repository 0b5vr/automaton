import Interpolator from "./interpolator";
import genColors from "./colors";

let colors;

let genImages = () => {
  let images = {};

  colors = genColors();

  let canvas = document.createElement( "canvas" );
  let s = canvas.width = canvas.height = 128;
  let context = canvas.getContext( "2d" );

  context.lineCap = "round";
  context.lineJoin = "round";

  let genImage = ( _func ) => {
    context.save();
    context.clearRect( 0, 0, s, s );
    _func();
    context.restore();

    return canvas.toDataURL();
  };

  // ------

  images.modes = [];

  for ( let i = 0; i < Interpolator.MODES; i ++ ) {
    images.modes[ i ] = genImage( () => {
      context.beginPath();
      context.moveTo( s / 8.0, s / 8.0 * 7.0 );
      let arr = Interpolator.generate( {
        mode: i
      } );
      for ( let i = 1; i < arr.length; i ++ ) {
        context.lineTo(
          s / 8.0 + s / 4.0 * 3.0 * i / arr.length,
          s / 8.0 * 7.0 - s / 4.0 * 3.0 * arr[ i ]
        );
      }

      context.strokeStyle = colors.accent;
      context.lineWidth = s / 12.0;
      context.stroke();
    } );
  }

  // ------

  images.mods = [];

  images.mods[ Interpolator.MOD_RESET ] = genImage( () => {
    context.beginPath();
    context.arc( s / 2.0, s / 2.0, s / 3.0, -Math.PI / 4.0, Math.PI / 4.0 * 5.0, false );
    context.moveTo( s / 2.0, s / 2.0 );
    context.lineTo( s / 2.0, s / 8.0 );

    context.strokeStyle = colors.accent;
    context.lineWidth = s / 12.0;
    context.stroke();
  } );

  images.mods[ Interpolator.MOD_SIN ] = genImage( () => {
    context.beginPath();
    context.moveTo( s / 8.0, s / 2.0 );
    let arr = Interpolator.generate( {
      mode: Interpolator.MODE_LINEAR,
      start: 0.5,
      end: 0.5,
      mods: [ false, {} ]
    } );
    for ( let i = 1; i < arr.length; i ++ ) {
      context.lineTo(
        s / 8.0 + s / 4.0 * 3.0 * i / arr.length,
        s / 8.0 * 7.0 - s / 4.0 * 3.0 * arr[ i ]
      );
    }

    context.strokeStyle = colors.accent;
    context.lineWidth = s / 12.0;
    context.stroke();
  } );

  images.mods[ Interpolator.MOD_NOISE ] = genImage( () => {
    context.beginPath();
    context.moveTo( s / 8.0, s / 2.0 );
    let arr = Interpolator.generate( {
      mode: Interpolator.MODE_LINEAR,
      start: 0.5,
      end: 0.5,
      mods: [ false, false, {} ]
    } );
    for ( let i = 1; i < arr.length; i ++ ) {
      context.lineTo(
        s / 8.0 + s / 4.0 * 3.0 * i / arr.length,
        s / 8.0 * 7.0 - s / 4.0 * 3.0 * arr[ i ]
      );
    }

    context.strokeStyle = colors.accent;
    context.lineWidth = s / 12.0;
    context.stroke();
  } );

  images.mods[ Interpolator.MOD_LOFI ] = genImage( () => {
    context.beginPath();
    context.moveTo( s / 8.0, s / 8.0 * 7.0 );
    let arr = Interpolator.generate( {
      mode: Interpolator.MODE_LINEAR,
      start: 0.0,
      end: 1.0,
      mods: [ false, false, false, {} ]
    } );
    for ( let i = 1; i < arr.length; i ++ ) {
      context.lineTo(
        s / 8.0 + s / 4.0 * 3.0 * i / arr.length,
        s / 8.0 * 7.0 - s / 4.0 * 3.0 * arr[ i ]
      );
    }

    context.strokeStyle = colors.accent;
    context.lineWidth = s / 12.0;
    context.stroke();
  } );

  // ------

  images.save = genImage( () => {
    context.beginPath();
    context.moveTo( s / 8.0, s / 8.0 );
    context.lineTo( s / 8.0, s / 8.0 * 7.0 );
    context.lineTo( s / 8.0 * 7.0, s / 8.0 * 7.0 );
    context.lineTo( s / 8.0 * 7.0, s / 4.0 );
    context.lineTo( s / 4.0 * 3.0, s / 8.0 );
    context.closePath();

    context.moveTo( s / 4.0, s / 2.0 );
    context.lineTo( s / 4.0 * 3.0, s / 2.0 );
    context.lineTo( s / 4.0 * 3.0, s / 6.0 * 5.0 );
    context.lineTo( s / 4.0, s / 6.0 * 5.0 );
    context.closePath();

    context.moveTo( s / 4.0, s / 6.0 );
    context.lineTo( s / 3.0 * 2.0, s / 6.0 );
    context.lineTo( s / 3.0 * 2.0, s / 8.0 * 3.0 );
    context.lineTo( s / 4.0, s / 8.0 * 3.0 );
    context.closePath();

    context.moveTo( s / 2.0, s / 5.0 );
    context.lineTo( s / 8.0 * 5.0, s / 5.0 );
    context.lineTo( s / 8.0 * 5.0, s / 3.0 );
    context.lineTo( s / 2.0, s / 3.0 );
    context.closePath();

    context.fillStyle = colors.accent;
    context.fill();
  } );

  images.beatsnap = genImage( () => {
    context.beginPath();
    
    context.moveTo( s / 8.0, s / 4.0 * 3.0 );
    context.lineTo( s / 8.0, s / 8.0 * 7.0 );
    context.lineTo( s / 8.0 * 3.0, s / 8.0 * 7.0 );
    context.lineTo( s / 8.0 * 3.0, s / 4.0 * 3.0 );
    context.closePath();

    context.moveTo( s / 8.0 * 5.0, s / 4.0 * 3.0 );
    context.lineTo( s / 8.0 * 5.0, s / 8.0 * 7.0 );
    context.lineTo( s / 8.0 * 7.0, s / 8.0 * 7.0 );
    context.lineTo( s / 8.0 * 7.0, s / 4.0 * 3.0 );
    context.closePath();

    context.fillStyle = colors.accent;
    context.fill();

    context.beginPath();
    context.moveTo( s / 8.0, s / 16.0 * 11.0 );
    context.lineTo( s / 8.0, s / 2.0 );
    context.arc( s / 2.0, s / 2.0, s / 8.0 * 3.0, Math.PI, 0.0, false );
    context.lineTo( s / 8.0 * 7.0, s / 16.0 * 11.0 );
    context.lineTo( s / 8.0 * 5.0, s / 16.0 * 11.0 );
    context.lineTo( s / 8.0 * 5.0, s / 2.0 );
    context.arc( s / 2.0, s / 2.0, s / 8.0, 0.0, Math.PI, true );
    context.lineTo( s / 8.0 * 3.0, s / 16.0 * 11.0 );
    context.closePath();

    context.fillStyle = colors.accent;
    context.fill();
  } );

  images.config = genImage( () => {
    context.beginPath();
    let c = s / 2.0;
    for ( let i = 0; i < 24; i ++ ) {
      let r = ( i & 2 ) === 0 ? s * 0.42 : s * 0.30;
      let t = Math.PI * ( i - 0.5 ) / 12.0;

      if ( i === 0 ) {
        context.moveTo( c + Math.cos( t ) * r, c + Math.sin( t ) * r );
      } else {
        context.lineTo( c + Math.cos( t ) * r, c + Math.sin( t ) * r );
      }
    }
    context.closePath();

    context.arc( c, c, s * 0.15, 0.0, Math.PI * 2.0, true );

    context.fillStyle = colors.accent;
    context.fill();
  } );

  images.save = genImage( () => {
    context.beginPath();
    context.moveTo( s / 8.0, s / 8.0 );
    context.lineTo( s / 8.0, s / 8.0 * 7.0 );
    context.lineTo( s / 8.0 * 7.0, s / 8.0 * 7.0 );
    context.lineTo( s / 8.0 * 7.0, s / 4.0 );
    context.lineTo( s / 4.0 * 3.0, s / 8.0 );
    context.closePath();

    context.moveTo( s / 4.0, s / 2.0 );
    context.lineTo( s / 4.0 * 3.0, s / 2.0 );
    context.lineTo( s / 4.0 * 3.0, s / 6.0 * 5.0 );
    context.lineTo( s / 4.0, s / 6.0 * 5.0 );
    context.closePath();

    context.moveTo( s / 4.0, s / 6.0 );
    context.lineTo( s / 3.0 * 2.0, s / 6.0 );
    context.lineTo( s / 3.0 * 2.0, s / 8.0 * 3.0 );
    context.lineTo( s / 4.0, s / 8.0 * 3.0 );
    context.closePath();

    context.moveTo( s / 2.0, s / 5.0 );
    context.lineTo( s / 8.0 * 5.0, s / 5.0 );
    context.lineTo( s / 8.0 * 5.0, s / 3.0 );
    context.lineTo( s / 2.0, s / 3.0 );
    context.closePath();

    context.fillStyle = colors.accent;
    context.fill();
  } );

  return images;
};

export default genImages;