import { SerializedChannel } from '@fms-cat/automaton';
import { defaultGUISettings } from '../types/GUISettings';
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
    guiSettings: {
      snapTimeActive: data.guiSettings?.snapTimeActive,
      snapTimeInterval: data.guiSettings?.snapTimeInterval,
      snapValueActive: data.guiSettings?.snapValueActive,
      snapValueInterval: data.guiSettings?.snapValueInterval,
      snapBeatActive: data.guiSettings?.snapBeatActive,
      bpm: data.guiSettings?.snapBeatBPM,
      beatOffset: defaultGUISettings.beatOffset,
      useBeatInGUI: data.guiSettings?.useBeatInGUI,
      minimizedPrecisionTime: data.guiSettings?.minimizedPrecisionTime,
      minimizedPrecisionValue: data.guiSettings?.minimizedPrecisionValue,
    }
  };

  return newData;
}
