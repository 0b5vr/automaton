import { App } from './view/components/App';
import { Automaton, AutomatonOptions, ChannelUpdateEvent, FxDefinition, FxParam, SerializedAutomaton, SerializedChannel, SerializedCurve } from '@0b5vr/automaton';
import { BiMap } from './utils/BiMap';
import { ChannelWithGUI } from './ChannelWithGUI';
import { ContextMenuCommand } from './view/states/ContextMenu'; // 🔥🔥🔥🔥🔥🔥
import { CurveWithGUI } from './CurveWithGUI';
import { EventEmittable } from './mixins/EventEmittable';
import { GUIRemocon } from './GUIRemocon';
import { GUISettings, defaultGUISettings } from './types/GUISettings';
import { MinimizeOptions } from './types/MinimizeOptions';
import { ResumeStorage } from './ResumeStorage';
import { Serializable } from './types/Serializable';
import { SerializedAutomatonWithGUI, defaultDataWithGUI } from './types/SerializedAutomatonWithGUI';
import { ThrottledJSONStorage } from './ThrottledJSONStorage';
import { WithID } from './types/WithID';
import { applyMixins } from './utils/applyMixins';
import { compat } from './compat/compat';
import { createStore } from './view/states/store';
import { jsonCopy } from './utils/jsonCopy';
import { lofi } from './utils/lofi';
import { minimizeData } from './minimizeData';
import { reorderArray } from './utils/reorderArray';
import React from 'react';
import ReactDOM from 'react-dom';
import produce from 'immer';
import type { ToastyParams } from './types/ToastyParams';

/**
 * Interface for options of {@link AutomatonWithGUI}.
 */
export interface AutomatonWithGUIOptions extends AutomatonOptions {
  /**
   * DOM element where you want to attach the Automaton GUI.
   */
  gui?: HTMLElement;

  /**
   * Initial state of play / pause.
   *
   * @default false
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
export interface AutomatonWithGUI extends EventEmittable<AutomatonWithGUIEvents> {}
export class AutomatonWithGUI extends Automaton
  implements Serializable<SerializedAutomatonWithGUI> {
  /**
   * Minimize serialized data for prod use.
   * @param data The original data
   */
  public static minimizeData(
    data: SerializedAutomatonWithGUI,
    options: MinimizeOptions
  ): SerializedAutomaton {
    return minimizeData( data, options );
  }

  /**
   * Compat serialized data.
   * Use along with {@link deserialize}.
   * @param data The data
   */
  public static compat( data?: any ): SerializedAutomatonWithGUI {
    return compat( data );
  }

  /**
   * Overrided save procedure.
   * Originally intended to be used by automaton-electron.
   * Can also be specified via {@link AutomatonWithGUIOptions}.
   */
  public overrideSave?: () => void;

  /**
   * Define what to do with the context menu when you click the save icon on the header.
   * Originally intended to be used by automaton-electron.
   * Can also be specified via {@link AutomatonWithGUIOptions}.
   */
  public saveContextMenuCommands?: Array<ContextMenuCommand>;

  /**
   * Curves of the automaton.
   */
  public readonly curves!: CurveWithGUI[]; // is initialized in super constructor

  /**
   * Channels of the timeline.
   */
  public readonly channels!: ChannelWithGUI[]; // is initialized in super constructor

  /**
   * Map of channels, name vs. channel itself.
   */
  public readonly mapNameToChannel!: BiMap<string, ChannelWithGUI>; // is initialized as a Map in super constructor, will be converted to BiMap later in its constructor

  /**
   * Labels.
   */
  protected __labels!: { [ name: string ]: number }; // will be initialized @ deserialize

  /**
   * Version of the automaton.
   */
  protected __version: string = process.env.VERSION!;

  /**
   * It's currently playing or not.
   */
  protected __isPlaying: boolean;

