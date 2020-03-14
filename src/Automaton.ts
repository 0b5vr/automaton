import { SerializedData, defaultData } from './types/SerializedData';
import { FxDefinition } from './types/FxDefinition';
import { Param } from './Param';
import { SerializedParam } from './types/SerializedParam';
import { mod } from './utils/mod';
import { clamp } from './utils/clamp';

/**
 * Interface for options of {@link Automaton}.
 */
export interface AutomatonOptions {
  /**
   * Whether let the time loop or not.
   */
  loop?: boolean;

  /**
   * Serialized data of the automaton.
   */
  data?: SerializedData;
}

/**
 * IT'S AUTOMATON!
 * It's `automaton.nogui.js` version and also base class for {@link AutomatonWithGUI}.
 * @param options Options for this Automaton instance
 */
export class Automaton {
  /**
   * **THE MIGHTY `auto()` FUNCTION!! GRAB IT**
   * It creates a new param automatically if there are no param called `name` (GUI mode only).
   * Otherwise it returns current value of the param called `name`.
   * @param name name of the param
   * @returns Current value of the param
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
   * Params of the timeline.
   */
  protected __params: { [ name: string ]: Param } = {};

  /**
   * A map of fx definitions.
   */
  protected __fxDefinitions: { [ name: string ]: FxDefinition } = {};

  public constructor( options: AutomatonOptions ) {
    this.loop = options.loop || false;

    this.deserialize( options.data || defaultData );
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
   * Create a new param.
   * @param name Name of the param
   * @param data Data for the param
   */
  public createParam( name: string, data: SerializedParam ): void {
    this.__params[ name ] = new Param( this, data );
  }

  /**
   * Load serialized automaton data.
   * @param data Serialized object contains automaton data.
   */
  public deserialize( data: SerializedData ): void {
    this.__length = data.length;
    this.__resolution = data.resolution;

    for ( const name in data.params ) {
      this.createParam( name, data.params[ name ] );
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
   * Precalculate all params.
   */
  public precalcAll(): void {
    Object.values( this.__params ).forEach( ( param ) => param.precalc() );
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

    // grab current value for each param
    Object.values( this.__params ).forEach( ( param ) => param.getValue( this.__time ) );
  }

  /**
   * Assigned to {@link Automaton#auto} on its initialize phase.
   * @param name name of the param
   * @returns Current value of the param
   */
  protected __auto( name: string ): number {
    return this.__params[ name ].getValue( this.__time );
  }
}
