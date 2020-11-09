import { GUISettings } from './GUISettings';
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
     * Labels of the automaton.
     */
    labels?: {
        [name: string]: number;
    };
    /**
     * Field that contains [[GUISettings]].
     */
    guiSettings?: Partial<GUISettings>;
}
export declare const defaultDataWithGUI: Readonly<SerializedAutomatonWithGUI>;