  /**
   * A storage stores {@link resume} related values.
   *
   * If the resume feature is not used, it won't be set.
   */
  private __resumeStorage?: ThrottledJSONStorage<ResumeStorage>;

  /**
   * Whether it disables not used warning for channels or not.
   * Can be specified via {@link AutomatonWithGUIOptions}.
   */
  private __isDisabledChannelNotUsedWarning: boolean = false;

  /**
   * Whether it has any changes that is not saved yet or not.
   */
  private __shouldSave = false;

  /**
   * GUI settings for this automaton.
   */
  private __guiSettings!: GUISettings; // will be initialized @ deserialize

  /**
   * Mounted point of its GUI.
   */
  private __parentNode?: HTMLElement | null;

  /**
   * This enables the Automaton instance to be able to communicate with GUI.
   */
  private __guiRemocon?: GUIRemocon | null;

  /**
   * A cache of previous {@link length}.
   * You should not touch this from any place but {@link __tryUpdateLength}.
   */
  private __lengthPrev = 1.0;

  /**
   * Timeline will loop between these timepoints.
   */
  private __loopRegion: { begin: number; end: number } | null = null;
  public get loopRegion(): { begin: number; end: number } | null {
    return this.__loopRegion;
  }

  /**
   * It's currently playing or not.
   */
  public get isPlaying(): boolean {
    return this.__isPlaying;
  }

  /**
   * Length of the automaton i.e. the length of longest channel.
   */
  public get length(): number {
    let result = 0.0;
    this.channels.forEach( ( channel ) => {
      result = Math.max( result, channel.length );
    } );
    return result;
  }

  /**
   * Channel names, ordered.
   */
  public get channelNames(): string[] {
    return this.channels.map( ( channel ) => this.mapNameToChannel.getFromValue( channel )! );
  }

  /**
   * A map of fx definitions.
   */
  public get fxDefinitions(): { [ name: string ]: FxDefinition } {
    return this.__fxDefinitions;
  }

  /**
   * A map of labels.
   */
  public get labels(): { [ name: string ]: number } {
    return this.__labels;
  }

  /**
   * Whether it has any changes that is not saved yet or not.
   */
  public get shouldSave(): boolean {
    return this.__shouldSave;
  }

  /**
   * Whether it has any changes that is not saved yet or not.
   */
  public set shouldSave( shouldSave: boolean ) {
    this.__shouldSave = shouldSave;
    this.__emit( 'changeShouldSave', { shouldSave } );
  }

  /**
   * GUI settings for this automaton.
   */
  public get guiSettings(): GUISettings {
    return jsonCopy( this.__guiSettings );
  }

  /**
   * Create a new Automaton instance.
   * @param data Serialized data of the automaton
   * @param options Options for this Automaton instance
   */
  public constructor(
    data: SerializedAutomatonWithGUI = defaultDataWithGUI,
    options: AutomatonWithGUIOptions = {}
  ) {
    super( compat( data ), options );
    this.mapNameToChannel = new BiMap<string, ChannelWithGUI>( this.mapNameToChannel );

    this.__isPlaying = options.isPlaying ?? false;

    this.overrideSave = options.overrideSave;
    this.saveContextMenuCommands = options.saveContextMenuCommands;
    this.__isDisabledChannelNotUsedWarning = options.disableChannelNotUsedWarning ?? false;

    // if `options.disableChannelNotUsedWarning` is true, mark every channels as used
    if ( this.__isDisabledChannelNotUsedWarning ) {
      Object.values( this.channels ).forEach( ( channel ) => {
        channel.markAsUsed();
      } );
    }

    if ( options.gui ) {
      this.mountGUI( options.gui );
    }

    if ( typeof window !== 'undefined' ) {
      window.addEventListener( 'beforeunload', ( event ) => {
        if ( this.shouldSave ) {
          const confirmationMessage = 'Automaton: Did you save your progress?';
          event.returnValue = confirmationMessage;
          return confirmationMessage;
        }
      } );
    }
  }

