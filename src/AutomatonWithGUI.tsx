import { Automaton, AutomatonOptions, FxDefinition, FxParam, SerializedData, SerializedParam } from '@fms-cat/automaton';
import { GUISettings, WithGUISettings } from './types/GUISettings';
import { App } from './view/components/App';
import { EventEmittable } from './mixins/EventEmittable';
import { ParamWithGUI } from './ParamWithGUI';
import React from 'react';
import ReactDOM from 'react-dom';
import { Serializable } from './types/Serializable';
import { applyMixins } from './utils/applyMixins';
import { compat } from './compat/compat';
import fxDefinitions from './fxs';
import { jsonCopy } from './utils/jsonCopy';

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
 * IT'S AUTOMATON!
 * It's `automaton.js` and `automaton.min.js` version.
 * @param {Object} options Options for this Automaton instance
 */
export class AutomatonWithGUI extends Automaton
  implements Serializable<SerializedData & WithGUISettings> {
  /**
   * Version of the automaton.
   */
  protected __version: string = process.env.VERSION!;

  /**
   * Params of the timeline.
   */
  protected __params!: { [ name: string ]: ParamWithGUI };

  /**
   * GUI settings for this automaton.
   */
  public guiSettings: GUISettings = {
    snapActive: false,
    snapTime: 0.1,
    snapValue: 0.1
  };

  /**
   * Current position of history stack.
   */
  private __historyIndex: number = 0;

  public constructor( options: AutomatonWithGUIOptions ) {
    super( options as AutomatonOptions );

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
   * Seek the timeline.
   * Can be performed via GUI.
   * @param time Time
   */
  public seek( time: number ): void {
    super.seek( time );
    this.__emit( 'seek' );
  }

  /**
   * Play the timeline.
   * Can be performed via GUI.
   */
  public play(): void {
    super.play();
    this.__emit( 'play' );
  }

  /**
   * Pause the timeline.
   * Can be performed via GUI.
   */
  public pause(): void {
    super.pause();
    this.__emit( 'pause' );
  }

  /**
   * Update the entire automaton.
   * **You may want to call this in your update loop.**
   * @param time Current time, **Required if the clock mode is manual**
   */
  public update( time: number ): void {
    super.update( time );
    this.__emit( 'update' );
  }

  /**
   * Generate default fx params object.
   * @param id Id of the fx
   * @returns Default fx params object
   */
  public generateDefaultFxParams( id: string ): { [ key: string ]: any } {
    const fxDef = this.__fxDefs[ id ];
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
   * Set new length for this automaton instance.
   * **Some nodes / fxs might be automatically removed / changed.**
   * Can be performed via GUI.
   * @param length New length for the automaton
   */
  public setLength( length: number ): void {
    // if length is invalid then throw error
    if ( isNaN( length ) ) {
      throw new Error( 'Automaton.setLength: length is invalid' );
    }

    // if length is not changed then do fast-return
    if ( length === this.length ) { return; }

    // changeLength is a good method
    Object.values( this.__params ).forEach( ( param ) => param.changeLength( length ) );

    // finally set the length
    this.__length = length;

    // emit an event
    this.__emit( 'changeLength' );

    // It's irreversible operation, sorry
    // this.dropHistory();

    // Poke vue 🔥
    // if ( this.__vue ) {
    //   this.__vue.$emit( 'changedLength' );
    // }
  }

  /**
   * Set new resolution for this automaton instance.
   * @param resolultion New resolution for the automaton lul
   */
  public setResolution( resolultion: number ): void { // lul
    this.__resolution = resolultion; // lul
    this.precalcAll();
  }

  /**
   * Create a new param.
   * @param name Name of param
   * @returns Created param
   */
  public createParam( name: string, data?: SerializedParam ): ParamWithGUI {
    const param = new ParamWithGUI( this, data );
    // Vue.set( this.__params, name, param ); 🔥
    this.__params[ name ] = param;
    this.__emit( 'createParam', { name, param } );
    return param;
  }

  /**
   * Remove a param.
   * @param name Name of param
   */
  public removeParam( name: string ): void {
    // Vue.delete( this.__params, name ); 🔥
    delete this.__params[ name ];
    this.__emit( 'removeParam', { name } );
  }

  /**
   * Get a param.
   * @param name Name of the param
   * @returns Param object
   */
  public getParam( name: string ): ParamWithGUI | null {
    return this.__params[ name ] || null;
  }

  /**
   * Return list of name of params. Sorted.
   * @returns List of name of params
   */
  public getParamNames(): string[] {
    return Object.keys( this.__params ).sort();
  }

  /**
   * Return list of id of fx definitions. Sorted.
   * @returns List of id of fx definitions
   */
  public getFxDefinitionIds(): string[] {
    return Object.keys( this.__fxDefs ).sort();
  }

  /**
   * Return display name of a fx definition.
   * If it can't find the fx definition, it returns `null` instead.
   * @param id Id of the fx definition you want to grab
   * @returns Name of the fx definition
   */
  public getFxDefinitionName( id: string ): string | null {
    if ( this.__fxDefs[ id ] ) {
      return this.__fxDefs[ id ].name || id;
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
    if ( this.__fxDefs[ id ] ) {
      return this.__fxDefs[ id ].description || '';
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
    if ( this.__fxDefs[ id ] ) {
      return jsonCopy( this.__fxDefs[ id ].params || {} );
    } else {
      return null;
    }
  }

  /**
   * Return count of params.
   * @returns Count of params
   */
  public countParams(): number {
    return Object.keys( this.__params ).length;
  }

  /**
   * Load automaton state data.
   * @param data Object contains automaton data.
   */
  public deserialize( data?: any ): void {
    const convertedData = compat( data );
    super.deserialize( convertedData );

    this.guiSettings = convertedData.guiSettings;

    this.__emit( 'load' );

    // Poke vue 🔥
    // if ( this.__vue ) {
    //   this.__vue.$emit( 'loaded' );
    // }

    // Bye history
    // if ( this.__history ) { // Automaton.constructor -> AutomatonWithGUI.load -> AutomatonWithGUI.dropHistory
    //   this.dropHistory();
    // }
  }

  /**
   * Serialize its current state.
   * @returns Serialized state
   */
  public serialize(): SerializedData & WithGUISettings {
    return {
      version: this.version,
      length: this.length,
      resolution: this.resolution,
      params: this.__serializeParamList(),
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
   * Prepare GUI.
   * @param target DOM element where you want to attach the Automaton GUI
   */
  private __prepareGUI( target: HTMLElement ): void {
    ReactDOM.render(
      <App automaton={ this } />,
      target
    );
  }

  private __serializeParamList(): { [ name: string ]: SerializedParam } {
    return Object.keys( this.__params ).reduce(
      ( params, name ) => {
        params[ name ] = this.__params[ name ].serialize();
        return params;
      },
      {} as { [ name: string ]: SerializedParam }
    );
  }

  /**
   * Assigned to `Automaton.auto` at constructor.
   * @param name name of the param
   * @returns Current value of the param
   */
  protected __auto( name: string ): number {
    let param = this.__params[ name ];
    if ( !param ) { param = this.createParam( name ); }
    param.markAsUsed();
    return param.getValue();
  }
}

export interface AutomatonWithGUI extends EventEmittable<{
  play: void;
  pause: void;
  seek: void;
  load: void;
  update: void;
  createParam: { name: string; param: ParamWithGUI };
  removeParam: { name: string };
  changeLength: void;
}> {}
applyMixins( AutomatonWithGUI, [ EventEmittable ] );
