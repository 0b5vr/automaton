/// <reference types="react" />
import { AutomatonWithGUI } from '../../AutomatonWithGUI';
export interface AutomatonStateListenerProps {
    automaton: AutomatonWithGUI;
}
declare const AutomatonStateListener: (props: AutomatonStateListenerProps) => JSX.Element;
export { AutomatonStateListener };