  /**
   * Emit the `seek` event.
   * **The function itself doesn't do the seek operation**, as Automaton doesn't have a clock.
   * It will be performed via GUI.
   * @param time Time
   */
  public seek( time: number ): void {
    this.__emit( 'seek', { time } );
  }

  /**
   * Emit the `play` event.
   * **The function itself doesn't do the play operation**, as Automaton doesn't have a clock.
   * Can be performed via GUI.
   */
  public play(): void {
    this.__resumeStorage?.set( 'isPlaying', true );
    this.__emit( 'play' );
    this.__isPlaying = true;
  }

  /**
   * Emit the `pause` event.
   * **The function itself doesn't do the pause operation**, as Automaton doesn't have a clock.
   * Can be performed via GUI.
   */
  public pause(): void {
    this.__resumeStorage?.set( 'isPlaying', false );
    this.__emit( 'pause' );
    this.__isPlaying = false;
  }

  /**
   * Add fx definitions.
   * @param fxDefinitions A map of id - fx definition
   */
  public addFxDefinitions( fxDefinitions: { [ id: string ]: FxDefinition } ): void {
    super.addFxDefinitions( fxDefinitions );

    this.__emit( 'addFxDefinitions', { fxDefinitions } );
  }

  /**
   * Mark this channel as should be reset in next update call.
   * Almost same as {@link update}, but not instant.
   */
  public cueReset(): void {
    Object.values( this.channels ).map( ( channel ) => {
      channel.cueReset();
    } );
  }

  /**
   * Update the entire automaton.
   * **You may want to call this in your update loop.**
   * @param time Current time
   */
  public update( time: number ): void {
    super.update( time );

    this.__resumeStorage?.set( 'time', this.time );
    this.__emit( 'update', { time: this.time } );

    if ( this.__loopRegion ) {
      const { begin, end } = this.__loopRegion;

      if ( time < begin || end <= time ) {
        const newTime = time - begin - lofi( time - begin, end - begin ) + begin;
        this.seek( newTime );
      }
    }
  }

  /**
   * Generate default fx params object.
   * @param id Id of the fx
   * @returns Default fx params object
   */
  public generateDefaultFxParams( id: string ): { [ key: string ]: any } {
    const fxDef = this.__fxDefinitions[ id ];
    if ( !fxDef ) { throw new Error( `Fx definition called ${id} is not defined` ); }

    const ret: { [ key: string ]: any } = {};

    const params = fxDef.params;

    if ( params != null ) {
      Object.keys( params ).forEach( ( key ) => {
        ret[ key ] = params[ key ].default;
      } );
    }

    return ret;
  }

  /**
   * Toggle play / pause.
   */
  public togglePlay(): void {
    if ( this.isPlaying ) { this.pause(); }
    else { this.play(); }
  }

  /**
   * Change its resolution.
   * Can be performed via GUI.
   * @param resolution New resolution for the automaton
   */
  public setResolution( resolution: number ): void {
    // if the resolution is invalid then throw error
    if ( isNaN( resolution ) || resolution < 1 ) {
      throw new Error( 'Automaton.setResolution: resolution is invalid' );
    }

    // if both length and resolution are not changed then do fast-return
    if ( resolution === this.resolution ) { return; }

    // set the resolution
    this.__resolution = resolution;

    // update every curves
    this.precalcAll();

    // emit an event
    this.__emit( 'changeResolution', { resolution } );

    // mark as should save
    this.shouldSave = true;
  }

