import { Channel, ChannelUpdateEvent } from './Channel';
import { Curve } from './Curve';
import { FxDefinition } from './types/FxDefinition';
import { SerializedAutomaton } from './types/SerializedAutomaton';

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
  public auto = this.__auto.bind( this );

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
   * Curves of the automaton.
   */
  protected __curves: Curve[] = [];

  /**
   * Channels of the timeline.
   */
  protected __channels: { [ name: string ]: Channel } = {};

  /**
   * A map of fx definitions.
   */
  protected __fxDefinitions: { [ name: string ]: FxDefinition } = {};

  public constructor( data: SerializedAutomaton ) {
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

    this.__curves = data.curves.map( ( data ) => new Curve( this, data ) );

    for ( const name in data.channels ) {
      this.__channels[ name ] = new Channel( this, data.channels[ name ] );
    }
  }

  /**
   * Add a fx definition.
   * @param id Unique id for the Fx definition
   * @param fxDef Fx definition object
   */
  public addFxDefinition( id: string, fxDef: FxDefinition ): void {
    this.__fxDefinitions[ id ] = fxDef;

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
    return this.__curves[ index ] || null;
  }

  /**
   * Precalculate all curves.
   */
  public precalcAll(): void {
    Object.values( this.__curves ).forEach( ( curve ) => curve.precalc() );
  }

  /**
   * Reset the internal states of channels.
   * **Call this method when you seek the time.**
   */
  public reset(): void {
    Object.values( this.__channels ).forEach( ( channel ) => channel.reset() );
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

    // grab the current value for each channels
    for ( const channel of Object.values( this.__channels ) ) {
      channel.update( this.__time );
    }
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
    if ( listener ) {
      this.__channels[ name ].subscribe( listener );
    }

    return this.__channels[ name ].currentValue;
  }
}
