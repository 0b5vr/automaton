import { Automaton, ChannelUpdateEvent, FxDefinition, FxParam, SerializedChannel, SerializedCurve } from '@fms-cat/automaton';
import { GUIRemocon, ToastyParams } from './GUIRemocon';
import { GUISettings, defaultGUISettings } from './types/GUISettings';
import { SerializedAutomatonWithGUI, defaultDataWithGUI } from './types/SerializedAutomatonWithGUI';
import { App } from './view/components/App';
import { ChannelWithGUI } from './ChannelWithGUI';
import { ContextMenuCommand } from './view/states/ContextMenu';
import { CurveWithGUI } from './CurveWithGUI';
import { EventEmittable } from './mixins/EventEmittable';
import React from 'react';
import ReactDOM from 'react-dom';
import { Serializable } from './types/Serializable';
import { applyMixins } from './utils/applyMixins';
import { compat } from './compat/compat';
import { createStore } from './view/states/store';
import fxDefinitions from './fxs';
import { jsonCopy } from './utils/jsonCopy';
import produce from 'immer';

/**
 * Interface for options of {@link AutomatonWithGUI}.
 */
export interface AutomatonWithGUIOptions {
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

  /**
   * Install builtin fxs automatically.
   * You can install them manually instead by using {@link Automaton.BuiltinFxs}.
   */
  installBuiltinFxs?: boolean;
}

/**
 * IT'S AUTOMATON!
 */