  /**
   * Create a new channel.
   * @param name Name of channel
   * @param data Serialized data of the channel
   * @returns Created channel
   */
  public createChannel( name: string, data?: SerializedChannel, index?: number ): ChannelWithGUI {
    if ( this.mapNameToChannel.has( name ) ) {
      throw new Error( 'AutomatonWithGUI: A channel for the given name already exists' );
    }

    const actualIndex = index ?? this.channels.length;

    const channel = new ChannelWithGUI( this, data );
    this.channels.splice( actualIndex, 0, channel );
    this.mapNameToChannel.set( name, channel );

    // if `options.disableChannelNotUsedWarning` is true, mark the created channels as used
    if ( this.__isDisabledChannelNotUsedWarning ) {
      channel.markAsUsed();
    }

    channel.on( 'changeLength', () => {
      this.__tryUpdateLength();
    } );

    this.__emit( 'createChannel', { name, channel, index: actualIndex } );

    this.shouldSave = true;

    return channel;
  }

  /**
   * Create a new channel, or overwrite the existing one.
   * Intended to be used by GUI.
   * @param name Name of channel
   * @param data Serialized data of the channel
   * @returns Created channel
   */
  public createOrOverwriteChannel(
    name: string,
    data?: SerializedChannel,
    index?: number
  ): ChannelWithGUI {
    let prevIndex: number | undefined;

    if ( this.mapNameToChannel.has( name ) ) {
      prevIndex = this.getChannelIndex( name );
      this.removeChannel( name );
    }

    return this.createChannel( name, data, index ?? prevIndex );
  }

  /**
   * Remove a channel.
   * @param name Name of channel
   */
  public removeChannel( name: string ): void {
    const channel = this.mapNameToChannel.get( name );

    if ( channel ) {
      this.channels.splice( this.channels.indexOf( channel ), 1 );
      this.mapNameToChannel.delete( name );

      this.__emit( 'removeChannel', { name } );

      this.shouldSave = true;
    }
  }

  /**
   * Get a channel.
   * @param name Name of the channel
   * @returns The channel
   */
  public getChannel( name: string ): ChannelWithGUI | null {
    return this.mapNameToChannel.get( name ) ?? null;
  }

  /**
   * Get a channel.
   * If the channel doesn't exist, create immediately.
   * @param name Name of the channel
   * @returns The channel
   */
  public getOrCreateChannel( name: string ): ChannelWithGUI {
    let channel = this.getChannel( name );

    if ( !channel ) { channel = this.createChannel( name ); }
    return channel;
  }

  /**
   * Get the index of a channel.
   * @param name Name of the channel
   * @returns The index of the channel
   */
  public getChannelIndex( name: string ): number {
    const channel = this.mapNameToChannel.get( name );

    if ( !channel ) {
      throw new Error( `getChannelIndex: A channel called ${ name } is not defined!` );
    }

    const index = this.channels.indexOf( channel );
    return index;
  }

  /**
   * Reorder channels.
   * @param name Name of the channel
   * @param isRelative Will interpret given index relatively if it's `true`
   * @returns A function to reorder channels. Give a new index
   */
  public reorderChannels(
    name: string,
    isRelative = false
  ): ( index: number ) => ChannelWithGUI[] {
    const index0 = this.getChannelIndex( name );

    return reorderArray(
      this.channels,
      index0,
      1,
      ( { index, length, newIndex } ) => {
        if ( isRelative ) {
          newIndex += index0;
        }

        this.__emit( 'reorderChannels', { index, length, newIndex } );

        return newIndex;
      }
    );
  }

  /**
   * Create a new curve.
   * @returns Created channel
   */
  public createCurve( data?: SerializedCurve & Partial<WithID> ): CurveWithGUI {
    const curve = new CurveWithGUI( this, data );
    this.curves.push( curve );

    this.__emit( 'createCurve', { id: curve.$id, curve } );

    this.shouldSave = true;

    return curve;
  }

