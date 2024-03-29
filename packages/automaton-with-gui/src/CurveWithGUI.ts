import { AutomatonWithGUI } from './AutomatonWithGUI';
import { BezierNode, Curve, FxSection, SerializedBezierNode, SerializedCurve, SerializedFxSection } from '@0b5vr/automaton';
import { EventEmittable } from './mixins/EventEmittable';
import { SerializableWithID } from './types/SerializableWithID';
import { StatusLevel, WithStatus } from './types/Status';
import { Throttle } from './utils/Throttle';
import { WithBypass } from './types/WithBypass';
import { WithID } from './types/WithID';
import { applyMixins } from './utils/applyMixins';
import { clamp } from './utils/clamp';
import { genID } from './utils/genID';
import { hasOverwrap } from './utils/hasOverwrap';
import { jsonCopy } from './utils/jsonCopy';

/**
 * Handles of a new node will be created in this length.
 */
export const CURVE_DEFAULT_HANDLE_LENGTH = 0.1;

export const CURVE_FX_ROW_MAX = 5;

/**
 * Represents "Status code" of a status of the {@link Curve}.
 */
export enum CurveStatusCode {
  NOT_USED,
  NAN_DETECTED,
}

/**
 * It represents a channel of Automaton.
 * It has even more pretty APIs than raw {@link Curve} yay
 * @param automaton Parent automaton
 * @param data Data of the channel
 */
export interface CurveWithGUI extends SerializableWithID<SerializedCurve> {}
export interface CurveWithGUI extends EventEmittable<CurveWithGUIEvents> {}
export interface CurveWithGUI extends WithStatus<CurveStatusCode> {}
export class CurveWithGUI extends Curve {
  /**
   * Default data of a curve.
   */
  public static readonly DEFAULT_DATA: SerializedCurve = {
    nodes: [
      [ 0.0, 0.0, 0.0, 0.0, CURVE_DEFAULT_HANDLE_LENGTH, 0.0 ],
      [ 1.0, 0.0, -CURVE_DEFAULT_HANDLE_LENGTH, 0.0, 0.0, 0.0 ],
    ],
    fxs: []
  };

  /**
   * The parent automaton.
   */
  protected __automaton!: AutomatonWithGUI;

  /**
   * {@link __values} but without fxs.
   */
  protected __valuesWithoutFxs!: Float32Array;

  /**
   * List of bezier nodes.
   */
  protected __nodes!: Array<BezierNode & WithID>;

  /**
   * List of fx sections.
   */
  protected __fxs!: Array<FxSection & WithBypass & WithID>;

  /**
   * I'm crying
   */
  private __userCount: number = 0;

  /**
   * Limiting the emit of previewTime because it's too much
   */
  private __throttlePreviewTime: Throttle;

  /**
   * List of bezier nodes.
   */
  public get nodes(): Array<BezierNode & WithID> {
    return jsonCopy( this.__nodes );
  }

  /**
   * List of fx sections.
   */
  public get fxs(): Array<FxSection & WithBypass & WithID> {
    return jsonCopy( this.__fxs );
  }

  /**
   * Whether the curve is being used in somewhere or not.
   */
  public get isUsed(): boolean {
    return this.getSpecificStatus( CurveStatusCode.NOT_USED ) == null;
  }

  public constructor( automaton: AutomatonWithGUI, data?: SerializedCurve & Partial<WithID> ) {
    super( automaton, data || jsonCopy( CurveWithGUI.DEFAULT_DATA ) );

    this.$id = data?.$id ?? genID();

    this.__watchStatus( () => {
      this.__setStatus( {
        code: CurveStatusCode.NOT_USED,
        level: StatusLevel.WARNING,
        message: 'This curve has not been used yet'
      } );
    } );

    this.__throttlePreviewTime = new Throttle( 16 );
  }

