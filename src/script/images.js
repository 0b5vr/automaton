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

  images.modes = [];
  for ( let i = 0; i < Interpolator.MODES; i ++ ) {
    images.modes[ i ] = [];
    for ( let j = 0; j < 2; j ++ ) {
      images.modes[ i ][ j ] = genImage( () => {
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

        context.strokeStyle = j ? colors.accent : "#888";
        context.lineWidth = s / 12.0;
        context.stroke();
      } );
    }
  }

  images.mods = [];

  images.mods[ Interpolator.MOD_RESET ] = [];
  for ( let j = 0; j < 2; j ++ ) {
    images.mods[ Interpolator.MOD_RESET ][ j ] = genImage( () => {
      context.beginPath();
      context.arc( s / 2.0, s / 2.0, s / 3.0, -Math.PI / 4.0, Math.PI / 4.0 * 5.0, false );
      context.moveTo( s / 2.0, s / 2.0 );
      context.lineTo( s / 2.0, s / 8.0 );

      context.strokeStyle = j ? colors.accent : "#888";
      context.lineWidth = s / 12.0;
      context.stroke();
    } );
  }

  images.mods[ Interpolator.MOD_SIN ] = [];
  for ( let j = 0; j < 2; j ++ ) {
    images.mods[ Interpolator.MOD_SIN ][ j ] = genImage( () => {
      context.beginPath();
      context.moveTo( s / 8.0, s / 2.0 );
      let arr = Interpolator.generate( {
        mode: Interpolator.MODE_LINEAR,
        start: 0.5,
        end: 0.5,
        mods: [ null, { active: true }, null ]
      } );
      for ( let i = 1; i < arr.length; i ++ ) {
        context.lineTo(
          s / 8.0 + s / 4.0 * 3.0 * i / arr.length,
          s / 8.0 * 7.0 - s / 4.0 * 3.0 * arr[ i ]
        );
      }

      context.strokeStyle = j ? colors.accent : "#888";
      context.lineWidth = s / 12.0;
      context.stroke();
    } );
  }

  images.mods[ Interpolator.MOD_NOISE ] = [];
  for ( let j = 0; j < 2; j ++ ) {
    images.mods[ Interpolator.MOD_NOISE ][ j ] = genImage( () => {
      context.beginPath();
      context.moveTo( s / 8.0, s / 2.0 );
      let arr = Interpolator.generate( {
        mode: Interpolator.MODE_LINEAR,
        start: 0.5,
        end: 0.5,
        mods: [ null, null, { active: true } ]
      } );
      for ( let i = 1; i < arr.length; i ++ ) {
        context.lineTo(
          s / 8.0 + s / 4.0 * 3.0 * i / arr.length,
          s / 8.0 * 7.0 - s / 4.0 * 3.0 * arr[ i ]
        );
      }

      context.strokeStyle = j ? colors.accent : "#888";
      context.lineWidth = s / 12.0;
      context.stroke();
    } );
  }

  return images;
};

export default genImages;