import { GUISettings, defaultGUISettings } from './GUISettings';
import { SerializedData } from '@fms-cat/automaton';

/**
 * Interface of serialized automaton data.
 * It's a [[AutomatonWithGUI]] variant.
 */
export interface SerializedDataWithGUI extends SerializedData {
  /**
   * Version of the automaton.
   */
  version: string;

  /**
   * Field that contains [[GUISettings]].
   */
  guiSettings: GUISettings;
}

export const defaultDataWithGUI: Readonly<SerializedDataWithGUI> = {
  version: process.env.VERSION!,
  length: 1.0,
  resolution: 100,
  channels: {},
  guiSettings: defaultGUISettings
};
