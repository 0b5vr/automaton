import { BezierNode, FxSection, Param, SerializedParam } from '@fms-cat/automaton';
import { AutomatonWithGUI } from './AutomatonWithGUI';
import { EventEmittable } from './mixins/EventEmittable';
import { Serializable } from './types/Serializable';
import { WithID } from './types/WithID';
import { applyMixins } from './utils/applyMixins';
import { genID } from './utils/genID';
import { hasOverwrap } from './utils/hasOverwrap';
import { jsonCopy } from './utils/jsonCopy';
import { removeID } from './utils/removeID';

/**
 * Handles of a new node will be created in this length.
 */
export const PARAM_DEFAULT_HANDLE_LENGTH = 0.5;

export const PARAM_FX_ROW_MAX = 5;

/**
 * Represents "Status code" of a {@link ParamStatus}.
 */
export enum ParamStatusCode {
  OK,
  NOT_USED,
  NAN_DETECTED,
}

/**
 * Represents fatality of a {@link ParamStatus}.
 */
export enum ParamStatusLevel {
  OK,
  INFO,
  WARNING,
  ERROR,
}

/**
 * Interface represents a status of a {@link Param}.
 * Status: info / warning / error...
 */
export interface ParamStatus {
  /**
   * Status code of the status.
   */
  code: ParamStatusCode;

  /**
   * Fatality of the status.
   */
  level: ParamStatusLevel;

  /**
   * Message of the status.
   */
  message?: string;
}

/**
 * It represents a param of Automaton.
 * It's `automaton.js` and `automaton.min.js` version.
 * It has even more pretty APIs yay
 * @param automaton Parent automaton
 * @param data Data of the param
 */
export class ParamWithGUI extends Param implements Serializable<SerializedParam> {
  /**
   * The parent automaton.
   */
  protected __automaton!: AutomatonWithGUI;

  /**
   * List of bezier node.
   */
  protected __nodes!: Array<BezierNode & WithID>;

  /**
   * List of fx sections.
   */
  protected __fxs!: Array<FxSection & WithID>;

  /**
   * List of status (warning / error).
   * The array is empty = you're cool
   */
  private __statusList: ParamStatus[];

  public constructor( automaton: AutomatonWithGUI, data?: SerializedParam ) {
    super( automaton, data || {
      nodes: [
        {
          time: 0.0,
          value: 0.0,
          out: { time: PARAM_DEFAULT_HANDLE_LENGTH, value: 0.0 }
        },
        {
          time: automaton.length,
          value: 0.0,
          in: { time: -PARAM_DEFAULT_HANDLE_LENGTH, value: 0.0 }
        }
      ],
      fxs: []
    } );

    this.__statusList = [
      {
        code: ParamStatusCode.NOT_USED,
        level: ParamStatusLevel.WARNING,
        message: 'This param has not been used yet'
      }
    ];
  }

  /**
   * Its current status (warning / error).
   */
  public get status(): ParamStatus {
    if ( this.__statusList.length === 0 ) {
      return {
        code: ParamStatusCode.OK,
        level: ParamStatusLevel.OK
      };
    }

    return this.__statusList[ 0 ];
  }

  /**
   * Load a param data.
   * @param data Data of param
   */
  public deserialize( data: SerializedParam ): void {
    super.deserialize( jsonCopy( data ) );

    this.__nodes.forEach( ( node ) => node.$id = genID() );
    this.__fxs.forEach( ( fx ) => fx.$id = genID() );
  }

  /**
   * Precalculate value of samples.
   */
  public precalc(): void {
    super.precalc();

    let b = false;
    this.__values.forEach( ( v, i ) => {
      if ( isNaN( v ) ) {
        this.__values[ i ] = 0.0;
        b = true;
      }
    } );
    this.__setStatus( b, {
      code: ParamStatusCode.NAN_DETECTED,
      level: ParamStatusLevel.ERROR,
      message: 'This param has NaN value'
    } );

    this.__emit( 'precalc' );
    this.__automaton.pokeRenderer();
  }

  /**
   * Mark this param as used.
   */
  public markAsUsed(): void {
    this.__setStatus( false, {
      code: ParamStatusCode.NOT_USED,
      level: ParamStatusLevel.WARNING
    } );
  }