  /**
   * Load a curve data.
   * @param data Data of curve
   */
  public deserialize( data: SerializedCurve ): void {
    data.fxs?.forEach( ( fx ) => {
      // fill missing params
      const defParams = this.__automaton.getFxDefinitionParams( fx.def );
      if ( defParams ) {
        const newParams: { [ key: string ]: any } = {};
        Object.entries( defParams ).forEach( ( [ key, value ] ) => {
          newParams[ key ] = fx.params[ key ] ?? value.default;
        } );
        fx.params = newParams;
      }
    } );

    super.deserialize( jsonCopy( data ) );

    this.__nodes.forEach( ( node ) => {
      node.$id = genID();
    } );

    this.__fxs.forEach( ( fxs ) => {
      fxs.$id = genID();
    } );
  }

  /**
   * Precalculate value of samples.
   */
  public precalc(): void {
    const valuesLength = Math.ceil( this.__automaton.resolution * this.length ) + 1;
    this.__values = new Float32Array( valuesLength );
    this.__valuesWithoutFxs = new Float32Array( valuesLength );
    this.__shouldNotInterpolate = new Uint8Array( valuesLength );

    this.__generateCurve();
    this.__valuesWithoutFxs.set( this.__values );

    this.__applyFxs();

    let hasNaN = false;
    this.__values.forEach( ( v, i ) => {
      if ( isNaN( v ) ) {
        this.__values[ i ] = 0.0;
        hasNaN = true;
      }
    } );

    this.__watchStatus( () => {
      if ( hasNaN ) {
        this.__setStatus( {
          code: CurveStatusCode.NAN_DETECTED,
          level: StatusLevel.ERROR,
          message: 'This curve has NaN value'
        } );
      } else {
        this.__deleteStatus( CurveStatusCode.NAN_DETECTED );
      }
    } );

    this.__emit( 'precalc' );
  }

  /**
   * Update the preview time.
   * Do not call this function if you're not a [[ChannelItemCurveWithGUI]].
   * @param time Time
   * @param value Value
   */
  public emitPreviewTime( event: CurveWithGUIEvents[ 'previewTime' ] ): void {
    this.__throttlePreviewTime.do( () => this.__emit( 'previewTime', event ) );
  }

  /**
   * I'm crying
   * Intended to be used in {@link ChannelWithGUI} via {@link ChannelItemWithGUI#curve}.
   */
  public incrementUserCount(): void {
    this.__userCount ++;

    if ( this.__userCount === 1 ) {
      this.__watchStatus( () => {
        this.__deleteStatus( CurveStatusCode.NOT_USED );
      } );
    }
  }

  /**
   * I'm crying
   * Intended to be used in {@link ChannelWithGUI} via {@link ChannelItemWithGUI#curve}.
   */
  public decrementUserCount(): void {
    this.__userCount --;

    if ( this.__userCount === 0 ) {
      this.__watchStatus( () => {
        this.__setStatus( {
          code: CurveStatusCode.NOT_USED,
          level: StatusLevel.WARNING,
          message: 'This curve is not used'
        } );
      } );
    }
  }

  /**
   * Return how many node the curve currently have.
   * @returns Nodes count
   */
  public getNumNode(): number {
    return this.__nodes.length;
  }

  /**
   * Serialize its current state.
   * @returns Serialized state
   */
  public serialize(): SerializedCurve {
    return {
      nodes: this.__serializeNodes(),
      fxs: this.__serializeFxs()
    }; // 🔥
  }

  /**
   * Get the nth node.
   * @param index Index of the node
   * @returns Data of the node
   */
  public getNodeByIndex( index: number ): BezierNode & WithID {
    const node = this.__nodes[ index ];
    if ( !node ) {
      throw new Error( `Given node index ${index} is invalid (Current count of nodes: ${this.__nodes.length})` );
    }
    return jsonCopy( node );
  }

  /**
   * Dump data of a node.
   * @param id Id of the node you want to dump
   * @returns Data of the node
   */
  public getNode( id: string ): BezierNode & WithID {
    const index = this.__getNodeIndexById( id );
    return jsonCopy( this.__nodes[ index ] );
  }

  /**
   * Dump data of a previous node from a specified node.
   * It might return `null` when the specified node is the first node.
   * @param id Id of the node you want to refer
   * @returns Data of the previous node
   */
  public getPreviousNode( id: string ): ( BezierNode & WithID ) | null {
    const index = this.__getNodeIndexById( id );
    if ( index === 0 ) { return null; }
    return jsonCopy( this.__nodes[ index - 1 ] );
  }

