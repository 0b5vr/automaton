import * as About from './About';
import * as Automaton from './Automaton';
import * as ContextMenu from './ContextMenu';
import * as CurveEditor from './CurveEditor';
import * as FxSpawner from './FxSpawner';
import * as Header from './Header';
import * as History from './History';
import * as Settings from './Settings';
import * as TextPrompt from './TextPrompt';
import * as Timeline from './Timeline';
import * as Toasty from './Toasty';
import * as Workspace from './Workspace';
import { Dispatch, Store } from 'redux';
export interface State {
    about: About.State;
    automaton: Automaton.State;
    contextMenu: ContextMenu.State;
    curveEditor: CurveEditor.State;
    fxSpawner: FxSpawner.State;
    header: Header.State;
    history: History.State;
    settings: Settings.State;
    textPrompt: TextPrompt.State;
    timeline: Timeline.State;
    toasty: Toasty.State;
    workspace: Workspace.State;
}
export declare type Action = (About.Action | Automaton.Action | ContextMenu.Action | CurveEditor.Action | FxSpawner.Action | Header.Action | History.Action | Settings.Action | TextPrompt.Action | Timeline.Action | Toasty.Action | Workspace.Action | {
    type: 'Reset';
});
export declare function createStore(): Store<State, Action>;
export declare function useSelector<T>(selector: (state: State) => T): T;
export declare function useDispatch(): Dispatch<Action>;
export declare function useStore(): Store<State, Action>;