  /**
   * Return how many node the param currently have.
   * @returns Nodes count
   */
  public getNumNode(): number {
    return this.__nodes.length;
  }

  /**
   * Serialize its current state.
   * @returns Serialized state
   */
  public serialize(): SerializedParam {
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
    const data = {
      $id: genID(),
      time,
      value,
      in: { time: -PARAM_DEFAULT_HANDLE_LENGTH, value: 0.0 },
      out: { time: PARAM_DEFAULT_HANDLE_LENGTH, value: 0.0 }
    };
    this.__nodes.push( data );
    this.__sortNodes();

    this.precalc();

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

    return jsonCopy( data );
  }

  /**
   * Remove a node.
   * @param id Id of the node you want to remove
   */
  public removeNode( id: string ): void {
    const index = this.__getNodeIndexById( id );

    this.__nodes.splice( index, 1 );

    this.precalc();
  }

  /**
   * Move a node.
   * @param id Id of the node you want to move
   * @param time Time
   * @param value Value
   */
  public moveNode( id: string, time: number, value: number ): void {
    const index = this.__getNodeIndexById( id );

    const node = this.__nodes[ index ];

    let newTime = time;
    if ( index === 0 ) {
      newTime = 0;
    } else if ( index === this.__nodes.length - 1 ) {
      newTime = this.__automaton.length;
    } else {
      newTime = Math.min(
        Math.max( newTime, this.__nodes[ index - 1 ].time ),
        this.__nodes[ index + 1 ].time
      );
    }
    node.time = newTime;

    node.value = value;

    this.precalc();
  }

  /**
   * Move a handle of a node.
   * @param id Id of the node you want to operate
   * @param dir Which handle?
   * @param time Time
   * @param value Value
   */
  public moveHandle( id: string, dir: 'in' | 'out', time: number, value: number ): void {
    const index = this.__getNodeIndexById( id );

    if (
      ( index === 0 && dir === 'in' ) ||
      ( index === ( this.getNumNode() - 1 ) && dir === 'out' )
    ) { return; }

    const node = this.__nodes[ index ];
    const handle = ( dir === 'in' ? node.in : node.out )!;

    const newTime = ( dir === 'in' ) ? Math.min( 0.0, time ) : Math.max( 0.0, time );
    handle.time = newTime;

    handle.value = value;

    this.precalc();
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
    if ( dir === 'in' ) {
      node.in = { time: -PARAM_DEFAULT_HANDLE_LENGTH, value: 0.0 };
    } else {
      node.out = { time: PARAM_DEFAULT_HANDLE_LENGTH, value: 0.0 };
    }

    this.precalc();
  }

