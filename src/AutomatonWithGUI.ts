import { Automaton, AutomatonOptions } from './Automaton';
import { FxDefinition, FxParam } from './FxDefinition';
import GUI from './vue/main.vue';
import { ParamWithGUI } from './ParamWithGUI';
import { SerializedData } from './types/SerializedData';
import { SerializedParam } from './types/SerializedParam';
import Vue from 'vue';
import { ass } from './ass';
import compat from './compat/compat';
import fxDefinitions from './fx-definitions';
import { jsonCopy } from './jsonCopy';

/**
 * History entry represents an operation on GUI.
 */
interface HistoryEntry {
  /**
   * Description of the operation.
   */
  description: string;

  /**
   * Operation.
   */
  doOperation: () => any;

  /**
   * Operation that undoes the {@link HistoryEntry#do}.
   */
  undoOperation: () => any;
}

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
export class AutomatonWithGUI extends Automaton {
  /**
   * Params of the timeline.
   */
  protected __params!: { [ name: string ]: ParamWithGUI };

  /**
   * GUI settings for this automaton.
   */
  public guiSettings: AutomatonGUISettings = {
    snapActive: false,
    snapTime: 0.1,
    snapValue: 0.1
  };

  /**
   * History stack.
   * Will be managed from {@link AutomatonWithGUI#pushHistory|pushHistory()}, navigated from {@link AutomatonWithGUI#undo|undo()} and {@link AutomatonWithGUI#redo|redo()}.
   */
  private __history: HistoryEntry[] = [];

  /**
   * Current position of history stack.
   */
  private __historyIndex: number = 0;

  /**
   * Vue instance that manages automaton gui.
   */
  private __vue?: Vue;

  public constructor( options: AutomatonWithGUIOptions ) {
    super( options );

    ass( !( options as any ).onseek, 'The handler "onseek" is no longer supported. Use Automaton.on( "seek", ... ) instead.' );
    ass( !( options as any ).onplay, 'The handler "onplay" is no longer supported. Use Automaton.on( "play", ... ) instead.' );
    ass( !( options as any ).onpause, 'The handler "onpause" is no longer supported. Use Automaton.on( "pause", ... ) instead.' );

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
   * Put some operation into the history stack.
   * Since it should accessible from GUI this function is public, it's basically `-- DON'T TOUCH IT KIDDO --`
   * @param desc Description of the operation
   * @param do Operation
   * @param undo Operation that undoes the `_do`
   * @param execute do will be executed instantly if true
   * @returns `any` if `_execute` is true, `void` otherwise
   */
  public pushHistory(
    description: string,
    doOperation: () => any,
    undoOperation: () => any,
    execute: boolean = false
  ): any {
    this.__history.splice( this.__historyIndex );
    this.__history.push( { description, doOperation, undoOperation } );
    this.__historyIndex ++;

    if ( execute ) {
      return doOperation();
    }
  }

  /**
   * Undo the operation based on history stack.
   * Can be performed via GUI.
   * @returns Result of _undo
   */
  public undo(): any {
    if ( this.__historyIndex <= 0 ) { return; }
    this.__historyIndex --;
    return this.__history[ this.__historyIndex ].undoOperation();
  }

  /**
   * Redo the operation based on history stack.
   * Can be performed via GUI.
   * @returns Result of _do
   */
  public redo(): any {
    if ( this.__history.length <= this.__historyIndex ) { return; }
    this.__historyIndex ++;
    return this.__history[ this.__historyIndex - 1 ].doOperation();
  }

  /**
   * Return description of latest operation.
   * If there are no operation before the current state, it will return empty string instead.
   * @returns Description of operation
   */
  public getUndoDesc(): string {
    return this.__history[ this.__historyIndex - 1 ]
      ? this.__history[ this.__historyIndex - 1 ].description
      : '';
  }

  /**
   * Return description of recently undo-ed operation.
   * If there are no operation after the current state, it will return empty string instead.
   * @returns Description of operation
   */
  public getRedoDesc(): string {
    return this.__history[ this.__historyIndex ]
      ? this.__history[ this.__historyIndex ].description
      : '';
  }

  /**
   * Drop all the history. YABAI.
   */
  public dropHistory(): void {
    this.__history.splice( 0 );
    this.__historyIndex = 0;
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

    // It's irreversible operation, sorry
    this.dropHistory();

    // Poke vue
    if ( this.__vue ) {
      this.__vue.$emit( 'changedLength' );
    }
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
    Vue.set( this.__params, name, param );
    return param;
  }

  /**
   * Remove a param.
   * @param name Name of param
   */
  public removeParam( name: string ): void {
    Vue.delete( this.__params, name );
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
  public load( data: SerializedData ): void {
    const convertedData = compat( data );
    super.load( convertedData );

    this.guiSettings = convertedData.guiSettings;

    // Poke vue
    if ( this.__vue ) {
      this.__vue.$emit( 'loaded' );
    }

    // Bye history
    if ( this.__history ) { // Automaton.constructor -> AutomatonWithGUI.load -> AutomatonWithGUI.dropHistory
      this.dropHistory();
    }
  }

  /**
   * Export current state as JSON.
   * @returns Saved object as JSON
   * @example
   * あとでやる
   * @todo はい
   */
  public save(): string {
    const ret: SerializedData = {
      v: this.version,
      length: this.length,
      resolution: this.resolution,
      params: {}, // will be filled later
      guiSettings: this.guiSettings
    };

    Object.keys( this.__params ).forEach( ( name ) => {
      const param = this.__params[ name ];
      ret.params[ name ] = {
        nodes: param.dumpNodesWithoutId(),
        fxs: param.dumpFxsWithoutId(),
      };
    } );

    return JSON.stringify( ret );
  }

  /**
   * Poke the vue renderer.
   */
  public pokeRenderer(): void {
    if ( this.__vue ) {
      this.__vue.$emit( 'poke' );
    }
  }

  /**
   * Prepare GUI.
   * @param target DOM element where you want to attach the Automaton GUI
   */
  private __prepareGUI( target: HTMLElement ): void {
    const el = document.createElement( 'div' );
    target.appendChild( el );

    this.__vue = new Vue( {
      el: el,
      data: {
        automaton: this
      },
      render: function( createElement ) {
        return createElement(
          GUI,
          { props: { automaton: this.automaton } }
        );
      }
    } );
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
