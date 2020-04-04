import { Automaton, FxDefinition, FxParam, SerializedChannel, SerializedCurve } from '@fms-cat/automaton';
import { GUISettings, defaultGUISettings } from './types/GUISettings';
import { SerializedAutomatonWithGUI, defaultDataWithGUI } from './types/SerializedAutomatonWithGUI';
import { App } from './view/components/App';
import { ChannelUpdateEvent } from '@fms-cat/automaton/types/Channel';
import { ChannelWithGUI } from './ChannelWithGUI';
import { CurveWithGUI } from './CurveWithGUI';
import { EventEmittable } from './mixins/EventEmittable';
import React from 'react';
import ReactDOM from 'react-dom';
import { Serializable } from './types/Serializable';
import { applyMixins } from './utils/applyMixins';
import { compat } from './compat/compat';
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
}

/**
 * IT'S AUTOMATON!
 */
export class AutomatonWithGUI extends Automaton
  implements Serializable<SerializedAutomatonWithGUI> {
  /**
   * GUI settings for this automaton.
   */
  public guiSettings: GUISettings = jsonCopy( defaultGUISettings );

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
   * Current position of history stack.
   */
  private __historyIndex: number = 0;

  /**
   * It's currently playing or not.
   */
  public get isPlaying(): boolean {
    return this.__isPlaying;
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

    fxDefinitions.map( ( fxDef: [ string, FxDefinition ] /* TODO */ ) => {
      this.addFxDefinition( ...fxDef );
    } );

    if ( options.gui ) { this.__prepareGUI( options.gui ); }

    window.addEventListener( 'beforeunload', ( event ) => {
      if ( this.__historyIndex !== 0 ) {
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
   * Add a fx definition.
   * @param id Unique id for the Fx definition
   * @param fxDef Fx definition object
   */
  public addFxDefinition( id: string, fxDef: FxDefinition ): void {
    super.addFxDefinition( id, fxDef );

    this.__emit( 'addFxDefinition', { name: id, fxDefinition: fxDef } );
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
   * Set the new length and resolution for this automaton instance.
   * **Some nodes / fxs might be automatically removed / changed.**
   * Can be performed via GUI.
   * @param length New length for the automaton
   */
  public setLength( length: number, resolution: number ): void {
    // if the length is invalid then throw error
    if ( isNaN( length ) ) {
      throw new Error( 'Automaton.setLength: length is invalid' );
    }

    // if the resolution is invalid then throw error
    if ( isNaN( length ) ) {
      throw new Error( 'Automaton.setLength: length is invalid' );
    }

    // if both length and resolution are not changed then do fast-return
    if ( length === this.length && resolution === this.resolution ) { return; }

    // set the length / resolution
    this.__length = length;
    this.__resolution = resolution;

    // changeLength is a good method
    Object.values( this.__channels ).forEach( ( channel ) => channel.changeLength() );

    // emit an event
    this.__emit( 'changeLength', { length, resolution } );

    // It's irreversible operation, sorry
    // this.dropHistory();

    // Poke vue 🔥
    // if ( this.__vue ) {
    //   this.__vue.$emit( 'changedLength' );
    // }
  }

  /**
   * Create a new channel.
   * @param name Name of channel
   * @returns Created channel
   */
  public createChannel( name: string, data?: SerializedChannel ): ChannelWithGUI {
    const channel = new ChannelWithGUI( this, data );
    this.__channels[ name ] = channel;
    this.__emit( 'createChannel', { name, channel: channel } );
    return channel;
  }

  /**
   * Remove a channel.
   * @param name Name of channel
   */
  public removeChannel( name: string ): void {
    delete this.__channels[ name ];
    this.__emit( 'removeChannel', { name } );
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
   * Return list of name of channels. Sorted.
   * @returns List of name of channels
   */
  public getChannelNames(): string[] {
    return Object.keys( this.__channels ).sort();
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
    return curve;
  }

  /**
   * Remove a curve.
   * @param index Index of the curve
   */
  public removeCurve( index: number ): void {
    delete this.__curves[ index ];
    this.__emit( 'removeCurve', { index } );
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
   * Load automaton state data.
   * @param data Object contains automaton data.
   */
  public deserialize( data?: any ): void {
    const convertedData = compat( data );

    this.__length = convertedData.length;
    this.__resolution = convertedData.resolution;

    this.__curves = convertedData.curves.map(
      ( data ) => this.createCurve( data )
    );

    for ( const name in convertedData.channels ) {
      this.__channels[ name ] = this.createChannel( name, convertedData.channels[ name ] );
    }

    this.guiSettings = convertedData.guiSettings;

    this.__emit( 'load' );
  }

  /**
   * Serialize its current state.
   * @returns Serialized state
   */
  public serialize(): SerializedAutomatonWithGUI {
    return {
      version: this.version,
      length: this.length,
      resolution: this.resolution,
      curves: this.__serializeCurves(),
      channels: this.__serializeChannelList(),
      guiSettings: this.guiSettings,
    };
  }

  /**
   * Poke the vue renderer.
   */
  public pokeRenderer(): void {
    // 🔥
    // if ( this.__vue ) {
    //   this.__vue.$emit( 'poke' );
    // }
  }

  /**
   * Set a property of gui settings.
   * @param key The parameter key you want to set
   * @param value The parameter value you want to set
   */
  public setGUISettings<T extends keyof GUISettings>( key: T, value: GUISettings[ T ] ): void {
    this.guiSettings = produce( this.guiSettings, ( newState ) => { // 🔥 Why????
      newState[ key ] = value;
    } );

    this.__emit( 'updateGUISettings', { settings: this.guiSettings } );
  }

  /**
   * Prepare GUI.
   * @param target DOM element where you want to attach the Automaton GUI
   */
  private __prepareGUI( target: HTMLElement ): void {
    ReactDOM.render(
      <App automaton={ this } />,
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

    return channel.value;
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
  addFxDefinition: { name: string; fxDefinition: FxDefinition };
  changeLength: { length: number; resolution: number };
  updateGUISettings: { settings: GUISettings };
}

export interface AutomatonWithGUI extends EventEmittable<AutomatonWithGUIEvents> {}
applyMixins( AutomatonWithGUI, [ EventEmittable ] );
