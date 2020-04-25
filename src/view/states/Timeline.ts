import { TimeValueRange, dx2dt, dy2dv, x2t, y2v } from '../utils/TimeValueRange';
import { Action as ContextAction } from './store';
import { Reducer } from 'redux';
import { Resolution } from '../utils/Resolution';
import { produce } from 'immer';

// == state ========================================================================================
export interface State {
  selectedChannel: string | null;
  selectedItems: {
    [ id: string ]: {
      id: string;
      channel: string;
    };
  };
  lastSelectedItem: {
    id: string;
    channel: string;
  } | null;
  range: TimeValueRange;
}

export const initialState: State = {
  selectedChannel: null,
  selectedItems: {},
  lastSelectedItem: null,
  range: {
    t0: 0.0,
    v0: -0.2,
    t1: 5.0,
    v1: 1.2
  }
};

// == action =======================================================================================
export type Action = {
  type: 'Timeline/Reset';
} | {
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
  type: 'Timeline/UnselectItemsOfOtherChannels';
} | {
  type: 'Timeline/MoveRange';
  size: Resolution;
  dx: number;
  dy: number;
  tmax?: number;
} | {
  type: 'Timeline/ZoomRange';
  size: Resolution;
  cx: number;
  cy: number;
  dx: number;
  dy: number;
  tmax?: number;
};

// == reducer ======================================================================================
export const reducer: Reducer<State, ContextAction> = ( state = initialState, action ) => {
  return produce( state, ( newState: State ) => {
    if ( action.type === 'Timeline/Reset' ) {
      newState.selectedChannel = initialState.selectedChannel;
      newState.selectedItems = initialState.selectedItems;
      newState.lastSelectedItem = initialState.lastSelectedItem;
      newState.range = initialState.range;
    } else if ( action.type === 'Timeline/SelectChannel' ) {
      newState.selectedChannel = action.channel;
    } else if ( action.type === 'Timeline/SelectItems' ) {
      newState.selectedItems = {};
      action.items.forEach( ( item ) => {
        newState.selectedItems[ item.id ] = item;
      } );

      if ( action.items.length === 1 ) {
        newState.lastSelectedItem = action.items[ 0 ];
      }
    } else if ( action.type === 'Timeline/SelectItemsAdd' ) {
      newState.selectedItems = { ...state.selectedItems };
      action.items.forEach( ( item ) => {
        newState.selectedItems[ item.id ] = item;
      } );
    } else if ( action.type === 'Timeline/SelectItemsSub' ) {
      newState.selectedItems = { ...state.selectedItems };
      action.items?.forEach( ( item ) => {
        delete newState.selectedItems[ item ];
      } );
    } else if ( action.type === 'Timeline/UnselectItemsOfOtherChannels' ) {
      newState.selectedItems = {};
      Object.entries( state.selectedItems ).forEach( ( [ id, item ] ) => {
        if ( item.channel === state.selectedChannel ) {
          newState.selectedItems[ id ] = item;
        }
      } );
    } else if ( action.type === 'Timeline/MoveRange' ) {
      const { range } = state;
      const { size } = action;
      const length = action.tmax ?? Infinity;

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
      const { range } = state;
      const { size } = action;
      const length = action.tmax ?? Infinity;

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
    } else if ( action.type === 'Automaton/RemoveChannel' ) {
      if ( state.selectedChannel === action.channel ) {
        newState.selectedChannel = null;
      }
    } else if ( action.type === 'Automaton/RemoveChannelItem' ) {
      newState.selectedItems = { ...state.selectedItems };
      delete newState.selectedItems[ action.id ];
    } else if ( action.type === 'CurveEditor/SelectCurve' ) { // WHOA WHOA
      newState.lastSelectedItem = null;
    }
  } );
};
