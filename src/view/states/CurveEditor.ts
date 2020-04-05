import { TimeValueRange, x2t, y2v } from '../utils/TimeValueRange';
import { arraySetDiff, arraySetUnion } from '../utils/arraySet';
import { Action as ContextAction } from './store';
import { Reducer } from 'redux';
import { Resolution } from '../utils/Resolution';
import { produce } from 'immer';

// == state ========================================================================================
export interface State {
  selectedCurve: number | null;
  selectedItems: {
    nodes: string[];
    fxs: string[];
  };
  range: TimeValueRange;
}

export const initialState: State = {
  selectedCurve: null,
  selectedItems: {
    nodes: [],
    fxs: []
  },
  range: {
    t0: 0.0,
    v0: -0.2,
    t1: 5.0,
    v1: 1.2
  }
};

// == action =======================================================================================
export type Action = {
  type: 'CurveEditor/SelectCurve';
  curve: number | null;
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
  size: Resolution;
  dx: number;
  dy: number;
  tmax: number;
} | {
  type: 'CurveEditor/ZoomRange';
  size: Resolution;
  cx: number;
  cy: number;
  dx: number;
  dy: number;
  tmax: number;
};

// == reducer ======================================================================================
export const reducer: Reducer<State, ContextAction> = ( state = initialState, action ) => {
  return produce( state, ( newState: State ) => {
    if ( action.type === 'CurveEditor/SelectCurve' ) {
      newState.selectedCurve = action.curve;
      newState.selectedItems.nodes = [];
      newState.selectedItems.fxs = [];
    } else if ( action.type === 'CurveEditor/SelectItems' ) {
      if ( action.nodes ) {
        newState.selectedItems.nodes = action.nodes;
      }

      if ( action.fxs ) {
        newState.selectedItems.fxs = action.fxs;
      }
    } else if ( action.type === 'CurveEditor/SelectItemsAdd' ) {
      if ( action.nodes ) {
        newState.selectedItems.nodes = arraySetUnion( state.selectedItems.nodes, action.nodes );
      }

      if ( action.fxs ) {
        newState.selectedItems.fxs = arraySetUnion( state.selectedItems.fxs, action.fxs );
      }
    } else if ( action.type === 'CurveEditor/SelectItemsSub' ) {
      if ( action.nodes ) {
        newState.selectedItems.nodes = arraySetDiff( state.selectedItems.nodes, action.nodes );
      }

      if ( action.fxs ) {
        newState.selectedItems.fxs = arraySetDiff( state.selectedItems.fxs, action.fxs );
      }
    } else if ( action.type === 'CurveEditor/MoveRange' ) {
      const { range } = state;
      const { size } = action;
      const length = action.tmax;

      let dt = x2t( 0.0, range, size.width ) - x2t( action.dx, range, size.width );
      dt = Math.min( Math.max( dt, -range.t0 ), length - range.t1 );

      const dv = y2v( 0.0, range, size.height ) - y2v( action.dy, range, size.height );

      newState.range = {
        t0: state.range.t0 + dt,
        t1: state.range.t1 + dt,
        v0: state.range.v0 + dv,
        v1: state.range.v1 + dv,
      };
    } else if ( action.type === 'CurveEditor/ZoomRange' ) {
      const { range } = state;
      const { size } = action;
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

      newState.range = {
        t0: ct - rt * dt,
        t1: ct + ( 1.0 - rt ) * dt,
        v0: cv - rv * dv,
        v1: cv + ( 1.0 - rv ) * dv,
      };

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
    } else if ( action.type === 'Automaton/RemoveCurveNode' ) {
      newState.selectedItems.nodes = arraySetDiff( newState.selectedItems.nodes, [ action.id ] );
    } else if ( action.type === 'Automaton/RemoveCurveFx' ) {
      newState.selectedItems.fxs = arraySetDiff( newState.selectedItems.fxs, [ action.id ] );
    } else if ( action.type === 'Automaton/ChangeCurveLength' ) { // WHOA, REALLY
      if ( action.length < state.range.t0 ) {
        // if t0 is larger than the new length, reset the range
        newState.range = {
          t0: 0.0,
          t1: action.length,
          v0: state.range.v0,
          v1: state.range.v1,
        };

      } else if ( action.length < state.range.t1 ) {
        // if t1 is larger than the new length, clamp the t1 to the new length
        newState.range = {
          t0: state.range.t0,
          t1: action.length,
          v0: state.range.v0,
          v1: state.range.v1,
        };
      }
    }
  } );
};
