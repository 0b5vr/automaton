import { GUISettings, defaultGUISettings } from './GUISettings';
import { SerializedAutomaton } from '@fms-cat/automaton';

/**
 * Interface of serialized automaton data.
 * It's a [[AutomatonWithGUI]] variant.
 */
export interface SerializedAutomatonWithGUI extends SerializedAutomaton {
  /**
   * Version of the automaton.
   */
  version: string;

  /**
   * Field that contains [[GUISettings]].
   */
  guiSettings: GUISettings;
}

export const defaultDataWithGUI: Readonly<SerializedAutomatonWithGUI> = {
  version: process.env.VERSION!,
  length: 1.0,
  resolution: 100,
  curves: [],
  channels: {},
  guiSettings: defaultGUISettings
};