  /**
   * Dump data of a next node from a specified node.
   * It might return `null` when the specified node is the last node.
   * @param id Id of the node you want to refer
   * @returns Data of the next node
   */
  public getNextNode( id: string ): ( BezierNode & WithID ) | null {
    const index = this.__getNodeIndexById( id );
    if ( index === this.__nodes.length - 1 ) { return null; }
    return jsonCopy( this.__nodes[ index + 1 ] );
  }

  /**
   * Create a node.
   * @param time Time of new node
   * @param value Value of new node
   * @returns Data of the node
   */
  public createNode( time: number, value: number ): BezierNode & WithID {
    const id = genID();
    const data = {
      time,
      value,
      inTime: 0.0,
      inValue: 0.0,
      outTime: 0.0,
      outValue: 0.0,
      $id: id,
    };
    this.__nodes.push( data );
    this.__sortNodes();

    // if there are handles in previous or next node, make a handle
    {
      const prev = this.getPreviousNode( id );
      const prevHasHandle = prev == null || prev.outTime !== 0.0 || prev.outValue !== 0.0;
      const next = this.getNextNode( id );
      const nextHasHandle = next == null || next.inTime !== 0.0 || next.inValue !== 0.0;

      if ( prevHasHandle || nextHasHandle ) {
        data.inTime = -CURVE_DEFAULT_HANDLE_LENGTH;
        data.outTime = CURVE_DEFAULT_HANDLE_LENGTH;
      }
    }

    this.precalc();

    this.__emit( 'createNode', { id, node: jsonCopy( data ) } );

    // if we added the last node, change the length
    if ( this.isLastNode( id ) ) {
      this.__emit( 'changeLength', { length: this.length } );
    }

    this.__automaton.shouldSave = true;

    return jsonCopy( data );
  }

  /**
   * Create a node from dumped data.
   * @param node Dumped bezier node object
   * @returns Data of the node
   */
  public createNodeFromData( node: BezierNode & WithID ): BezierNode & WithID {
    const data = jsonCopy( node );
    this.__nodes.push( data );
    this.__sortNodes();

    this.precalc();

    this.__emit( 'createNode', { id: node.$id, node: jsonCopy( data ) } );

    // if we added the last node, change the length
    if ( this.isLastNode( node.$id ) ) {
      this.__emit( 'changeLength', { length: this.length } );
    }

    this.__automaton.shouldSave = true;

    return jsonCopy( data );
  }

  /**
   * Check whether the node is the first node or not.
   * @param id Id of the node you want to check
   */
  public isFirstNode( id: string ): boolean {
    const index = this.__getNodeIndexById( id );
    return index === 0;
  }

  /**
   * Check whether the node is the last node or not.
   * @param id Id of the node you want to check
   */
  public isLastNode( id: string ): boolean {
    const index = this.__getNodeIndexById( id );
    return index === this.__nodes.length - 1;
  }

  /**
   * Remove a node.
   * @param id Id of the node you want to remove
   */
  public removeNode( id: string ): void {
    const index = this.__getNodeIndexById( id );

    // we can't delete the first node
    if ( index === 0 ) {
      return;
    }

    const isLastNode = this.isLastNode( id );
    this.__nodes.splice( index, 1 );

    this.precalc();

    this.__emit( 'removeNode', { id } );

    // if we delete the last node, change the length
    if ( isLastNode ) {
      this.__emit( 'changeLength', { length: this.length } );
    }

    this.__automaton.shouldSave = true;
  }

  /**
   * Move a node in the time axis.
   * @param id Id of the node you want to move
   * @param time Time
   */
  public moveNodeTime( id: string, time: number ): void {
    const index = this.__getNodeIndexById( id );

    const node = this.__nodes[ index ];

    let newTime = time;
    if ( index === 0 ) {
      newTime = 0;
    } else {
      newTime = Math.max( newTime, this.__nodes[ index - 1 ].time );

      if ( index !== this.__nodes.length - 1 ) {
        newTime = Math.min( newTime, this.__nodes[ index + 1 ].time );
      }
    }
    node.time = newTime;

    this.precalc();

    this.__emit( 'updateNode', { id, node: jsonCopy( node ) } );

    // if we moved the last node, change the length
    if ( this.isLastNode( id ) ) {
      this.__emit( 'changeLength', { length: this.length } );
    }

    this.__automaton.shouldSave = true;
  }

