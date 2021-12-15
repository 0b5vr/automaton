import { Automaton, AutomatonOptions, ChannelUpdateEvent, FxDefinition, FxParam, SerializedAutomaton, SerializedChannel, SerializedCurve } from '@0b5vr/automaton';
import { BiMap } from './utils/BiMap';
import { ChannelWithGUI } from './ChannelWithGUI';
import { ContextMenuCommand } from './view/states/ContextMenu';
import { CurveWithGUI } from './CurveWithGUI';
import { EventEmittable } from './mixins/EventEmittable';
import { GUISettings } from './types/GUISettings';
import { MinimizeOptions } from './types/MinimizeOptions';
import { Serializable } from './types/Serializable';
import { SerializedAutomatonWithGUI } from './types/SerializedAutomatonWithGUI';
import { WithID } from './types/WithID';
import { ToastyParams } from './types/ToastyParams';
/**
 * Interface for options of {@link AutomatonWithGUI}.
 */
export interface AutomatonWithGUIOptions extends AutomatonOptions {
    /**
     * DOM element where you want to attach the Automaton GUI.
     */
    gui?: HTMLElement;
    /**
     * Initial state of play / pause. `false` by default.
     */
    isPlaying?: boolean;
    /**
     * Disable warnings for not used channels.
     * Intended to be used by automaton-electron.
     */
    disableChannelNotUsedWarning?: boolean;
    /**
     * Overrides the save procedure.
     * Originally intended to be used by automaton-electron.
     */
    overrideSave?: () => void;
    /**
     * Define what to do with the context menu when you click the save icon on the header.
     * Originally intended to be used by automaton-electron.
     */
    saveContextMenuCommands?: Array<ContextMenuCommand>;
}
/**
 * IT'S AUTOMATON!
 */
