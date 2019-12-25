import { CurveEditorRange, x2t, y2v } from '../utils/CurveEditorUtils';
import { SerializedParam } from '@fms-cat/automaton';
import { produce } from 'immer';

// == state ========================================================================================
export interface State {
  selectedParam: string | null;
  serializedParam: SerializedParam | null;
  range: CurveEditorRange;
  size: {
    width: number;
    height: number;
  };
}

export const initialState: State = {
  selectedParam: null,
  serializedParam: null,
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
export enum ActionType {
  UpdateSerializedParam = 'CurveEditor/UpdateSerializedParam',
  SelectParam = 'CurveEditor/SelectParam',
  MoveRange = 'CurveEditor/MoveRange',
  ZoomRange = 'CurveEditor/ZoomRange',
  SetSize = 'CurveEditor/SetSize',
}

interface Action {
  type: ActionType;
  [ key: string ]: any;
}

// == reducer ======================================================================================
export function reducer(
  state: State,
  action: Action
): State {
  return produce( state, ( newState: State ) => {
    if ( action.type === ActionType.UpdateSerializedParam ) {
      newState.serializedParam = action.param.serialize();
    } else if ( action.type === ActionType.SelectParam ) {
      newState.selectedParam = action.param;
    } else if ( action.type === ActionType.MoveRange ) {
      const { range, size } = state;
      const length = action.tmax;

      let dt = x2t( 0.0, range, size.width ) - x2t( action.dx, range, size.width );
      dt = Math.min( Math.max( dt, -range.t0 ), length - range.t1 );

      const dv = y2v( 0.0, range, size.height ) - y2v( action.dy, range, size.height );

      newState.range.t0 += dt;
      newState.range.t1 += dt;
      newState.range.v0 += dv;
      newState.range.v1 += dv;
    } else if ( action.type === ActionType.ZoomRange ) {
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
    } else if ( action.type === ActionType.SetSize ) {
      newState.size = action.size;
    }
  } );
}
