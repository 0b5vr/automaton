import { SerializedAutomaton, SerializedChannel, SerializedCurve, SerializedFxSection } from '@fms-cat/automaton';
import { SerializedAutomatonWithGUI } from './types/SerializedAutomatonWithGUI';

function minimizeChannel( data: SerializedChannel ): SerializedChannel {
  const minimized = {
    items: data.items
  };

  return minimized;
}

function minimizeCurve( data: SerializedCurve ): SerializedCurve {
  const nodes = data.nodes;

  const fxs: SerializedFxSection[] = [];
  data.fxs?.forEach( ( fx ) => {
    if ( !fx.bypass ) {
      fxs.push( fx );
    }
  } );

  const minimized = {
    fxs: fxs.length !== 0 ? fxs : undefined,
    nodes
  };

  return minimized;
}

export function minimizeData( data: SerializedAutomatonWithGUI ): SerializedAutomaton {
  const resolution = data.resolution;

  const curves = data.curves.map( ( curve ) => minimizeCurve( curve ) );

  const channels: { [ name: string ]: SerializedChannel } = {};
  Object.entries( data.channels ).map( ( [ name, value ] ) => {
    channels[ name ] = minimizeChannel( value );
  } );

  const minimized = {
    resolution,
    curves,
    channels,
  };

  return minimized;
}
