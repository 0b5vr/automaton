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

  images.linear = genImage( () => {
    context.beginPath();
    context.moveTo( s / 8.0, s / 8.0 * 7.0 );
    let arr = Interpolator.generate( {
      mode: Interpolator.MODE_LINEAR
    } );
    for ( let i = 1; i < arr.length; i ++ ) {
      context.lineTo(
        s / 8.0 + s / 4.0 * 3.0 * i / arr.length,
        s / 8.0 * 7.0 - s / 4.0 * 3.0 * arr[ i ]
      );
    }

    context.strokeStyle = colors.accent;
    context.lineWidth = s / 16.0;
    context.stroke();
  } );

  images.smooth = genImage( () => {
    context.beginPath();
    context.moveTo( s / 8.0, s / 8.0 * 7.0 );
    let arr = Interpolator.generate( {
      mode: Interpolator.MODE_SMOOTH
    } );
    for ( let i = 1; i < arr.length; i ++ ) {
      context.lineTo(
        s / 8.0 + s / 4.0 * 3.0 * i / arr.length,
        s / 8.0 * 7.0 - s / 4.0 * 3.0 * arr[ i ]
      );
    }

    context.strokeStyle = colors.accent;
    context.lineWidth = s / 16.0;
    context.stroke();
  } );

  images.exp = genImage( () => {
    context.beginPath();
    context.moveTo( s / 8.0, s / 8.0 * 7.0 );
    let arr = Interpolator.generate( {
      mode: Interpolator.MODE_EXP
    } );
    for ( let i = 1; i < arr.length; i ++ ) {
      context.lineTo(
        s / 8.0 + s / 4.0 * 3.0 * i / arr.length,
        s / 8.0 * 7.0 - s / 4.0 * 3.0 * arr[ i ]
      );
    }

    context.strokeStyle = colors.accent;
    context.lineWidth = s / 16.0;
    context.stroke();
  } );

  images.spring = genImage( () => {
    context.beginPath();
    context.moveTo( s / 8.0, s / 8.0 * 7.0 );
    let arr = Interpolator.generate( {
      mode: Interpolator.MODE_SPRING
    } );
    for ( let i = 1; i < arr.length; i ++ ) {
      context.lineTo(
        s / 8.0 + s / 4.0 * 3.0 * i / arr.length,
        s / 8.0 * 7.0 - s / 4.0 * 3.0 * arr[ i ]
      );
    }

    context.strokeStyle = colors.accent;
    context.lineWidth = s / 16.0;
    context.stroke();
  } );

  images.gravity = genImage( () => {
    context.beginPath();
    context.moveTo( s / 8.0, s / 8.0 * 7.0 );
    let arr = Interpolator.generate( {
      mode: Interpolator.MODE_GRAVITY
    } );
    for ( let i = 1; i < arr.length; i ++ ) {
      context.lineTo(
        s / 8.0 + s / 4.0 * 3.0 * i / arr.length,
        s / 8.0 * 7.0 - s / 4.0 * 3.0 * arr[ i ]
      );
    }

    context.strokeStyle = colors.accent;
    context.lineWidth = s / 16.0;
    context.stroke();
  } );

  return images;
};

export default genImages;