  /**
   * Move a node in the value axis.
   * @param id Id of the node you want to move
   * @param value Value
   */
  public moveNodeValue( id: string, value: number ): void {
    const index = this.__getNodeIndexById( id );

    const node = this.__nodes[ index ];

    node.value = value;

    this.precalc();

    this.__emit( 'updateNode', { id, node: jsonCopy( node ) } );

    this.__automaton.shouldSave = true;
  }

  /**
   * Move a handle of a node in the time axis.
   * @param id Id of the node you want to operate
   * @param dir Which handle?
   * @param time Time
   */
  public moveHandleTime( id: string, dir: 'in' | 'out', time: number ): void {
    const index = this.__getNodeIndexById( id );

    if ( index === 0 && dir === 'in' ) { return; }

    const node = this.__nodes[ index ];

    const newTime = ( dir === 'in' ) ? Math.min( 0.0, time ) : Math.max( 0.0, time );

    node[ dir === 'in' ? 'inTime' : 'outTime' ] = newTime;

    this.precalc();

    this.__emit( 'updateNode', { id, node: jsonCopy( node ) } );

    this.__automaton.shouldSave = true;
  }

  /**
   * Move a handle of a node in the value axis.
   * @param id Id of the node you want to operate
   * @param dir Which handle?
   * @param value Value
   */
  public moveHandleValue( id: string, dir: 'in' | 'out', value: number ): void {
    const index = this.__getNodeIndexById( id );

    if ( index === 0 && dir === 'in' ) { return; }

    const node = this.__nodes[ index ];

    node[ dir === 'in' ? 'inValue' : 'outValue' ] = value;

    this.precalc();

    this.__emit( 'updateNode', { id, node: jsonCopy( node ) } );

    this.__automaton.shouldSave = true;
  }

  /**
   * Reset a handle of a node.
   * @param id Id of the node you want to operate
   * @param dir Which handle?
   */
  public resetHandle( id: string, dir: 'in' | 'out' ): void {
    const index = this.__getNodeIndexById( id );

    if ( index === 0 && dir === 'in' ) { return; }

    const node = this.__nodes[ index ];
    node[ dir === 'in' ? 'inTime' : 'outTime' ] = ( ( dir === 'in' ) ? -1.0 : 1.0 ) * CURVE_DEFAULT_HANDLE_LENGTH;
    node[ dir === 'in' ? 'inValue' : 'outValue' ] = 0.0;

    this.precalc();

    this.__emit( 'updateNode', { id, node: jsonCopy( node ) } );

    this.__automaton.shouldSave = true;
  }

  /**
   * Get the nth fx section.
   * @param index Index of the fx section
   * @returns Data of the fx section
   */
  public getFxByIndex( index: number ): FxSection & WithBypass & WithID {
    const fx = this.__fxs[ index ];
    if ( !fx ) {
      throw new Error( `Given fx section index ${index} is invalid (Current count of fx sections: ${this.__fxs.length})` );
    }
    return jsonCopy( fx );
  }

  /**
   * Dump data of a fx section.
   * @param id Id of a fx section you want to dump
   * @returns Data of the fx
   */
  public getFx( id: string ): FxSection & WithBypass & WithID {
    const index = this.__getFxIndexById( id );
    return jsonCopy( this.__fxs[ index ] );
  }

  /**
   * Create a fx.
   * If it couldn't create an fx, it will return `null` instead.
   * @param time Beginning time of new fx
   * @param length Length of new fx
   * @param def Definition id (kind) of new fx
   * @returns Id of the new fx
   */
  public createFx(
    time: number,
    length: number,
    def: string
  ): ( FxSection & WithBypass & WithID ) | null {
    const row = this.__getFreeRow( time, length );
    if ( CURVE_FX_ROW_MAX <= row ) {
      console.error( 'Too many fx stacks at here!' );
      return null;
    }

    const id = genID();
    const data: FxSection & WithBypass & WithID = {
      $id: id,
      time: time,
      length: length,
      row: row,
      def: def,
      params: this.__automaton.generateDefaultFxParams( def ),
      bypass: false
    };
    this.__fxs.push( data );
    this.__sortFxs();

    this.precalc();

    this.__emit( 'createFx', { id, fx: jsonCopy( data ) } );

    this.__automaton.shouldSave = true;

    return jsonCopy( data );
  }

