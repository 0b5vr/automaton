import { BezierNode, Curve, FxSection, SerializedBezierNode, SerializedCurve, SerializedFxSection } from '@fms-cat/automaton';
import { AutomatonWithGUI } from './AutomatonWithGUI';
import { EventEmittable } from './mixins/EventEmittable';
import { Serializable } from './types/Serializable';
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
export const CURVE_DEFAULT_HANDLE_LENGTH = 0.5;

export const CURVE_FX_ROW_MAX = 5;

/**
 * Represents "Status code" of a {@link CurveStatus}.
 */
export enum CurveStatusCode {
  NOT_USED,
  NAN_DETECTED,
}

/**
 * Represents fatality of a {@link CurveStatus}.
 */
export enum CurveStatusLevel {
  INFO,
  WARNING,
  ERROR,
}

/**
 * Interface represents a status of a {@link CurveWithGUI}.
 * Status: info / warning / error...
 */
export interface CurveStatus {
  /**
   * Status code of the status.
   */
  code: CurveStatusCode;

  /**
   * Fatality of the status.
   */
  level: CurveStatusLevel;

  /**
   * Message of the status.
   */
  message?: string;
}

/**
 * It represents a channel of Automaton.
 * It's `automaton.js` and `automaton.min.js` version.
 * It has even more pretty APIs yay
 * @param automaton Parent automaton
 * @param data Data of the channel
 */
export class CurveWithGUI extends Curve implements Serializable<SerializedCurve> {
  /**
   * The parent automaton.
   */
  protected __automaton!: AutomatonWithGUI;

  /**
   * List of bezier nodes.
   */
  protected __nodes!: Array<BezierNode & WithID>;

  /**
   * List of fx sections.
   */
  protected __fxs!: Array<FxSection & WithBypass & WithID>;

  /**
   * List of status (warning / error).
   * The array is empty = you're cool
   */
  private __statusList: CurveStatus[];

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

  public constructor( automaton: AutomatonWithGUI, data?: SerializedCurve ) {
    super( automaton, data || {
      nodes: [
        {
          time: 0.0,
          value: 0.0,
          out: { time: CURVE_DEFAULT_HANDLE_LENGTH, value: 0.0 }
        },
        {
          time: 1.0,
          value: 0.0,
          in: { time: -CURVE_DEFAULT_HANDLE_LENGTH, value: 0.0 }
        }
      ],
      fxs: []
    } );

    this.__statusList = [
      {
        code: CurveStatusCode.NOT_USED,
        level: CurveStatusLevel.WARNING,
        message: 'This curve has not been used yet'
      }
    ];
  }

  /**
   * Its current status (warning / error).
   */
  public get status(): CurveStatus | null {
    if ( this.__statusList.length === 0 ) {
      return null;
    }

    return this.__statusList[ 0 ];
  }

  /**
   * Load a curve data.
   * @param data Data of curve
   */
  public deserialize( data: SerializedCurve ): void {
    super.deserialize( jsonCopy( data ) );

    this.__nodes.forEach( ( node ) => {
      node.in = node.in || { time: 0.0, value: 0.0 };
      node.out = node.out || { time: 0.0, value: 0.0 };
      node.$id = genID();
    } );

    this.__fxs.forEach( ( fx ) => fx.$id = genID() );
  }

  /**
   * Precalculate value of samples.
   */
  public precalc(): void {
    super.precalc();

    let hasNaN = false;
    this.__values.forEach( ( v, i ) => {
      if ( isNaN( v ) ) {
        this.__values[ i ] = 0.0;
        hasNaN = true;
      }
    } );
    this.__setStatus( hasNaN, {
      code: CurveStatusCode.NAN_DETECTED,
      level: CurveStatusLevel.ERROR,
      message: 'This curve has NaN value'
    } );

    this.__emit( 'precalc' );
  }

  /**
   * Update the preview time.
   * Do not call this function if you're not a [[ChannelItemCurveWithGUI]].
   * @param time Time
   * @param value Value
   */
  public setPreviewTimeValue( time: number, value: number ): void {
    this.__emit( 'previewValue', { time, value } );
  }

