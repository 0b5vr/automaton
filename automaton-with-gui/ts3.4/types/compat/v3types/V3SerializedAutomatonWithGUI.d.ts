import { V3GUISettings } from './V3GUISettings';
import { V3SerializedAutomaton } from './V3SerializedAutomaton';
export interface V3SerializedAutomatonWithGUI extends V3SerializedAutomaton {
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
    guiSettings?: Partial<V3GUISettings>;
}
