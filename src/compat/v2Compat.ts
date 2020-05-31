import { FxSection, SerializedChannel, SerializedCurve } from '@fms-cat/automaton';
import { SerializedAutomatonWithGUI } from '../types/SerializedAutomatonWithGUI';
import { V2FxSection } from './v2types/V2FxSection';
import { V2SerializedData } from './v2types/V2SerializedData';
import { defaultGUISettings } from '../types/GUISettings';
import { jsonCopy } from '../utils/jsonCopy';

export function v2Compat( data: V2SerializedData ): SerializedAutomatonWithGUI {
  const curves: SerializedCurve[] = [];
  const channels: { [ name: string ]: SerializedChannel } = {};

  Object.entries( data.params ).forEach( ( [ name, param ] ) => {
    const curve: SerializedCurve = {
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

    const channel: SerializedChannel = {
      items: [ { curve: index } ]
    };
    channels[ name ] = channel;
  } );

  const newData: SerializedAutomatonWithGUI = {
    version: data.v,
    resolution: data.resolution,
    curves,
    channels,
    guiSettings: jsonCopy( defaultGUISettings )
  };

  return newData;
}
