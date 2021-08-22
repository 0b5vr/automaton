import { defaultGUISettings } from '../types/GUISettings';
import { jsonCopy } from '../utils/jsonCopy';
import type { FxSection } from '@0b5vr/automaton';
import type { V2FxSection } from './v2types/V2FxSection';
import type { V2SerializedData } from './v2types/V2SerializedData';
import type { V3SerializedAutomatonWithGUI } from './v3types/V3SerializedAutomatonWithGUI';
import type { V3SerializedChannel } from './v3types/V3SerializedChannel';
import type { V3SerializedCurve } from './v3types/V3SerializedCurve';

export function v2Compat( data: V2SerializedData ): V3SerializedAutomatonWithGUI {
  const curves: V3SerializedCurve[] = [];
  const channels: { [ name: string ]: V3SerializedChannel } = {};

  Object.entries( data.params ).forEach( ( [ name, param ] ) => {
    const curve: V3SerializedCurve = {
      nodes: param.nodes,
      fxs: param.fxs.map( ( fx: V2FxSection ) => {
        const newFx: FxSection = {
          bypass: ( fx.bypass as any ),
          ...fx
        };
        return newFx;
      } )
    };
    const index = curves.length;
    curves.push( curve );

    const channel: V3SerializedChannel = {
      items: [ { curve: index } ]
    };
    channels[ name ] = channel;
  } );

  const newData: V3SerializedAutomatonWithGUI = {
    version: data.v,
    resolution: data.resolution,
    curves,
    channels,
    guiSettings: jsonCopy( defaultGUISettings )
  };

  return newData;
}
