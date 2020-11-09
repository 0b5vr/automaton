/// <reference types="react" />
import { Action, State } from '../states/store';
import { AutomatonWithGUI } from '../../AutomatonWithGUI';
import { GUIRemocon } from '../../GUIRemocon';
import { Store } from 'redux';
interface AppProps {
    className?: string;
    store: Store<State, Action>;
    automaton: AutomatonWithGUI;
    guiRemocon: GUIRemocon;
}
declare const App: (props: AppProps) => JSX.Element;
export { App };