export interface AutomatonWithGUI extends EventEmittable<AutomatonWithGUIEvents> {
}
export declare class AutomatonWithGUI extends Automaton implements Serializable<SerializedAutomatonWithGUI> {
    /**
     * Minimize serialized data for prod use.
     * @param data The original data
     */
    static minimizeData(data: SerializedAutomatonWithGUI, options: MinimizeOptions): SerializedAutomaton;
    /**
     * Compat serialized data.
     * Use along with {@link deserialize}.
     * @param data The data
     */
    static compat(data?: any): SerializedAutomatonWithGUI;
    /**
     * Overrided save procedure.
     * Originally intended to be used by automaton-electron.
     * Can also be specified via {@link AutomatonWithGUIOptions}.
     */
    overrideSave?: () => void;
    /**
     * Define what to do with the context menu when you click the save icon on the header.
     * Originally intended to be used by automaton-electron.
     * Can also be specified via {@link AutomatonWithGUIOptions}.
     */
    saveContextMenuCommands?: Array<ContextMenuCommand>;
    /**
     * Curves of the automaton.
     */
    readonly curves: CurveWithGUI[];
    /**
     * Channels of the timeline.
     */
    readonly channels: ChannelWithGUI[];
    /**
     * Map of channels, name vs. channel itself.
     */
    readonly mapNameToChannel: BiMap<string, ChannelWithGUI>;
    /**
     * Labels.
     */
    protected __labels: {
        [name: string]: number;
    };
    /**
     * Version of the automaton.
     */
    protected __version: string;
    /**
     * It's currently playing or not.
     */
    protected __isPlaying: boolean;
    /**
     * Whether it disables not used warning for channels or not.
     * Can be specified via {@link AutomatonWithGUIOptions}.
     */
    private __isDisabledChannelNotUsedWarning;
    /**
     * Whether it has any changes that is not saved yet or not.
     */
    private __shouldSave;
    /**
     * GUI settings for this automaton.
     */
    private __guiSettings;
    /**
     * Mounted point of its GUI.
     */
    private __parentNode?;
    /**
     * This enables the Automaton instance to be able to communicate with GUI.
     */
    private __guiRemocon?;
    /**
     * A cache of previous {@link length}.
     * You should not touch this from any place but {@link __tryUpdateLength}.
     */
    private __lengthPrev;
    /**
     * Timeline will loop between these timepoints.
     */
    private __loopRegion;
    readonly loopRegion: {
        begin: number;
        end: number;
    } | null;
    /*
    * It's currently playing or not.
    */
    readonly isPlaying: boolean;
    /*
    * Length of the automaton i.e. the length of longest channel.
    */
    readonly length: number;
    /*
    * Channel names, ordered.
    */
    readonly channelNames: string[];
    /*
    * A map of fx definitions.
    */
    readonly fxDefinitions: {
        [name: string]: FxDefinition;
    };
    /*
    * A map of labels.
    */
    readonly labels: {
        [name: string]: number;
    };
    /*
    * Whether it has any changes that is not saved yet or not.
    
    
    * Whether it has any changes that is not saved yet or not.
    */
    shouldSave: boolean;
    /*
    * GUI settings for this automaton.
    */
    readonly guiSettings: GUISettings;
    /**
     * Create a new Automaton instance.
     * @param data Serialized data of the automaton
     * @param options Options for this Automaton instance
     */
    constructor(data?: SerializedAutomatonWithGUI, options?: AutomatonWithGUIOptions);
    /**
     * Emit the `seek` event.
     * **The function itself doesn't do the seek operation**, as Automaton doesn't have a clock.
     * It will be performed via GUI.
     * @param time Time
     */
    seek(time: number): void;
    /**
     * Emit the `play` event.
     * **The function itself doesn't do the play operation**, as Automaton doesn't have a clock.
     * Can be performed via GUI.
     */
    play(): void;
    /**
     * Emit the `pause` event.
     * **The function itself doesn't do the pause operation**, as Automaton doesn't have a clock.
     * Can be performed via GUI.
     */
    pause(): void;
    /**
     * Add fx definitions.
     * @param fxDefinitions A map of id - fx definition
     */
    addFxDefinitions(fxDefinitions: {
        [id: string]: FxDefinition;
    }): void;
    /**
     * Mark this channel as should be reset in next update call.
     * Almost same as {@link update}, but not instant.
     */
    cueReset(): void;
    /**
     * Update the entire automaton.
     * **You may want to call this in your update loop.**
     * @param time Current time
     */
    update(time: number): void;
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
     * Change its resolution.
     * Can be performed via GUI.
     * @param resolution New resolution for the automaton
     */
    setResolution(resolution: number): void;
    /**
     * Create a new channel.
     * @param name Name of channel
     * @param data Serialized data of the channel
     * @returns Created channel
     */
    createChannel(name: string, data?: SerializedChannel, index?: number): ChannelWithGUI;
    /**
     * Create a new channel, or overwrite the existing one.
     * Intended to be used by GUI.
     * @param name Name of channel
     * @param data Serialized data of the channel
     * @returns Created channel
     */
    createOrOverwriteChannel(name: string, data?: SerializedChannel, index?: number): ChannelWithGUI;
    /**
     * Remove a channel.
     * @param name Name of channel
     */
    removeChannel(name: string): void;
    /**
     * Get a channel.
     * @param name Name of the channel
     * @returns The channel
     */
    getChannel(name: string): ChannelWithGUI | null;
    /**
     * Get a channel.
     * If the channel doesn't exist, create immediately.
     * @param name Name of the channel
     * @returns The channel
     */
    getOrCreateChannel(name: string): ChannelWithGUI;
    /**
     * Get the index of a channel.
     * @param name Name of the channel
     * @returns The index of the channel
     */
    getChannelIndex(name: string): number;
    /**
     * Reorder channels.
     * @param name Name of the channel
     * @param isRelative Will interpret given index relatively if it's `true`
     * @returns A function to reorder channels. Give a new index
     */
    reorderChannels(name: string, isRelative?: boolean): (index: number) => ChannelWithGUI[];
    /**
     * Create a new curve.
     * @returns Created channel
     */
    createCurve(data?: SerializedCurve & Partial<WithID>): CurveWithGUI;
    /**
     * Remove a curve.
     * @param index Index of the curve
     */
    removeCurve(curveId: string): void;
    /**
     * Get a curve.
     * @param index Index of the curve
     * @returns The curve
     */
    getCurve(index: number): CurveWithGUI | null;
    /**
     * Get a curve by id.
     * @param id Id of the curve
     * @returns The curve
     */
    getCurveById(id: string): CurveWithGUI;
    /**
     * Search for a curve that has given id then return index of it.
     * If it couldn't find the curve, it will throw an error instead.
     * @param id Id of the curve you want to grab
     * @returns The index of the curve
     */
    getCurveIndexById(id: string): number;
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
     * Return count of channels.
     * @returns Count of channels
     */
    countChannels(): number;
    /**
     * Return the index of a given curve.
     * return `-1` if it couldn't find the curve.
     * @param curve A curve you want to look up its index
     * @returns the index of the curve
     */
    getCurveIndex(curve: CurveWithGUI): number;
    /**
     * Set a label.
     * @param name Name of the label
     * @param time Timepoint of the label
     */
    setLabel(name: string, time: number): void;
    /**
     * Remove a label.
     * @param name Name of the label
     */
    deleteLabel(name: string): void;
    /**
     * Load automaton state data.
     * You might want to use {@link compat} beforehand to upgrade data made in previous versions.
     * @param data Object contains automaton data.
     */
    deserialize(data: SerializedAutomatonWithGUI): void;
    /**
     * Serialize its current state.
     * @returns Serialized state
     */
    serialize(): SerializedAutomatonWithGUI;
    /**
     * Set a property of gui settings.
     * @param key The parameter key you want to set
     * @param value The parameter value you want to set
     */
    setGUISettings<T extends keyof GUISettings>(key: T, value: GUISettings[T]): void;
    /**
     * Mount a GUI to specified DOM.
     */
    mountGUI(target: HTMLElement): void;
    /**
     * Unmount a GUI.
     */
    unmountGUI(): void;
    /**
     * Set a loop region.
     */
    setLoopRegion(loopRegion: {
        begin: number;
        end: number;
    } | null): void;
    /**
     * Undo a step.
     * Intended to be used by automaton-electron.
     * You cannot call this function when you are not using GUI.
     */
    undo(): void;
    /**
     * Redo a step.
     * Intended to be used by automaton-electron.
     * You cannot call this function when you are not using GUI.
     */
    redo(): void;
    /**
     * Open an about screen.
     * Intended to be used by automaton-electron.
     * You cannot call this function when you are not using GUI.
     */
    openAbout(): void;
    /**
     * Open a toasty notification.
     * Intended to be used by automaton-electron.
     * You cannot call this function when you are not using GUI.
     */
    toasty(params: ToastyParams): void;
    private __serializeCurves;
    private __serializeChannels;
    private __tryUpdateLength;
    /**
     * Assigned to `Automaton.auto` at constructor.
     * @param name The name of the channel
     * @param listener A function that will be executed when the channel changes its value
     * @returns Current value of the channel
     */
    protected __auto(name: string, listener?: (event: ChannelUpdateEvent) => void): number;
}
export interface AutomatonWithGUIEvents {
    play: void;
    pause: void;
    seek: {
        time: number;
    };
    load: void;
    update: {
        time: number;
    };
    createChannel: {
        name: string;
        channel: ChannelWithGUI;
        index: number;
    };
    removeChannel: {
        name: string;
    };
    reorderChannels: {
        index: number;
        length: number;
        newIndex: number;
    };
    createCurve: {
        id: string;
        curve: CurveWithGUI;
    };
    removeCurve: {
        id: string;
    };
    addFxDefinitions: {
        fxDefinitions: {
            [id: string]: FxDefinition;
        };
    };
    setLabel: {
        name: string;
        time: number;
    };
    deleteLabel: {
        name: string;
    };
    changeLength: {
        length: number;
    };
    changeResolution: {
        resolution: number;
    };
    updateGUISettings: {
        settings: GUISettings;
    };
    changeShouldSave: {
        shouldSave: boolean;
    };
    setLoopRegion: {
        loopRegion: {
            begin: number;
            end: number;
        } | null;
    };
}
