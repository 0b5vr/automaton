import { Channel } from './Channel';
import { Curve } from './Curve';
import type { AutomatonOptions } from './types/AutomatonOptions';
import type { ChannelUpdateEvent } from './types/ChannelUpdateEvent';
import type { FxDefinition } from './types/FxDefinition';
import type { SerializedAutomaton } from './types/SerializedAutomaton';

/**
 * IT'S AUTOMATON!
 * @param data Serialized data of the automaton
 * @param options Options for this Automaton instance
 */
export class Automaton {
  /**
   * It returns the current value of the [[Channel]] called `name`.
   * If the `name` is an array, it returns a set of name : channel as an object instead.
   * You can also give a listener which will be executed when the channel changes its value (optional).
   * @param name The name of the channel
   * @param listener A function that will be executed when the channel changes its value
   * @returns Current value of the channel
   */
  public readonly auto = this.__auto.bind( this );

  /**
   * Curves of the automaton.
   */
  public readonly curves: Curve[] = [];

  /**
   * Channels of the timeline.
   */
  public readonly channels: Channel[] = [];

  /**
   * Map of channels, name vs. channel itself.
   */
  public readonly mapNameToChannel = new Map<string, Channel>();

  /**
   * Current time of the automaton.
   * Can be set by [[update]], be retrieved by [[get time]], be used by [[auto]]
   */
  protected __time: number = 0.0;

  /**
   * Version of the automaton.
   */
  protected __version: string = process.env.VERSION!;

  /**
   * Resolution of the timeline.
   */
  protected __resolution: number = 1000;

  /**
   * A map of fx definitions.
   */
  protected __fxDefinitions: { [ name: string ]: FxDefinition } = {};

  public constructor(
    data: SerializedAutomaton,
    options: AutomatonOptions = {}
  ) {
    options.fxDefinitions && this.addFxDefinitions( options.fxDefinitions );
    this.deserialize( data );
  }

  /**
   * Current time of the automaton, that is set via [[update]].
   */
  public get time(): number { return this.__time; }

  /**
   * Version of the automaton.
   */
  public get version(): string { return this.__version; }

  /**
   * Resolution = Sampling point per second.
   */
  public get resolution(): number { return this.__resolution; }

  /**
   * Load serialized automaton data.
   * @param data Serialized object contains automaton data.
   */
  public deserialize( data: SerializedAutomaton ): void {
    this.__resolution = data.resolution;

    this.curves.splice( 0 );
    this.curves.push(
      ...data.curves.map( ( data ) => new Curve( this, data ) )
    );

    this.mapNameToChannel.clear();

    this.channels.splice( 0 );
    this.channels.push(
      ...data.channels.map( ( [ name, data ] ) => {
        const channel = new Channel( this, data );

        if ( process.env.DEV ) {
          if ( this.mapNameToChannel.has( name ) ) {
            console.warn( `Duplicated channel: ${ name }` );
          }
        }

        this.mapNameToChannel.set( name, channel );
        return channel;
      } )
    );
  }

  /**
   * Add fx definitions.
   * @param fxDefinitions A map of id - fx definition
   */
  public addFxDefinitions( fxDefinitions: { [ id: string ]: FxDefinition } ): void {
    Object.entries( fxDefinitions ).forEach( ( [ id, fxDef ] ) => {
      if ( typeof fxDef.func === 'function' ) { // ignore unrelated entries
        if ( process.env.DEV ) {
          if ( this.__fxDefinitions[ id ] != null ) {
            console.warn( `Overwriting the existing fx definition: ${ id }` );
          }
        }

        this.__fxDefinitions[ id ] = fxDef;
      }
    } );

    this.precalcAll();
  }

  /**
   * Get a fx definition.
   * If it can't find the definition, it returns `null` instead.
   * @param id Unique id for the Fx definition
   */
  public getFxDefinition( id: string ): FxDefinition | null {
    return this.__fxDefinitions[ id ] || null;
  }

  /**
   * Get a curve.
   * @param index An index of the curve
   */
  public getCurve( index: number ): Curve | null {
    return this.curves[ index ] || null;
  }

  /**
   * Precalculate all curves.
   */
  public precalcAll(): void {
    Object.values( this.curves ).forEach( ( curve ) => curve.precalc() );
  }

  /**
   * Reset the internal states of channels.
   * **Call this method when you seek the time.**
   */
  public reset(): void {
    Object.values( this.channels ).forEach( ( channel ) => channel.reset() );
  }

  /**
   * Update the entire automaton.
   * **You may want to call this in your update loop.**
   * @param time Current time
   */
  public update( time: number ): void {
    const t = Math.max( time, 0.0 );

    // cache the time
    this.__time = t;

    // update channels
    const array = this.channels.map( ( channel ) => channel.consume( this.__time ) ).flat( 1 );
    array.sort( ( [ a ], [ b ] ) => a - b ).forEach( ( [ _, func ] ) => func() );
  }

  /**
   * Assigned to {@link Automaton#auto} on its initialize phase.
   * @param name The name of the channel
   * @param listener A function that will be executed when the channel changes its value
   * @returns Current value of the channel
   */
  protected __auto(
    name: string,
    listener?: ( event: ChannelUpdateEvent ) => void
  ): number {
    const channel = this.mapNameToChannel.get( name );

    if ( process.env.DEV ) {
      if ( !channel ) {
        throw new Error( `No such channel: ${ name }` );
      }
    }

    if ( listener ) {
      channel!.subscribe( listener );
    }

    return channel!.currentValue;
  }
}
