import { BezierNode, FxDefinition, FxSection } from '@fms-cat/automaton';
import { GUISettings, defaultGUISettings } from '../../types/GUISettings';
import { AutomatonWithGUI } from '../../AutomatonWithGUI';
import { ParamStatus } from '../../ParamWithGUI';
import { Reducer } from 'redux';
import { WithID } from '../../types/WithID';
import { jsonCopy } from '../../utils/jsonCopy';
import { produce } from 'immer';

// == state ========================================================================================
export interface State {
  instance?: AutomatonWithGUI;
  fxDefinitions: { [ name: string ]: FxDefinition };
  params: {
    [ name: string ]: {
      value: number;
      status: ParamStatus | null;
      nodes: { [ id: string ]: BezierNode & WithID };
      fxs: { [ id: string ]: FxSection & WithID };
    };
  };
  isPlaying: boolean;
  time: number;
  length: number;
  resolution: number;
  guiSettings: GUISettings;
}

export const initialState: Readonly<State> = {
  params: {},
  fxDefinitions: {},
  isPlaying: false,
  time: 0.0,
  length: 1.0,
  resolution: 10.0,
  guiSettings: jsonCopy( defaultGUISettings )
};

// == action =======================================================================================
export type Action = {
  type: 'Automaton/SetInstance';
  automaton: AutomatonWithGUI;
} | {
  type: 'Automaton/AddFxDefinition';
  name: string;
  fxDefinition: FxDefinition;
} | {
  type: 'Automaton/CreateParam';
  param: string;
} | {
  type: 'Automaton/UpdateParamValue';
  param: string;
  value: number;
} | {
  type: 'Automaton/UpdateParamStatus';
  param: string;
  status: ParamStatus | null;
} | {
  type: 'Automaton/UpdateParamNode';
  param: string;
  id: string;
  node: BezierNode & WithID;
} | {
  type: 'Automaton/RemoveParamNode';
  param: string;
  id: string;
} | {
  type: 'Automaton/UpdateParamFx';
  param: string;
  id: string;
  fx: FxSection & WithID;
} | {
  type: 'Automaton/RemoveParamFx';
  param: string;
  id: string;
} | {
  type: 'Automaton/UpdateIsPlaying';
  isPlaying: boolean;
} | {
  type: 'Automaton/UpdateTime';
  time: number;
} | {
  type: 'Automaton/UpdateLength';
  length: number;
  resolution: number;
} | {
  type: 'Automaton/UpdateGUISettings';
  settings: GUISettings;
};

// == reducer ======================================================================================
export const reducer: Reducer<State, Action> = ( state = initialState, action ) => {
  return produce( state, ( newState: State ) => {
    if ( action.type === 'Automaton/SetInstance' ) {
      newState.instance = action.automaton;
    } else if ( action.type === 'Automaton/AddFxDefinition' ) {
      newState.fxDefinitions[ action.name ] = action.fxDefinition;
    } else if ( action.type === 'Automaton/CreateParam' ) {
      newState.params[ action.param ] = {
        value: 0.0,
        status: null,
        nodes: {},
        fxs: {}
      };
    } else if ( action.type === 'Automaton/UpdateParamValue' ) {
      newState.params[ action.param ].value = action.value;
    } else if ( action.type === 'Automaton/UpdateParamStatus' ) {
      newState.params[ action.param ].status = action.status;
    } else if ( action.type === 'Automaton/UpdateParamNode' ) {
      newState.params[ action.param ].nodes[ action.id ] = jsonCopy( action.node );
    } else if ( action.type === 'Automaton/RemoveParamNode' ) {
      delete newState.params[ action.param ].nodes[ action.id ];
    } else if ( action.type === 'Automaton/UpdateParamFx' ) {
      newState.params[ action.param ].fxs[ action.id ] = jsonCopy( action.fx );
    } else if ( action.type === 'Automaton/RemoveParamFx' ) {
      delete newState.params[ action.param ].fxs[ action.id ];
    } else if ( action.type === 'Automaton/UpdateIsPlaying' ) {
      newState.isPlaying = action.isPlaying;
    } else if ( action.type === 'Automaton/UpdateTime' ) {
      newState.time = action.time;
    } else if ( action.type === 'Automaton/UpdateLength' ) {
      newState.length = action.length;
      newState.resolution = action.resolution;
    } else if ( action.type === 'Automaton/UpdateGUISettings' ) {
      newState.guiSettings = action.settings;
    }
  } );
};
