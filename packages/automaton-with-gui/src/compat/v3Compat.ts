import { SerializedChannel } from '@fms-cat/automaton';
import type { SerializedAutomatonWithGUI } from '../types/SerializedAutomatonWithGUI';
import type { V3SerializedAutomatonWithGUI } from './v3types/V3SerializedAutomatonWithGUI';

export function v3Compat( data: V3SerializedAutomatonWithGUI ): SerializedAutomatonWithGUI {
  const channels: [ name: string, channel: SerializedChannel ][] = [];

  Object.entries( data.channels ).forEach( ( [ name, channel ] ) => {
    channels.push( [ name, channel ] );
  } );

  const newData: SerializedAutomatonWithGUI = {
    version: data.version,
    resolution: data.resolution,
    curves: data.curves,
    channels,
    labels: data.labels,
    guiSettings: data.guiSettings
  };

  return newData;
}