export class AutomatonWithGUI extends Automaton
  implements Serializable<SerializedAutomatonWithGUI> {
  /**
   * Builtin fx definitions.
   * You can set {@link AutomatonWithGUIOptions.installBuiltinFxs} to `true` to install them automatically instead.
   */
  public static readonly BuiltinFxs = fxDefinitions;

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
   * Labels.
   */
  protected __labels: { [ name: string ]: number };

  /**
   * Version of the automaton.
   */
  protected __version: string = process.env.VERSION!;

  /**
   * Curves of the automaton.
   */
  protected __curves!: CurveWithGUI[];

  /**
   * Channels of the timeline.
   */
  protected __channels!: { [ name: string ]: ChannelWithGUI };

  /**
   * It's currently playing or not.
   */
  protected __isPlaying: boolean;

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
  private __guiSettings!: GUISettings;

  /**
   * This enables the Automaton instance to be able to communicate with GUI.
   */
  private __guiRemocon?: GUIRemocon;

  /**
   * A cache of previous {@link length}.
   * You should not touch this from any place but {@link tryUpdateLength}.
   */
  private __lengthPrev = 1.0;

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
    Object.values( this.__channels ).forEach( ( channel ) => {
      result = Math.max( result, channel.length );
    } );
    return result;
  }

  /**
   * A map of channels.
   */
  public get channels(): { [ name: string ]: ChannelWithGUI } {
    return this.__channels;
  }

  /**
   * Curves of the automaton.
   */
  public get curves(): CurveWithGUI[] {
    return this.__curves;
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
    super( data );

    this.__isPlaying = options.isPlaying || false;

    this.__labels = {};

    if ( options.installBuiltinFxs ) {
      this.addFxDefinitions( fxDefinitions );
    }

    this.overrideSave = options.overrideSave;
    this.saveContextMenuCommands = options.saveContextMenuCommands;
    this.__isDisabledChannelNotUsedWarning = options.disableChannelNotUsedWarning || false;

    // if `options.disableChannelNotUsedWarning` is true, mark every channels as used
    if ( this.__isDisabledChannelNotUsedWarning ) {
      Object.values( this.__channels ).forEach( ( channel ) => {
        channel.markAsUsed();
      } );
    }

    if ( options.gui ) {
      this.__guiRemocon = new GUIRemocon();
      this.__prepareGUI( options.gui );
    }

    window.addEventListener( 'beforeunload', ( event ) => {
      if ( this.shouldSave ) {
        const confirmationMessage = 'Automaton: Did you saved your progress?';
        event.returnValue = confirmationMessage;
        return confirmationMessage;
      }
    } );
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
    this.__emit( 'play' );
    this.__isPlaying = true;
  }

  /**
   * Emit the `pause` event.
   * **The function itself doesn't do the pause operation**, as Automaton doesn't have a clock.
   * Can be performed via GUI.
   */
  public pause(): void {
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
   * Update the entire automaton.
   * **You may want to call this in your update loop.**
   * @param time Current time
   */
  public update( time: number ): void {
    super.update( time );
    this.__emit( 'update', { time: this.time } );
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
    Object.keys( fxDef.params ).forEach( ( key ) => {
      ret[ key ] = fxDef.params[ key ].default;
    } );

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
  public createChannel( name: string, data?: SerializedChannel ): ChannelWithGUI {
    if ( this.__channels[ name ] ) {
      throw new Error( 'AutomatonWithGUI: A channel for the given name already exists' );
    }

    const channel = new ChannelWithGUI( this, data );
    this.__channels[ name ] = channel;

    // if `options.disableChannelNotUsedWarning` is true, mark the created channels as used
    if ( this.__isDisabledChannelNotUsedWarning ) {
      channel.markAsUsed();
    }

    channel.on( 'changeLength', () => {
      this.__tryUpdateLength();
    } );

    this.__emit( 'createChannel', { name, channel: channel } );

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
  public createOrOverwriteChannel( name: string, data?: SerializedChannel ): ChannelWithGUI {
    if ( this.__channels[ name ] ) {
      this.removeChannel( name );
    }

    const channel = new ChannelWithGUI( this, data );
    this.__channels[ name ] = channel;

    channel.on( 'changeLength', () => {
      this.__tryUpdateLength();
    } );

    this.__emit( 'createChannel', { name, channel: channel } );

    this.shouldSave = true;

    return channel;
  }

  /**
   * Remove a channel.
   * @param name Name of channel
   */
  public removeChannel( name: string ): void {
    delete this.__channels[ name ];

    this.__emit( 'removeChannel', { name } );

    this.shouldSave = true;
  }

  /**
   * Get a channel.
   * @param name Name of the channel
   * @returns The channel
   */
  public getChannel( name: string ): ChannelWithGUI | null {
    return this.__channels[ name ] || null;
  }

  /**
   * Create a new curve.
   * @returns Created channel
   */
  public createCurve( data?: SerializedCurve ): CurveWithGUI {
    const curve = new CurveWithGUI( this, data );
    const index = this.__curves.length;
    this.__curves.push( curve );

    this.__emit( 'createCurve', { index, curve } );

    this.shouldSave = true;

    return curve;
  }

  /**
   * Remove a curve.
   * @param index Index of the curve
   */
  public removeCurve( index: number ): void {
    this.__curves.splice( index, 1 );

    this.__emit( 'removeCurve', { index } );

    this.shouldSave = true;
  }

  /**
   * Get a curve.
   * @param index Index of the curve
   * @returns The curve
   */
  public getCurve( index: number ): CurveWithGUI | null {
    return this.__curves[ index ] || null;
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
    return Object.keys( this.__channels ).length;
  }

  /**
   * Return the index of a given curve.
   * return `-1` if it couldn't find the curve.
   * @param curve A curve you want to look up its index
   * @returns the index of the curve
   */
  public getCurveIndex( curve: CurveWithGUI ): number {
    return this.__curves.indexOf( curve );
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
   * @param data Object contains automaton data.
   */
  public deserialize( data?: any ): void {
    const convertedData = compat( data );

    this.__resolution = convertedData.resolution;

    this.__curves = convertedData.curves.map(
      ( data ) => new CurveWithGUI( this, data )
    );

    for ( const name in convertedData.channels ) {
      const channel = new ChannelWithGUI( this, convertedData.channels[ name ] );
      this.__channels[ name ] = channel;

      channel.on( 'changeLength', () => {
        this.__tryUpdateLength();
      } );
    }

    this.__labels = convertedData.labels;

    this.__guiSettings = convertedData.guiSettings ?? jsonCopy( defaultGUISettings );

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
      channels: this.__serializeChannelList(),
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

  /**
   * Prepare GUI.
   * @param target DOM element where you want to attach the Automaton GUI
   */
  private __prepareGUI( target: HTMLElement ): void {
    const store = createStore();

    ReactDOM.render(
      <App
        store={ store }
        automaton={ this }
        guiRemocon={ this.__guiRemocon! }
      />,
      target
    );
  }

  private __serializeCurves(): SerializedCurve[] {
    return this.__curves.map( ( curve ) => curve.serialize() );
  }

  private __serializeChannelList(): { [ name: string ]: SerializedChannel } {
    const data: { [ name: string ]: SerializedChannel } = {};
    Object.entries( this.__channels ).forEach( ( [ name, channel ] ) => {
      data[ name ] = channel.serialize();
    } );
    return data;
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
    let channel = this.__channels[ name ];
    if ( !channel ) { channel = this.createChannel( name ); }

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
  createChannel: { name: string; channel: ChannelWithGUI };
  removeChannel: { name: string };
  createCurve: { index: number; curve: CurveWithGUI };
  removeCurve: { index: number };
  addFxDefinitions: { fxDefinitions: { [ id: string ]: FxDefinition } };
  setLabel: { name: string; time: number };
  deleteLabel: { name: string };
  changeLength: { length: number };
  changeResolution: { resolution: number };
  updateGUISettings: { settings: GUISettings };
  changeShouldSave: { shouldSave: boolean };
}

export interface AutomatonWithGUI extends EventEmittable<AutomatonWithGUIEvents> {}
applyMixins( AutomatonWithGUI, [ EventEmittable ] );
