import { TimeValueRange, dx2dt, dy2dv, x2t, y2v } from '../utils/TimeValueRange';
import { Action as ContextAction } from './store';
import { Reducer } from 'redux';
import { Resolution } from '../utils/Resolution';
import { produce } from 'immer';

// == state ========================================================================================
export interface State {
  selectedChannel: string | null;
  selectedItems: Map<string, { // key is an id
    id: string;
    channel: string;
  }>;
  range: TimeValueRange;
  size: Resolution;
}

export const initialState: State = {
  selectedChannel: null,
  selectedItems: new Map(),
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
  type: 'Timeline/SelectChannel';
  channel: string | null;
} | {
  type: 'Timeline/SelectItems';
  items: Array<{
    id: string;
    channel: string;
  }>;
} | {
  type: 'Timeline/SelectItemsAdd';
  items: Array<{
    id: string;
    channel: string;
  }>;
} | {
  type: 'Timeline/SelectItemsSub';
  items: string[];
} | {
  type: 'Timeline/MoveRange';
  dx: number;
  dy: number;
  tmax: number;
} | {
  type: 'Timeline/ZoomRange';
  cx: number;
  cy: number;
  dx: number;
  dy: number;
  tmax: number;
} | {
  type: 'Timeline/SetSize';
  size: Resolution;
};

// == reducer ======================================================================================
export const reducer: Reducer<State, ContextAction> = ( state = initialState, action ) => {
  return produce( state, ( newState: State ) => {
    if ( action.type === 'Timeline/SelectChannel' ) {
      newState.selectedChannel = action.channel;
      newState.selectedItems.clear();
    } else if ( action.type === 'Timeline/SelectItems' ) {
      newState.selectedItems.clear();
      action.items.forEach( ( item ) => {
        newState.selectedItems.set( item.id, item );
      } );
    } else if ( action.type === 'Timeline/SelectItemsAdd' ) {
      action.items.forEach( ( item ) => {
        newState.selectedItems.set( item.id, item );
      } );
    } else if ( action.type === 'Timeline/SelectItemsSub' ) {
      action.items?.forEach( ( item ) => {
        newState.selectedItems.delete( item );
      } );
    } else if ( action.type === 'Timeline/MoveRange' ) {
      const { range, size } = state;
      const length = action.tmax;

      let dt = -dx2dt( action.dx, range, size.width );
      dt = Math.min( Math.max( dt, -range.t0 ), length - range.t1 );

      const dv = -dy2dv( action.dy, range, size.height );

      newState.range = {
        t0: state.range.t0 + dt,
        t1: state.range.t1 + dt,
        v0: state.range.v0 + dv,
        v1: state.range.v1 + dv,
      };
    } else if ( action.type === 'Timeline/ZoomRange' ) {
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
    } else if ( action.type === 'Timeline/SetSize' ) {
      newState.size = action.size;
    } else if ( action.type === 'Automaton/UpdateLength' ) { // WHOA, REALLY
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