  /**
   * Get the nth fx section.
   * @param index Index of the fx section
   * @returns Data of the fx section
   */
  public getFxByIndex( index: number ): FxSection & WithID {
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
  public getFx( id: string ): FxSection & WithID {
    const index = this.__getFxIndexById( id );
    return jsonCopy( this.__fxs[ index ] );
  }

  /**
   * Create a fx.
   * If it couldn't create param, it will return `null` instead.
   * @param time Beginning time of new fx
   * @param length Length of new fx
   * @param def Definition id (kind) of new fx
   * @returns Id of the new fx
   */
  public createFx( time: number, length: number, def: string ): string | null {
    const row = this.__getFreeRow( time, length );
    if ( PARAM_FX_ROW_MAX <= row ) {
      console.error( 'Too many fx stacks at here!' );
      return null;
    }

    const data: FxSection & WithID = {
      $id: genID(),
      time: time,
      length: length,
      row: row,
      def: def,
      params: this.__automaton.generateDefaultFxParams( def )
    };
    this.__fxs.push( data );
    this.__sortFxs();

    this.precalc();

    return data.$id;
  }

  /**
   * Create a fx from dumped data.
   * If it couldn't create param, it will return empty string instead.
   * @param fx Dumped fx data
   * @returns Id of the new fx
   */
  public createFxFromData( fx: FxSection & WithID ): string {
    const row = this.__getFreeRow( fx.time, fx.length, fx.row );
    if ( PARAM_FX_ROW_MAX <= row ) {
      console.error( 'Too many fx stacks at here!' );
      return '';
    }

    const data = jsonCopy( fx );
    data.row = row;
    this.__fxs.push( data );
    this.__sortFxs();

    this.precalc();

    return data.$id;
  }

  /**
   * Remove a fx.
   * @param id Id of the fx you want to remove
   */
  public removeFx( id: string ): void {
    const index = this.__getFxIndexById( id );

    this.__fxs.splice( index, 1 );

    this.precalc();
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
    const next = sameRow[ indexInRow + 1 ];

    const left = prev ? ( prev.time + prev.length ) : 0.0;
    const right = next ? next.time : this.__automaton.length;
    fx.time = Math.min( Math.max( time, left ), right - fx.length );

    this.precalc();
  }

  /**
   * Change row of a fx.
   * @param id Id of the fx you want to move
   * @param row Row
   */
  public changeFxRow( id: string, row: number ): void {
    const index = this.__getFxIndexById( id );

    if ( row < 0 || PARAM_FX_ROW_MAX <= row ) {
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
  }

  /**
   * Bypass or unbypass a fx.
   * @param id Id of the fx you want to change
   * @param bypass If true, fx will be bypassed
   */
  public bypassFx( id: string, bypass: boolean ): void {
    const index = this.__getFxIndexById( id );

    const fx = this.__fxs[ index ];
    // Vue.set( fx, 'bypass', !!bypass );
    fx.bypass = bypass;

    this.precalc();
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
    // Vue.set( fx.params, name, newValue );
    fx.params[ name ] = newValue;

    this.precalc();
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

    const right = next ? next.time : this.__automaton.length;

    fx.length = Math.min( Math.max( length, 0.0 ), right - fx.time );

    this.precalc();
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
  }

  /**
   * Call when you need to change automaton length.
   * This is very hardcore method. Should not be called by anywhere except {@link AutomatonWithGUI#setLength}.
   * @param length Desired length
   */
  public changeLength( length: number ): void {
    for ( let i = this.__nodes.length - 1; 0 <= i; i -- ) {
      const node = this.__nodes[ i ];
      if ( length < node.time ) {
        this.__nodes.splice( i, 1 );
      } else if ( node.time === length ) {
        delete node.out;
        break;
      } else {
        const lastNode = this.__nodes[ this.__nodes.length - 1 ];
        if ( lastNode ) {
          lastNode.out = { time: PARAM_DEFAULT_HANDLE_LENGTH, value: 0.0 };
        }

        this.__nodes.push( {
          time: length,
          value: 0.0,
          in: { time: -PARAM_DEFAULT_HANDLE_LENGTH, value: 0.0 },
          $id: genID()
        } );
        break;
      }
    }

    for ( let i = this.__fxs.length - 1; 0 <= i; i -- ) {
      const fx = this.__fxs[ i ];
      if ( length < fx.time ) {
        this.__fxs.splice( i, 1 );
      } else if ( length < fx.time + fx.length ) {
        fx.length = length - fx.time;
      }
    }

    this.__values = new Float32Array( this.__automaton.resolution * length + 1 );
    this.precalc();
  }

  /**
   * Serialize its nodes.
   * @returns Serialized nodes
   */
  private __serializeNodes(): BezierNode[] {
    return this.__nodes.map( ( node ) => removeID( jsonCopy( node ) ) );
  }

  /**
   * Serialize its fxs.
   * @returns Serialized fxs
   */
  private __serializeFxs(): FxSection[] {
    return this.__fxs.map( ( fx ) => removeID( jsonCopy( fx ) ) );
  }

  /**
   * Set a status.
   * @param bool Boolean whether the status is currently active or not
   * @param status The status
   */
  private __setStatus( bool: boolean, status: ParamStatus ): void {
    if ( !this.__statusList ) { // Param.constructor -> ... -> ParamWithGUI.precalc -> ParamWithGUI.__setStatus
      return;
    }

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

    this.__emit( 'status' );
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

export interface ParamWithGUI extends EventEmittable<{
  precalc: void;
  status: void;
}> {}
applyMixins( ParamWithGUI, [ EventEmittable ] );
