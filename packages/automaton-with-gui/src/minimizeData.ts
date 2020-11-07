import { MinimizeOptions } from './types/MinimizeOptions';
import { SerializedAutomaton, SerializedBezierNode, SerializedChannel, SerializedChannelItem, SerializedCurve, SerializedFxSection } from '@fms-cat/automaton';
import { SerializedAutomatonWithGUI } from './types/SerializedAutomatonWithGUI';

function prec( value: number, precision: number ): number {
  return Number( value.toFixed( precision ) );
}

function precOrUndefined( value: number | undefined, precision: number ): number | undefined {
  if ( value == null ) { return undefined; }
  return prec( value, precision );
}

function minimizeChannelItem(
  data: SerializedChannelItem,
  options: MinimizeOptions
): SerializedChannelItem {
  const time = precOrUndefined( data.time, options.precisionTime );
  const length = precOrUndefined( data.length, options.precisionTime );
  const value = precOrUndefined( data.value, options.precisionValue );
  const reset = data.reset ? true : undefined;
  const curve = data.curve;
  const speed = precOrUndefined( data.speed, options.precisionTime );
  const offset = precOrUndefined( data.offset, options.precisionTime );
  const amp = precOrUndefined( data.amp, options.precisionValue );

  return {
    time,
    length,
    value,
    reset,
    curve,
    speed,
    offset,
    amp
  };
}

function minimizeChannel(
  data: SerializedChannel,
  options: MinimizeOptions
): SerializedChannel {
  const items = data.items.map( ( item ) => minimizeChannelItem( item, options ) );

  return {
    items
  };
}

function minimizeNode(
  data: SerializedBezierNode,
  options: MinimizeOptions
): SerializedBezierNode {
  const time = precOrUndefined( data.time, options.precisionTime );
  const value = precOrUndefined( data.value, options.precisionValue );
  const inPoint = data.in ? {
    time: prec( data.in.time, options.precisionTime ),
    value: prec( data.in.value, options.precisionValue )
  } : undefined;
  const outPoint = data.out ? {
    time: prec( data.out.time, options.precisionTime ),
    value: prec( data.out.value, options.precisionValue )
  } : undefined;

  return {
    time,
    value,
    in: inPoint,
    out: outPoint
  };
}

function minimizeFx(
  data: SerializedFxSection,
  options: MinimizeOptions
): SerializedFxSection | null {
  if ( data.bypass ) { return null; }

  const def = data.def;
  const time = precOrUndefined( data.time, options.precisionValue );
  const length = precOrUndefined( data.length, options.precisionTime );
  const row = data.row;
  const params = data.params;

  return {
    def,
    time,
    length,
    row,
    params
  };
}

function minimizeCurve(
  data: SerializedCurve,
  options: MinimizeOptions
): SerializedCurve {
  const nodes = data.nodes.map( ( node ) => minimizeNode( node, options ) );

  const fxs: SerializedFxSection[] = [];
  data.fxs?.forEach( ( fx ) => {
    const minimizedFx = minimizeFx( fx, options );
    if ( minimizedFx ) {
      fxs.push( minimizedFx );
    }
  } );

  const minimized = {
    fxs: fxs.length !== 0 ? fxs : undefined,
    nodes
  };

  return minimized;
}

export function minimizeData(
  data: SerializedAutomatonWithGUI,
  options: MinimizeOptions
): SerializedAutomaton {
  const resolution = data.resolution;

  const curves = data.curves.map( ( curve ) => minimizeCurve( curve, options ) );

  const channels: { [ name: string ]: SerializedChannel } = {};
  Object.entries( data.channels ).map( ( [ name, value ] ) => {
    channels[ name ] = minimizeChannel( value, options );
  } );

  const minimized = {
    resolution,
    curves,
    channels,
  };

  return minimized;
}