  /**
   * Remove a curve.
   * @param index Index of the curve
   */
  public removeCurve( curveId: string ): void {
    const index = this.curves.findIndex( ( curve ) => curve.$id === curveId );
    if ( index === -1 ) { return; }

    const curve = this.curves[ index ];

    if ( curve.isUsed ) {
      const error = new Error( 'removeCurve: The curve is still used in somewhere!' );
      error.name = 'CurveUsedError';
      throw error;
    }

    const id = curve.$id;

    this.curves.splice( index, 1 );

    this.__emit( 'removeCurve', { id } );

    this.shouldSave = true;
  }

  /**
   * Get a curve.
   * @param index Index of the curve
   * @returns The curve
   */
  public getCurve( index: number ): CurveWithGUI | null {
    return this.curves[ index ] || null;
  }

  /**
   * Get a curve by id.
   * @param id Id of the curve
   * @returns The curve
   */
  public getCurveById( id: string ): CurveWithGUI {
    const index = this.getCurveIndexById( id );
    return this.curves[ index ];
  }

  /**
   * Search for a curve that has given id then return index of it.
   * If it couldn't find the curve, it will throw an error instead.
   * @param id Id of the curve you want to grab
   * @returns The index of the curve
   */
  public getCurveIndexById( id: string ): number {
    const index = this.curves.findIndex( ( curve ) => curve.$id === id );
    if ( index === -1 ) { throw new Error( `Searched for item id: ${id} but not found` ); }
    return index;
  }

  /**
   * Return list of id of fx definitions. Sorted.
   * @returns List of id of fx definitions
   */
  public getFxDefinitionIds(): string[] {
    return Object.keys( this.__fxDefinitions ).sort();
  }

  /**
   * Return display name of a fx definition.
   * If it can't find the fx definition, it returns `null` instead.
   * @param id Id of the fx definition you want to grab
   * @returns Name of the fx definition
   */
  public getFxDefinitionName( id: string ): string | null {
    if ( this.__fxDefinitions[ id ] ) {
      return this.__fxDefinitions[ id ].name || id;
    } else {
      return null;
    }
  }

  /**
   * Return description of a fx definition.
   * If it can't find the fx definition, it returns `null` instead.
   * @param id Id of the fx definition you want to grab
   * @returns Description of the fx definition
   */
  public getFxDefinitionDescription( id: string ): string | null {
    if ( this.__fxDefinitions[ id ] ) {
      return this.__fxDefinitions[ id ].description || '';
    } else {
      return null;
    }
  }

  /**
   * Return params section of a fx definition.
   * If it can't find the fx definition, it returns `null` instead.
   * @param id Id of the fx definition you want to grab
   * @returns Params section
   */
  public getFxDefinitionParams( id: string ): { [ key: string ]: FxParam } | null {
    if ( this.__fxDefinitions[ id ] ) {
      return jsonCopy( this.__fxDefinitions[ id ].params || {} );
    } else {
      return null;
    }
  }

  /**
   * Return count of channels.
   * @returns Count of channels
   */
  public countChannels(): number {
    return Object.keys( this.channels ).length;
  }

  /**
   * Return the index of a given curve.
   * return `-1` if it couldn't find the curve.
   * @param curve A curve you want to look up its index
   * @returns the index of the curve
   */
  public getCurveIndex( curve: CurveWithGUI ): number {
    return this.curves.indexOf( curve );
  }

  /**
   * Set a label.
   * @param name Name of the label
   * @param time Timepoint of the label
   */
  public setLabel( name: string, time: number ): void {
    const actualTime = Math.max( 0.0, time );

    this.__labels[ name ] = actualTime;

    this.__emit( 'setLabel', { name, time: actualTime } );
  }

  /**
   * Remove a label.
   * @param name Name of the label
   */
  public deleteLabel( name: string ): void {
    delete this.__labels[ name ];

    this.__emit( 'deleteLabel', { name } );
  }

