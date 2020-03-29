import { Channel } from './Channel';
import { FxDefinition } from './types/FxDefinition';
import { SerializedChannel } from './types/SerializedChannel';
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
   * Channels of the timeline.
   */
  protected __channels: { [ name: string ]: Channel } = {};

  /**
   * A map of fx definitions.
   */
  protected __fxDefinitions: { [ name: string ]: FxDefinition } = {};

  /**
   * A map of listeners : channel names.
   */
  protected __listeners = new Map<( arg: any ) => void, string | string[]>();

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
   * Create a new channel.
   * @param name Name of the channel
   * @param data Data for the channel
   */
  public createChannel( name: string, data: SerializedChannel ): void {
    this.__channels[ name ] = new Channel( this, data );
  }

  /**
   * Load serialized automaton data.
   * @param data Serialized object contains automaton data.
   */
  public deserialize( data: SerializedData ): void {
    this.__length = data.length;
    this.__resolution = data.resolution;

    for ( const name in data.channels ) {
      this.createChannel( name, data.channels[ name ] );
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
   * Precalculate all channels.
   */
  public precalcAll(): void {
    Object.values( this.__channels ).forEach( ( ch ) => ch.precalc() );
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
    const namesOfUpdatedChannels = new Set<string>();
    for ( const [ name, ch ] of Object.entries( this.__channels ) ) {
      const isChanged = ch.update( this.__time );
      if ( isChanged ) {
        namesOfUpdatedChannels.add( name );
      }
    }

    for ( const [ listener, nameOrNames ] of this.__listeners.entries() ) {
      if ( Array.isArray( nameOrNames ) ) {
        const isIntersecting = nameOrNames.some( ( name ) => namesOfUpdatedChannels.has( name ) );
        if ( isIntersecting ) {
          const arg: { [ name: string ]: number } = {};
          nameOrNames.forEach( ( name ) => arg[ name ] = this.__channels[ name ].value );
          listener( arg );
        }
      } else {
        if ( namesOfUpdatedChannels.has( nameOrNames ) ) {
          listener( this.__channels[ nameOrNames ].value );
        }
      }
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
    listener?: ( value: number ) => void
  ): number;
  protected __auto(
    names: string[],
    listener?: ( values: { [ name: string ]: number } ) => void
  ): { [ name: string ]: number };
  protected __auto( ...args: any[] ): any {
    if ( Array.isArray( args[ 0 ] ) ) { // the first argument is string[]
      const names: string[] = args[ 0 ];
      const listener: ( ( values: { [ name: string ]: number } ) => void ) | undefined = args[ 1 ];

      const result: { [ name: string ]: number } = {};
      names.forEach( ( name ) => result[ name ] = this.__channels[ name ].value );

      if ( listener ) {
        this.__listeners.set( listener, names );
      }

      return result;

    } else { // the first argument is string
      const name: string = args[ 0 ];
      const listener: ( ( value: number ) => void ) | undefined = args[ 1 ];

      const result = this.__channels[ name ].value;

      if ( listener ) {
        this.__listeners.set( listener, name );
      }

      return result;
    }
  }
}