  /**
   * Mark this curve as used.
   */
  public markAsUsed(): void {
    this.__setStatus( false, {
      code: CurveStatusCode.NOT_USED,
      level: CurveStatusLevel.WARNING
    } );
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
   * Create a node.
   * @param time Time of new node
   * @param value Value of new node
   * @returns Data of the node
   */
  public createNode( time: number, value: number ): BezierNode & WithID {
    const id = genID();
    const data = {
      $id: id,
      time,
      value,
      in: { time: -CURVE_DEFAULT_HANDLE_LENGTH, value: 0.0 },
      out: { time: CURVE_DEFAULT_HANDLE_LENGTH, value: 0.0 }
    };
    this.__nodes.push( data );
    this.__sortNodes();

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

    if (
      ( index === 0 && dir === 'in' ) ||
      ( index === ( this.getNumNode() - 1 ) && dir === 'out' )
    ) { return; }

    const node = this.__nodes[ index ];

    const newTime = ( dir === 'in' ) ? Math.min( 0.0, time ) : Math.max( 0.0, time );

    const handle = node[ dir ];
    handle.time = newTime;

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

    if (
      ( index === 0 && dir === 'in' ) ||
      ( index === ( this.getNumNode() - 1 ) && dir === 'out' )
    ) { return; }

    const node = this.__nodes[ index ];

    const handle = node[ dir ];
    handle.value = value;

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

    if (
      ( index === 0 && dir === 'in' ) ||
      ( index === ( this.getNumNode() - 1 ) && dir === 'out' )
    ) { return; }

    const node = this.__nodes[ index ];
    node[ dir ] = {
      time: ( ( dir === 'in' ) ? -1.0 : 1.0 ) * CURVE_DEFAULT_HANDLE_LENGTH,
      value: 0.0
    };

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
    if ( bypass ) {
      fx.bypass = true;
    } else {
      delete fx.bypass;
    }

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
   * Serialize its nodes.
   * @returns Serialized nodes
   */
  private __serializeNodes(): SerializedBezierNode[] {
    return this.__nodes.map( ( node ) => {
      const data: SerializedBezierNode = {};
      if ( node.time !== 0.0 ) {
        data.time = node.time;
      }
      if ( node.value !== 0.0 ) {
        data.value = node.value;
      }
      if ( node.in.time !== 0.0 && node.in.value !== 0.0 ) {
        data.in = node.in;
      }
      if ( node.out.time !== 0.0 && node.out.value !== 0.0 ) {
        data.out = node.out;
      }
      return data;
    } );
  }

  /**
   * Serialize its fxs.
   * @returns Serialized fxs
   */
  private __serializeFxs(): SerializedFxSection[] {
    return this.__fxs.map( ( fx ) => {
      const data: SerializedFxSection = {
        def: fx.def,
        params: fx.params
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
   * Set a status.
   * @param bool Boolean whether the status is currently active or not
   * @param status The status
   */
  private __setStatus( bool: boolean, status: CurveStatus ): void {
    if ( !this.__statusList ) { // Channel.constructor -> ... -> ChannelWithGUI.precalc -> ChannelWithGUI.__setStatus
      return;
    }

    const prevStatus = this.status;

    // search for old entry, then delete it
    for ( let i = 0; i < this.__statusList.length; i ++ ) {
      if ( this.__statusList[ i ].code === status.code ) {
        this.__statusList.splice( i, 1 );
        break;
      }
    }

    if ( bool ) {
      this.__statusList.push( status );
      this.__statusList.sort( ( a, b ) => b.level - a.level );
    }

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
  previewValue: { time: number; value: number };
  precalc: void;
  updateStatus: void;
  changeLength: { length: number };
}

export interface CurveWithGUI extends EventEmittable<CurveWithGUIEvents> {}
applyMixins( CurveWithGUI, [ EventEmittable ] );