  /**
   * Load automaton state data.
   * You might want to use {@link compat} beforehand to upgrade data made in previous versions.
   * @param data Object contains automaton data.
   */
  public deserialize( data: SerializedAutomatonWithGUI ): void {
    this.__resolution = data.resolution;

    this.curves.splice( 0 );
    this.curves.push(
      ...data.curves.map(
        ( curve ) => new CurveWithGUI( this, curve )
      ),
    );

    this.mapNameToChannel.clear();

    this.channels.splice( 0 );
    this.channels.push(
      ...data.channels.map( ( [ name, channelData ] ) => {
        const channel = new ChannelWithGUI( this, channelData );
        this.mapNameToChannel.set( name, channel );

        // if `options.disableChannelNotUsedWarning` is true, mark every channels as used
        if ( this.__isDisabledChannelNotUsedWarning ) {
          channel.markAsUsed();
        }

        channel.on( 'changeLength', () => {
          this.__tryUpdateLength();
        } );

        return channel;
      } )
    );

    this.__labels = data.labels ?? {};

    this.__guiSettings = {
      ...defaultGUISettings,
      ...data.guiSettings
    };

    this.__emit( 'load' );

    this.shouldSave = false;
  }

  /**
   * Serialize its current state.
   * @returns Serialized state
   */
  public serialize(): SerializedAutomatonWithGUI {
    return {
      version: this.version,
      resolution: this.resolution,
      curves: this.__serializeCurves(),
      channels: this.__serializeChannels(),
      labels: this.__labels,
      guiSettings: this.__guiSettings,
    };
  }

  /**
   * Set a property of gui settings.
   * @param key The parameter key you want to set
   * @param value The parameter value you want to set
   */
  public setGUISettings<T extends keyof GUISettings>( key: T, value: GUISettings[ T ] ): void {
    this.__guiSettings = produce( this.__guiSettings, ( newState ) => { // 🔥 Why????
      newState[ key ] = value;
    } );

    this.__emit( 'updateGUISettings', { settings: this.__guiSettings } );

    this.shouldSave = true;
  }

  /**
   * Mount a GUI to specified DOM.
   */
  public mountGUI( target: HTMLElement ): void {
    if ( this.__parentNode ) {
      throw Error( 'Automaton.mountGUI: GUI is already mounted!' );
    }

    this.__guiRemocon = new GUIRemocon();

    const store = createStore();

    ReactDOM.render(
      <App
        store={ store }
        automaton={ this }
        guiRemocon={ this.__guiRemocon! }
      />,
      target
    );

    this.__parentNode = target;
  }

  /**
   * Unmount a GUI.
   */
  public unmountGUI(): void {
    if ( !this.__parentNode ) {
      throw Error( 'Automaton.unmountGUI: GUI is not mounted!' );
    }

    ReactDOM.unmountComponentAtNode( this.__parentNode );
    this.__guiRemocon = null;
    this.__parentNode = null;
  }

  /**
   * Set a loop region.
   */
  public setLoopRegion( loopRegion: { begin: number; end: number } | null ): void {
    this.__loopRegion = loopRegion;
    this.__resumeStorage?.set( 'loopRegion', loopRegion );
    this.__emit( 'setLoopRegion', { loopRegion } );
  }

  /**
   * Try to resume a playback position from the last time it closed, using [Local Storage](https://developer.mozilla.org/ja/docs/Web/API/Window/localStorage).
   * Once the function is called, it starts to record the current playback position on the local storage.
   *
   * It also saves the "isPlaying" and the loop region. How generous!
   *
   * Make sure you subscribe to `play`, `pause`, and `seek` events before you call `resume()`.
   * otherwise it won't work properly.
   *
   * @param key A key that will be used for the local storage.
   * Set a unique value between projects, especially if you are constantly using `localhost:3000` for every project.
   * Uses `"automatonResume"` by default.
   */
  public resume( key?: string ): void {
    const storage = this.__resumeStorage = new ThrottledJSONStorage<ResumeStorage>(
      key ?? 'automatonResume',
      500,
    );

    const resumeIsPlaying = storage.get( 'isPlaying' );
    if ( resumeIsPlaying != null ) {
      if ( this.__isPlaying !== resumeIsPlaying ) {
        this.togglePlay();
      }
    }

    const resumeTime = storage.get( 'time' );
    if ( resumeTime != null ) {
      this.seek( resumeTime );
    }

    const resumeLoopRegion = storage.get( 'loopRegion' );
    if ( resumeLoopRegion != null ) {
      this.setLoopRegion( resumeLoopRegion );
    }
  }

