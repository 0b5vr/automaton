import { CurveEditorRange, CurveEditorSize, x2t, y2v } from '../utils/CurveEditorUtils';
import { produce } from 'immer';

// == state ========================================================================================
export interface State {
  selectedParam: string | null;
  selectedItems: {
    nodes: string[];
    fxs: string[];
  };
  range: CurveEditorRange;
  size: CurveEditorSize;
}

export const initialState: State = {
  selectedParam: null,
  selectedItems: {
    nodes: [],
    fxs: []
  },
  range: {
    t0: 0.0,
    v0: -0.2,
    t1: 5.0,
    v1: 1.2
  },
  size: {
    width: 1,
    height: 1
  }
};

// == action =======================================================================================
export type Action = {
  type: 'CurveEditor/SelectParam';
  param: string | null;
} | {
  type: 'CurveEditor/SelectItems';
  nodes?: string[];
  fxs?: string[];
} | {
  type: 'CurveEditor/SelectItemsAdd';
  nodes?: string[];
  fxs?: string[];
} | {
  type: 'CurveEditor/SelectItemsSub';
  nodes?: string[];
  fxs?: string[];
} | {
  type: 'CurveEditor/MoveRange';
  dx: number;
  dy: number;
  tmax: number;
} | {
  type: 'CurveEditor/ZoomRange';
  cx: number;
  cy: number;
  dx: number;
  dy: number;
  tmax: number;
} | {
  type: 'CurveEditor/SetSize';
  size: CurveEditorSize;
};

// == reducer ======================================================================================
export function reducer(
  state: State,
  action: Action
): State {
  return produce( state, ( newState: State ) => {
    if ( action.type === 'CurveEditor/SelectParam' ) {
      newState.selectedParam = action.param;
      newState.selectedItems = {
        nodes: [],
        fxs: []
      };
    } else if ( action.type === 'CurveEditor/SelectItems' ) {
      newState.selectedItems = {
        nodes: action.nodes || [],
        fxs: action.fxs || []
      };
    } else if ( action.type === 'CurveEditor/SelectItemsAdd' ) {
      action.nodes?.map( ( node ) => {
        newState.selectedItems.nodes.push( node );
      } );

      action.fxs?.map( ( fx ) => {
        newState.selectedItems.fxs.push( fx );
      } );
    } else if ( action.type === 'CurveEditor/SelectItemsSub' ) {
      action.nodes?.map( ( node ) => {
        const index = newState.selectedItems.nodes.indexOf( node );
        index !== -1 && newState.selectedItems.nodes.splice( index, 1 );
      } );

      action.fxs?.map( ( fx ) => {
        const index = newState.selectedItems.fxs.indexOf( fx );
        index !== -1 && newState.selectedItems.fxs.splice( index, 1 );
      } );
    } else if ( action.type === 'CurveEditor/MoveRange' ) {
      const { range, size } = state;
      const length = action.tmax;

      let dt = x2t( 0.0, range, size.width ) - x2t( action.dx, range, size.width );
      dt = Math.min( Math.max( dt, -range.t0 ), length - range.t1 );

      const dv = y2v( 0.0, range, size.height ) - y2v( action.dy, range, size.height );

      newState.range.t0 += dt;
      newState.range.t1 += dt;
      newState.range.v0 += dv;
      newState.range.v1 += dv;
    } else if ( action.type === 'CurveEditor/ZoomRange' ) {
      const { range, size } = state;
      const length = action.tmax;

      const ct = x2t( action.cx, range, size.width );
      const cv = y2v( action.cy, range, size.height );
      const rt = ( ct - range.t0 ) / ( range.t1 - range.t0 );
      const rv = ( cv - range.v0 ) / ( range.v1 - range.v0 );

      let dt = range.t1 - range.t0;
      dt *= Math.pow( ( size.width + 1.0 ) / size.width, action.dx * 2.0 );
      dt = Math.min( Math.max( dt, 0.01 ), 1000.0 );

      let dv = range.v1 - range.v0;
      dv *= Math.pow( ( size.width + 1.0 ) / size.width, action.dy * 2.0 );
      dv = Math.min( Math.max( dv, 0.01 ), 1000.0 );

      newState.range.t0 = ct - rt * dt;
      newState.range.t1 = ct + ( 1.0 - rt ) * dt;
      newState.range.v0 = cv - rv * dv;
      newState.range.v1 = cv + ( 1.0 - rv ) * dv;

      if ( newState.range.t0 < 0.0 ) {
        newState.range.t1 = Math.max( newState.range.t1 - newState.range.t0, newState.range.t1 );
      }
      if ( length < newState.range.t1 ) {
        newState.range.t0 += length - newState.range.t1;
      }
      if ( newState.range.t0 < 0.0 ) {
        newState.range.t0 = 0.0;
      }
      if ( length < newState.range.t1 ) {
        newState.range.t1 = length;
      }
    } else if ( action.type === 'CurveEditor/SetSize' ) {
      newState.size = action.size;
    }
  } );
}