  /**
   * Create a fx from dumped data.
   * If it couldn't create an fx, it will return empty string instead.
   * @param fx Dumped fx data
   * @returns Id of the new fx
   */
  public createFxFromData(
    fx: FxSection & WithBypass & WithID
  ): ( FxSection & WithBypass & WithID ) | null {
    const row = this.__getFreeRow( fx.time, fx.length, fx.row );
    if ( CURVE_FX_ROW_MAX <= row ) {
      console.error( 'Too many fx stacks at here!' );
      return null;
    }

    const data = jsonCopy( fx );
    data.row = row;
    this.__fxs.push( data );
    this.__sortFxs();

    this.precalc();

    this.__emit( 'createFx', { id: data.$id, fx: jsonCopy( data ) } );

    this.__automaton.shouldSave = true;

    return jsonCopy( data );
  }

  /**
   * Remove a fx.
   * @param id Id of the fx you want to remove
   */
  public removeFx( id: string ): void {
    const index = this.__getFxIndexById( id );

    this.__fxs.splice( index, 1 );

    this.precalc();

    this.__emit( 'removeFx', { id } );

    this.__automaton.shouldSave = true;
  }

  /**
   * Move a fx.
   * @param id Id of the fx you want to move
   * @param time Beginning time
   */
  public moveFx( id: string, time: number ): void {
    const index = this.__getFxIndexById( id );

    const fx = this.__fxs[ index ];

    const sameRow = this.__fxs.filter( ( fxOp ) => fxOp.row === fx.row );
    const indexInRow = sameRow.indexOf( fx );
    const prev = sameRow[ indexInRow - 1 ];
    const left = prev ? ( prev.time + prev.length ) : 0.0;
    const next = sameRow[ indexInRow + 1 ];
    const right = next ? next.time : Infinity;
    fx.time = clamp( time, left, right - fx.length );

    this.precalc();

    this.__emit( 'updateFx', { id, fx: jsonCopy( fx ) } );

    this.__automaton.shouldSave = true;
  }

  /**
   * Change row of a fx.
   * @param id Id of the fx you want to move
   * @param row Row
   */
  public changeFxRow( id: string, row: number ): void {
    const index = this.__getFxIndexById( id );

    if ( row < 0 || CURVE_FX_ROW_MAX <= row ) {
      throw new Error( `Row number ${row} is invalid` );
    }

    const fx = this.__fxs[ index ];
    if ( fx.row === row ) { return; }

    const sameRow = this.__fxs.filter( ( fxOp ) => fxOp.row === row );
    const isValid = sameRow.every( ( fxOp ) =>
      !hasOverwrap( fx.time, fx.length, fxOp.time, fxOp.length ) );

    if ( !isValid ) { return; }

    fx.row = row;
    this.__sortFxs();

    this.precalc();

    this.__emit( 'updateFx', { id, fx: jsonCopy( fx ) } );

    this.__automaton.shouldSave = true;
  }

  /**
   * Bypass or unbypass a fx.
   * @param id Id of the fx you want to change
   * @param bypass If true, fx will be bypassed
   */
  public bypassFx( id: string, bypass: boolean ): void {
    const index = this.__getFxIndexById( id );

    const fx = this.__fxs[ index ];
    fx.bypass = bypass;

    this.precalc();

    this.__emit( 'updateFx', { id, fx: jsonCopy( fx ) } );

    this.__automaton.shouldSave = true;
  }

