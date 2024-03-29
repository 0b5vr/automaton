import { GUISettings } from './GUISettings';
import { SerializedAutomaton } from '@0b5vr/automaton';

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
   * Labels of the automaton.
   */
  labels?: { [ name: string ]: number };

  /**
   * Field that contains [[GUISettings]].
   */
  guiSettings?: Partial<GUISettings>;
}

export const defaultDataWithGUI: Readonly<SerializedAutomatonWithGUI> = {
  version: process.env.VERSION!,
  resolution: 100,
  curves: [],
  channels: []
};
