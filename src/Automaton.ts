import { Channel, ChannelUpdateEvent } from './Channel';
import { Curve } from './Curve';
import { FxDefinition } from './types/FxDefinition';
import { SerializedData } from './types/SerializedData';
import { clamp } from './utils/clamp';
import { mod } from './utils/mod';

/**
 * Interface for options of {@link Automaton}.
 */
export interface AutomatonOptions {
  /**
   * Whether let the time loop or not. `false` by default.
   */
  loop?: boolean;
}

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
   * Whether the animation will be looped or not.
   */
  public loop: boolean;

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
   * Length of the timeline.
   */
  protected __length: number = 1.0;

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

  public constructor( data: SerializedData, options: AutomatonOptions = {} ) {
    this.loop = options.loop || false;

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
   * Total length of animation in seconds.
   */
  public get length(): number { return this.__length; }

  /**
   * Resolution = Sampling point per second.
   */
  public get resolution(): number { return this.__resolution; }

  /**
   * Load serialized automaton data.
   * @param data Serialized object contains automaton data.
   */
  public deserialize( data: SerializedData ): void {
    this.__length = data.length;
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
  public getCurve( index: number ): Curve {
    return this.__curves[ index ];
  }

  /**
   * Precalculate all curves.
   */
  public precalcAll(): void {
    Object.values( this.__curves ).forEach( ( curve ) => curve.precalc() );
  }

  /**
   * Update the entire automaton.
   * **You may want to call this in your update loop.**
   * @param time Current time
   */
  public update( time: number ): void {
    const t = this.loop
      ? mod( time, this.__length ) // if loop is enabled, loop the time
      : clamp( time, 0.0, this.__length ); // if loop is disabled, clamp the time

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
    listener?: ( events: ChannelUpdateEvent ) => void
  ): number {
    if ( listener ) {
      this.__channels[ name ].subscribe( listener );
    }

    return this.__channels[ name ].value;
  }
}