  /**
   * Change a param of a fx.
   * @param id Id of the fx you want to change
   * @param name Name of the param you want to change
   * @param value Your desired value
   */
  public changeFxParam( id: string, name: string, value: any ): void {
    const index = this.__getFxIndexById( id );

    const fx = this.__fxs[ index ];
    const params = this.__automaton.getFxDefinitionParams( fx.def )!;

    let newValue = value;
    if ( params[ name ].min !== undefined ) {
      newValue = Math.max( params[ name ].min!, newValue );
    }
    if ( params[ name ].max !== undefined ) {
      newValue = Math.min( params[ name ].max!, newValue );
    }
    fx.params[ name ] = newValue;

    this.precalc();

    this.__emit( 'updateFx', { id, fx: jsonCopy( fx ) } );

    this.__automaton.shouldSave = true;
  }

  /**
   * Move a fx --force.
   * Best for undo-redo operation. probably.
   * @param id Id of the fx you want to move
   * @param time Beginning time
   * @param row Row
   */
  public forceMoveFx( id: string, time: number, row: number ): void {
    const index = this.__getFxIndexById( id );

    const fx = this.__fxs[ index ];

    fx.time = time;
    fx.row = row;
    this.__sortFxs();

    this.precalc();

    this.__emit( 'updateFx', { id, fx: jsonCopy( fx ) } );

    this.__automaton.shouldSave = true;
  }

  /**
   * Resize a fx.
   * @param id Index of the fx you want to resize
   * @param length Length
   */
  public resizeFx( id: string, length: number ): void {
    const index = this.__getFxIndexById( id );

    const fx = this.__fxs[ index ];

    const sameRow = this.__fxs.filter( ( fxOp ) => fxOp.row === fx.row );
    const indexInRow = sameRow.indexOf( fx );

    const next = sameRow[ indexInRow + 1 ];
    const right = next ? next.time : Infinity;
    fx.length = clamp( length, 0.0, right - fx.time );

    this.precalc();

    this.__emit( 'updateFx', { id, fx: jsonCopy( fx ) } );

    this.__automaton.shouldSave = true;
  }

  /**
   * Resize a fx by left side of the end.
   * It's very GUI dev friendly method. yeah.
   * @param id Index of the fx you want to resize
   * @param length Length
   */
  public resizeFxByLeft( id: string, length: number ): void {
    const index = this.__getFxIndexById( id );

    const fx = this.__fxs[ index ];
    const end = fx.time + fx.length;

    const sameRow = this.__fxs.filter( ( fxOp ) => fxOp.row === fx.row );
    const indexInRow = sameRow.indexOf( fx );
    const prev = sameRow[ indexInRow - 1 ];

    const left = prev ? ( prev.time + prev.length ) : 0.0;

    fx.length = Math.min( Math.max( length, 0.0 ), end - left );
    fx.time = end - fx.length;

    this.precalc();

    this.__emit( 'updateFx', { id, fx: jsonCopy( fx ) } );

    this.__automaton.shouldSave = true;
  }

  /**
   * Same as {@link getValue}, but without fxs.
   * This is an exclusive feature for WithGUI variant.
   * @param time Time at the point you want to grab the value.
   * @returns Result value
   */
  public getValueWithoutFxs( time: number ): number {
    if ( time < 0.0 ) {
      // clamp left
      return this.__valuesWithoutFxs[ 0 ];

    } else if ( this.length <= time ) {
      // clamp right
      return this.__valuesWithoutFxs[ this.__valuesWithoutFxs.length - 1 ];

    } else {
      // fetch two values then do the linear interpolation
      const index = time * this.__automaton.resolution;
      const indexi = Math.floor( index );
      const indexf = index % 1.0;

      const v0 = this.__valuesWithoutFxs[ indexi ];
      const v1 = this.__valuesWithoutFxs[ indexi + 1 ];

      const v = v0 + ( v1 - v0 ) * indexf;

      return v;

    }
  }