  /**
   * Undo a step.
   * Intended to be used by automaton-electron.
   * You cannot call this function when you are not using GUI.
   */
  public undo(): void {
    if ( !this.__guiRemocon ) {
      throw new Error( 'Automaton: You cannot call `undo` when you are not using GUI!' );
    }

    this.__guiRemocon.undo();
  }

  /**
   * Redo a step.
   * Intended to be used by automaton-electron.
   * You cannot call this function when you are not using GUI.
   */
  public redo(): void {
    if ( !this.__guiRemocon ) {
      throw new Error( 'Automaton: You cannot call `redo` when you are not using GUI!' );
    }

    this.__guiRemocon.redo();
  }

  /**
   * Open an about screen.
   * Intended to be used by automaton-electron.
   * You cannot call this function when you are not using GUI.
   */
  public openAbout(): void {
    if ( !this.__guiRemocon ) {
      throw new Error( 'Automaton: You cannot call `openAbout` when you are not using GUI!' );
    }

    this.__guiRemocon.openAbout();
  }

  /**
   * Open a toasty notification.
   * Intended to be used by automaton-electron.
   * You cannot call this function when you are not using GUI.
   */
  public toasty( params: ToastyParams ): void {
    if ( !this.__guiRemocon ) {
      throw new Error( 'Automaton: You cannot call `toasty` when you are not using GUI!' );
    }

    this.__guiRemocon.toasty( params );
  }

  private __serializeCurves(): SerializedCurve[] {
    return this.curves.map( ( curve ) => curve.serialize() );
  }

  private __serializeChannels(): [ name: string, channel: SerializedChannel ][] {
    return this.channels.map( ( channel ) => [
      this.mapNameToChannel.getFromValue( channel )!,
      channel.serialize(),
    ] );
  }

  private __tryUpdateLength(): void {
    const length = this.length;
    if ( length !== this.__lengthPrev ) {
      this.__emit( 'changeLength', { length } );
      this.__lengthPrev = length;
    }
  }

  /**
   * Assigned to `Automaton.auto` at constructor.
   * @param name The name of the channel
   * @param listener A function that will be executed when the channel changes its value
   * @returns Current value of the channel
   */
  protected __auto(
    name: string,
    listener?: ( event: ChannelUpdateEvent ) => void
  ): number {
    const channel = this.getOrCreateChannel( name );

    if ( listener ) {
      channel.subscribe( listener );
    }

    channel.markAsUsed();

    return channel.currentValue;
  }
}

export interface AutomatonWithGUIEvents {
  play: void;
  pause: void;
  seek: { time: number };
  load: void;
  update: { time: number };
  createChannel: { name: string; channel: ChannelWithGUI; index: number };
  removeChannel: { name: string };
  reorderChannels: { index: number; length: number; newIndex: number };
  createCurve: { id: string; curve: CurveWithGUI };
  removeCurve: { id: string };
  addFxDefinitions: { fxDefinitions: { [ id: string ]: FxDefinition } };
  setLabel: { name: string; time: number };
  deleteLabel: { name: string };
  changeLength: { length: number };
  changeResolution: { resolution: number };
  updateGUISettings: { settings: GUISettings };
  changeShouldSave: { shouldSave: boolean };
  setLoopRegion: { loopRegion: { begin: number; end: number } | null };
}

applyMixins( AutomatonWithGUI, [ EventEmittable ] );
