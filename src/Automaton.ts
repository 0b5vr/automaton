import { Clock } from './Clock';
import { ClockFrame } from './ClockFrame';
import { ClockRealtime } from './ClockRealtime';
import { EventEmitter } from 'eventemitter3';
import { FxDefinition } from './FxDefinition';
import { Param } from './Param';
import { SerializedData } from './types/SerializedData';
import { SerializedParam } from './types/SerializedParam';

/**
 * Interface for options of {@link Automaton}.
 */
export interface AutomatonOptions {
  /**
   * Whether let the time loop or not.
   */
  loop?: boolean;

  /**
   * If this is set, the clock will become frame mode.
   */
  fps?: number;

  /**
   * If this is true, the clock will become realtime mode.
   */
  realtime?: boolean;

  /**
   * Serialized data of the automaton.
   * **MUST BE PARSED JSON**
   */
  data?: SerializedData;
}

/**
 * IT'S AUTOMATON!
 * It's `automaton.nogui.js` version and also base class for {@link AutomatonWithGUI}.
 * @param options Options for this Automaton instance
 */
export class Automaton extends EventEmitter {
  /**
   * **THE MIGHTY `auto()` FUNCTION!! GRAB IT**
   * It creates a new param automatically if there are no param called `_name` (GUI mode only).
   * Otherwise it returns current value of the param called `_name`.
   * @param name name of the param
   * @returns Current value of the param
   */
  public auto = this.__auto.bind( this );

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
   * Whether the animation will be looped or not.
   */
  protected __isLoop: boolean;

  /**
   * Clock of the automaton.
   */
  protected __clock: Clock;

  /**
   * Params of the timeline.
   */
  protected __params: { [ name: string ]: Param } = {};

  /**
   * A list of fx definitions.
   */
  protected __fxDefs: { [ name: string ]: FxDefinition } = {};

  public constructor( options: AutomatonOptions ) {
    super();

    this.__isLoop = options.loop || false;

    this.__clock = (
      options.fps ? new ClockFrame( options.fps ) :
      options.realtime ? new ClockRealtime() :
      new Clock()
    );

    options.data && this.load( options.data );
  }

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
   * Current time. Same as `automaton.__clock.time`.
   */
  public get time(): number { return this.__clock.time; }

  /**
   * Delta of time between now and previous update call.
   */
  public get deltaTime(): number { return this.__clock.deltaTime; }

  /**
   * Current progress by whole length. Might NOT be [0-1] unless {@link AutomatonOptions#loop} is true.
   */
  public get progress(): number { return this.__clock.time / this.__length; }

  /**
   * Whether it's playing or not.
   */
  public get isPlaying(): boolean { return this.__clock.isPlaying; }

  /**
   * Current frame.
   * If the clock type is not frame mode, it will return `null` instead.
   */
  public get frame(): number | null {
    const frame = ( this.__clock as any ).frame as ( number | undefined );
    return frame || null;
  }

  /**
   * Frame per second.
   * If the clock type is not frame mode, it will return `null` instead.
   */
  public get fps(): number | null {
    const fps = ( this.__clock as any ).fps as ( number | undefined );
    return fps || null;
  }

  /**
   * Boolean that represents whether the clock is based on realtime or not.
   */
  public get isRealtime(): boolean {
    const isRealtime = ( this.__clock as any ).isRealtime as ( boolean | undefined );
    return isRealtime || false;
  }

  /**
   * Whether the animation will be looped or not.
   */
  public get isLoop(): boolean { return this.__isLoop; }

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
  public load( data: SerializedData ): void {
    this.__length = data.length;
    this.__resolution = data.resolution;

    for ( const name in data.params ) {
      this.createParam( name, data.params[ name ] );
    }
  }

  /**
   * Seek the timeline.
   * Can be performed via GUI.
   * @param time Time
   */
  public seek( time: number ): void {
    this.__clock.setTime( time );
    this.emit( 'seek' );
  }

  /**
   * Play the timeline.
   * @todo SHOULD be performed via GUI.
   */
  public play(): void {
    this.__clock.play();
    this.emit( 'play' );
  }

  /**
   * Pause the timeline.
   * @todo SHOULD be performed via GUI.
   */
  public pause(): void {
    this.__clock.pause();
    this.emit( 'pause' );
  }

  /**
   * Add a fx definition.
   * @param id Unique id for the Fx definition
   * @param fxDef Fx definition object
   */
  public addFxDefinition( id: string, fxDef: FxDefinition ): void {
    this.__fxDefs[ id ] = fxDef;

    this.precalcAll();
  }

  /**
   * Get a fx definition.
   * If it can't find the definition, it returns `null` instead.
   * @param id Unique id for the Fx definition
   */
  public getFxDefinition( id: string ): FxDefinition | null {
    return this.__fxDefs[ id ] || null;
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
   * @param time Current time, **Required if the clock mode is manual**
   */
  public update( time: number ): void {
    // update the clock
    this.__clock.update( time );

    // if loop is enabled, loop the time
    if ( this.__isLoop && ( this.time < 0 || this.length < this.time ) ) {
      this.__clock.setTime( this.time - Math.floor( this.time / this.length ) * this.length );
    }

    // grab current value for each param
    Object.values( this.__params ).forEach( ( param ) => param.getValue() );
  }

  /**
   * Assigned to {@link Automaton#auto} on its initialize phase.
   * @param name name of the param
   * @returns Current value of the param
   */
  protected __auto( name: string ): number {
    return this.__params[ name ].getValue();
  }
}