  /**
   * Serialize its nodes.
   * @returns Serialized nodes
   */
  private __serializeNodes(): SerializedBezierNode[] {
    return this.__nodes.map( ( node ) => {
      const { time, value, inTime, inValue, outTime, outValue } = node;

      if ( outValue !== 0.0 ) {
        return [ time, value, inTime, inValue, outTime, outValue ];
      } else if ( outTime !== 0.0 ) {
        return [ time, value, inTime, inValue, outTime ];
      } else if ( inValue !== 0.0 ) {
        return [ time, value, inTime, inValue ];
      } else if ( inTime !== 0.0 ) {
        return [ time, value, inTime ];
      } else if ( value !== 0.0 ) {
        return [ time, value ];
      } else if ( time !== 0.0 ) {
        return [ time ];
      } else {
        return [];
      }
    } );
  }

  /**
   * Serialize its fxs.
   * @returns Serialized fxs
   */
  private __serializeFxs(): SerializedFxSection[] | undefined {
    if ( this.__fxs.length === 0 ) { return undefined; }

    return this.__fxs.map( ( fx ) => {
      const data: SerializedFxSection = {
        def: fx.def,
        params: jsonCopy( fx.params )
      };
      if ( fx.time !== 0.0 ) {
        data.time = fx.time;
      }
      if ( fx.length !== 0.0 ) {
        data.length = fx.length;
      }
      if ( fx.row !== 0 ) {
        data.row = fx.row;
      }
      if ( fx.bypass ) {
        data.bypass = true;
      }
      return data;
    } );
  }

  /**
   * Watch for status changes.
   * Execute given procedure immediately.
   * If the procedure changes its status, emit an event.
   * @param procedure A procedure that might change its status
   */
  private __watchStatus( procedure: () => void ): void {
    const prevStatus = this.status;

    procedure();

    if ( prevStatus !== this.status ) {
      this.__emit( 'updateStatus' );
    }
  }

  /**
   * Sort nodes by time.
   */
  private __sortNodes(): void {
    this.__nodes = this.__nodes.sort( ( a, b ) => a.time - b.time );
  }

  /**
   * Search for node that has given id then return index of it.
   * If it couldn't find the node, it will throw an error instead.
   * @param id Id of node you want to grab
   * @returns The index of the node
   */
  private __getNodeIndexById( id: string ): number {
    const index = this.__nodes.findIndex( ( node ) => node.$id === id );
    if ( index === -1 ) { throw new Error( `Searched for node id: ${id} but not found` ); }
    return index;
  }

  /**
   * Sort fxs by time.
   */
  private __sortFxs(): void {
    this.__fxs = this.__fxs.sort( ( a, b ) => a.time - b.time ).sort( ( a, b ) => a.row - b.row );
  }

  /**
   * Search for fx section that has given id then return index of it.
   * If it couldn't find the section, it will throw an error instead.
   * @param id Id of section you want to grab
   * @returns The index of the section
   */
  private __getFxIndexById( id: string ): number {
    const index = this.__fxs.findIndex( ( fx ) => fx.$id === id );
    if ( index === -1 ) { throw new Error( `Searched for fx id: ${id} but not found` ); }
    return index;
  }

  /**
   * Search for vacance fx row for given time and length.
   * @param time Beginning time of fx
   * @param length Length of fx
   * @param row If given, rows lower than this value will not be searched.
   * @returns Minimal free fx row
   */
  private __getFreeRow( _time: number, _length: number, _row: number = 0 ): number {
    let row = _row || 0;
    for ( let iFx = 0; iFx < this.__fxs.length; iFx ++ ) {
      const fx = this.__fxs[ iFx ];
      if ( fx.row < row ) { continue; }
      if ( row < fx.row ) { break; }
      if ( hasOverwrap( _time, _length, fx.time, fx.length ) ) {
        row ++;
      }
    }
    return row;
  }
}

export interface CurveWithGUIEvents {
  createNode: { id: string; node: BezierNode & WithID };
  updateNode: { id: string; node: BezierNode & WithID };
  removeNode: { id: string };
  createFx: { id: string; fx: FxSection & WithBypass & WithID };
  updateFx: { id: string; fx: FxSection & WithBypass & WithID };
  removeFx: { id: string };
  previewTime: {
    time: number;
    value: number;
    itemTime: number;
    itemSpeed: number;
    itemOffset: number;
  };
  precalc: void;
  updateStatus: void;
  changeLength: { length: number };
}

applyMixins( CurveWithGUI, [ SerializableWithID, EventEmittable, WithStatus ] );
