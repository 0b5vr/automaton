import { BezierNode, FxDefinition, FxSection } from '@fms-cat/automaton';
import { GUISettings, defaultGUISettings } from '../../types/GUISettings';
import { AutomatonWithGUI } from '../../AutomatonWithGUI';
import { ChannelStatus } from '../../ChannelWithGUI';
import { Reducer } from 'redux';
import { WithID } from '../../types/WithID';
import { jsonCopy } from '../../utils/jsonCopy';
import { produce } from 'immer';

// == state ========================================================================================
export interface State {
  instance?: AutomatonWithGUI;
  fxDefinitions: { [ name: string ]: FxDefinition };
  channels: {
    [ name: string ]: {
      value: number;
      status: ChannelStatus | null;
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
  channels: {},
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
  type: 'Automaton/CreateChannel';
  channel: string;
} | {
  type: 'Automaton/UpdateChannelValue';
  channel: string;
  value: number;
} | {
  type: 'Automaton/UpdateChannelStatus';
  channel: string;
  status: ChannelStatus | null;
} | {
  type: 'Automaton/UpdateChannelNode';
  channel: string;
  id: string;
  node: BezierNode & WithID;
} | {
  type: 'Automaton/RemoveChannelNode';
  channel: string;
  id: string;
} | {
  type: 'Automaton/UpdateChannelFx';
  channel: string;
  id: string;
  fx: FxSection & WithID;
} | {
  type: 'Automaton/RemoveChannelFx';
  channel: string;
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
    } else if ( action.type === 'Automaton/CreateChannel' ) {
      newState.channels[ action.channel ] = {
        value: 0.0,
        status: null,
        nodes: {},
        fxs: {}
      };
    } else if ( action.type === 'Automaton/UpdateChannelValue' ) {
      newState.channels[ action.channel ].value = action.value;
    } else if ( action.type === 'Automaton/UpdateChannelStatus' ) {
      newState.channels[ action.channel ].status = action.status;
    } else if ( action.type === 'Automaton/UpdateChannelNode' ) {
      newState.channels[ action.channel ].nodes[ action.id ] = jsonCopy( action.node );
    } else if ( action.type === 'Automaton/RemoveChannelNode' ) {
      delete newState.channels[ action.channel ].nodes[ action.id ];
    } else if ( action.type === 'Automaton/UpdateChannelFx' ) {
      newState.channels[ action.channel ].fxs[ action.id ] = jsonCopy( action.fx );
    } else if ( action.type === 'Automaton/RemoveChannelFx' ) {
      delete newState.channels[ action.channel ].fxs[ action.id ];
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
