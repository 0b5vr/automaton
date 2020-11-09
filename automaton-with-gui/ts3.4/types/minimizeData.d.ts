import { MinimizeOptions } from './types/MinimizeOptions';
import { SerializedAutomaton } from '@fms-cat/automaton';
import { SerializedAutomatonWithGUI } from './types/SerializedAutomatonWithGUI';
export declare function minimizeData(data: SerializedAutomatonWithGUI, options: MinimizeOptions): SerializedAutomaton;
