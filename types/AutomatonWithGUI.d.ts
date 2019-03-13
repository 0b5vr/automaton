import { Automaton, AutomatonOptions } from './Automaton';
import { FxParam } from './types/FxDefinition';
import { ParamWithGUI } from './ParamWithGUI';
import { SerializedData } from './types/SerializedData';
import { SerializedParam } from './types/SerializedParam';
/**
 * Interface for options of {@link AutomatonWithGUI}.
 */
export interface AutomatonWithGUIOptions extends AutomatonOptions {
    /**
     * DOM element where you want to attach the Automaton GUI
     */
    gui: HTMLElement;
}
/**
 * Interface for automaton GUI settings.
 */
export interface AutomatonGUISettings {
    /**
     * Whether snap is activeted or not.
     */
    snapActive: boolean;
    /**
     * Interval of snap, in time axis.
     */
    snapTime: number;
    /**
     * Interval of snap, in value axis.
     */
    snapValue: number;
}
/**
 * IT'S AUTOMATON!
 * It's `automaton.js` and `automaton.min.js` version.
 * @param {Object} options Options for this Automaton instance
 */
export declare class AutomatonWithGUI extends Automaton {
    /**
     * Params of the timeline.
     */
    protected __params: {
        [name: string]: ParamWithGUI;
    };
    /**
     * GUI settings for this automaton.
     */
    guiSettings: AutomatonGUISettings;
    /**
     * History stack.
     * Will be managed from {@link AutomatonWithGUI#pushHistory|pushHistory()}, navigated from {@link AutomatonWithGUI#undo|undo()} and {@link AutomatonWithGUI#redo|redo()}.
     */
    private __history;
    /**
     * Current position of history stack.
     */
    private __historyIndex;
    /**
     * Vue instance that manages automaton gui.
     */
    private __vue?;
    constructor(options: AutomatonWithGUIOptions);
    /**
     * Generate default fx params object.
     * @param id Id of the fx
     * @returns Default fx params object
     */
    generateDefaultFxParams(id: string): {
        [key: string]: any;
    };
    /**
     * Toggle play / pause.
     */
    togglePlay(): void;
    /**
     * Put some operation into the history stack.
     * Since it should accessible from GUI this function is public, it's basically `-- DON'T TOUCH IT KIDDO --`
     * @param desc Description of the operation
     * @param do Operation
     * @param undo Operation that undoes the `_do`
     * @param execute do will be executed instantly if true
     * @returns `any` if `_execute` is true, `void` otherwise
     */
    pushHistory(description: string, doOperation: () => any, undoOperation: () => any, execute?: boolean): any;
    /**
     * Undo the operation based on history stack.
     * Can be performed via GUI.
     * @returns Result of _undo
     */
    undo(): any;
    /**
     * Redo the operation based on history stack.
     * Can be performed via GUI.
     * @returns Result of _do
     */
    redo(): any;
    /**
     * Return description of latest operation.
     * If there are no operation before the current state, it will return empty string instead.
     * @returns Description of operation
     */
    getUndoDesc(): string;
    /**
     * Return description of recently undo-ed operation.
     * If there are no operation after the current state, it will return empty string instead.
     * @returns Description of operation
     */
    getRedoDesc(): string;
    /**
     * Drop all the history. YABAI.
     */
    dropHistory(): void;
    /**
     * Set new length for this automaton instance.
     * **Some nodes / fxs might be automatically removed / changed.**
     * Can be performed via GUI.
     * @param length New length for the automaton
     */
    setLength(length: number): void;
    /**
     * Set new resolution for this automaton instance.
     * @param resolultion New resolution for the automaton lul
     */
    setResolution(resolultion: number): void;
    /**
     * Create a new param.
     * @param name Name of param
     * @returns Created param
     */
    createParam(name: string, data?: SerializedParam): ParamWithGUI;
    /**
     * Remove a param.
     * @param name Name of param
     */
    removeParam(name: string): void;
    /**
     * Get a param.
     * @param name Name of the param
     * @returns Param object
     */
    getParam(name: string): ParamWithGUI | null;
    /**
     * Return list of name of params. Sorted.
     * @returns List of name of params
     */
    getParamNames(): string[];
    /**
     * Return list of id of fx definitions. Sorted.
     * @returns List of id of fx definitions
     */
    getFxDefinitionIds(): string[];
    /**
     * Return display name of a fx definition.
     * If it can't find the fx definition, it returns `null` instead.
     * @param id Id of the fx definition you want to grab
     * @returns Name of the fx definition
     */
    getFxDefinitionName(id: string): string | null;
    /**
     * Return description of a fx definition.
     * If it can't find the fx definition, it returns `null` instead.
     * @param id Id of the fx definition you want to grab
     * @returns Description of the fx definition
     */
    getFxDefinitionDescription(id: string): string | null;
    /**
     * Return params section of a fx definition.
     * If it can't find the fx definition, it returns `null` instead.
     * @param id Id of the fx definition you want to grab
     * @returns Params section
     */
    getFxDefinitionParams(id: string): {
        [key: string]: FxParam;
    } | null;
    /**
     * Return count of params.
     * @returns Count of params
     */
    countParams(): number;
    /**
     * Load automaton state data.
     * @param data Object contains automaton data.
     */
    load(data: SerializedData): void;
    /**
     * Export current state as JSON.
     * @returns Saved object as JSON
     * @example
     * あとでやる
     * @todo はい
     */
    save(): string;
    /**
     * Poke the vue renderer.
     */
    pokeRenderer(): void;
    /**
     * Prepare GUI.
     * @param target DOM element where you want to attach the Automaton GUI
     */
    private __prepareGUI;
    /**
     * Assigned to `Automaton.auto` at constructor.
     * @param name name of the param
     * @returns Current value of the param
     */
    protected __auto(name: string): number;
}
