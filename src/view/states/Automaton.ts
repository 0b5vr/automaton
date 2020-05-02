import { BezierNode, FxDefinition, FxSection, SerializedChannelItem } from '@fms-cat/automaton';
import { GUISettings, defaultGUISettings } from '../../types/GUISettings';
import { AutomatonWithGUI } from '../../AutomatonWithGUI';
import { ChannelStatusCode } from '../../ChannelWithGUI';
import { CurveStatusCode } from '../../CurveWithGUI';
import { Reducer } from 'redux';
import { Status } from '../../types/Status';
import { WithBypass } from '../../types/WithBypass';
import { WithID } from '../../types/WithID';
import { arraySetDelete } from '../utils/arraySet';
import { jsonCopy } from '../../utils/jsonCopy';
import { produce } from 'immer';

// == state ========================================================================================
export interface State {
  instance?: AutomatonWithGUI;
  fxDefinitions: { [ name: string ]: FxDefinition };
  channelNames: string[];
  channels: {
    [ name: string ]: {
      value: number;
      length: number;
      status: Status<ChannelStatusCode> | null;
      items: { [ id: string ]: Required<SerializedChannelItem> & WithID };
    };
  };
  curves: Array<{
    status: Status<CurveStatusCode> | null;
    length: number;
    path: string;
    nodes: { [ id: string ]: BezierNode & WithID };
    fxs: { [ id: string ]: FxSection & WithBypass & WithID };
  }>;
  curvesPreview: Array<{
    previewTime: number | null;
    previewValue: number | null;
  }>;
  labels: { [ name: string ]: number };
  isPlaying: boolean;
  time: number;
  length: number;
  resolution: number;
  shouldSave: boolean;
  guiSettings: GUISettings;
}

export const initialState: Readonly<State> = {
  channelNames: [],
  channels: {},
  curves: [],
  curvesPreview: [],
  labels: {},
  fxDefinitions: {},
  isPlaying: false,
  time: 0.0,
  length: 1.0,
  resolution: 10.0,
  shouldSave: false,
  guiSettings: jsonCopy( defaultGUISettings )
};

// == action =======================================================================================
export type Action = {
  type: 'Automaton/Purge';
} | {
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
  type: 'Automaton/RemoveChannel';
  channel: string;
} | {
  type: 'Automaton/UpdateChannelValue';
  channel: string;
  value: number;
} | {
  type: 'Automaton/UpdateChannelLength';
  channel: string;
  length: number;
} | {
  type: 'Automaton/UpdateChannelStatus';
  channel: string;
  status: Status<ChannelStatusCode> | null;
} | {
  type: 'Automaton/UpdateChannelItem';
  channel: string;
  id: string;
  item: Required<SerializedChannelItem> & WithID;
} | {
  type: 'Automaton/RemoveChannelItem';
  channel: string;
  id: string;
} | {
  type: 'Automaton/CreateCurve';
  curve: number;
  length: number;
  path: string;
} | {
  type: 'Automaton/RemoveCurve';
  curve: number;
} | {
  type: 'Automaton/UpdateCurvePath';
  curve: number;
  path: string;
} | {
  type: 'Automaton/UpdateCurveLength';
  curve: number;
  length: number;
} | {
  type: 'Automaton/UpdateCurveStatus';
  curve: number;
  status: Status<CurveStatusCode> | null;
} | {
  type: 'Automaton/UpdateCurvePreviewValue';
  curve: number;
  time: number;
  value: number;
} | {
  type: 'Automaton/UpdateCurveNode';
  curve: number;
  id: string;
  node: BezierNode & WithID;
} | {
  type: 'Automaton/RemoveCurveNode';
  curve: number;
  id: string;
} | {
  type: 'Automaton/UpdateCurveFx';
  curve: number;
  id: string;
  fx: FxSection & WithBypass & WithID;
} | {
  type: 'Automaton/RemoveCurveFx';
  curve: number;
  id: string;
} | {
  type: 'Automaton/UpdateCurveLength';
  curve: number;
  length: number;
} | {
  type: 'Automaton/SetLabel';
  name: string;
  time: number;
} | {
  type: 'Automaton/DeleteLabel';
  name: string;
} | {
  type: 'Automaton/UpdateIsPlaying';
  isPlaying: boolean;
} | {
  type: 'Automaton/UpdateTime';
  time: number;
} | {
  type: 'Automaton/ChangeLength';
  length: number;
} | {
  type: 'Automaton/ChangeResolution';
  resolution: number;
} | {
  type: 'Automaton/SetShouldSave';
  shouldSave: boolean;
} | {
  type: 'Automaton/UpdateGUISettings';
  settings: GUISettings;
};

// == reducer ======================================================================================
export const reducer: Reducer<State, Action> = ( state = initialState, action ) => {
  return produce( state, ( newState: State ) => {
    if ( action.type === 'Automaton/Purge' ) {
      newState = jsonCopy( initialState );
    } else if ( action.type === 'Automaton/SetInstance' ) {
      newState.instance = action.automaton;
    } else if ( action.type === 'Automaton/AddFxDefinition' ) {
      newState.fxDefinitions[ action.name ] = action.fxDefinition;
    } else if ( action.type === 'Automaton/CreateChannel' ) {
      newState.channelNames.push( action.channel );
      newState.channelNames = newState.channelNames.sort();

      newState.channels[ action.channel ] = {
        value: 0.0,
        length: 1.0,
        status: null,
        items: {}
      };
    } else if ( action.type === 'Automaton/RemoveChannel' ) {
      arraySetDelete( newState.channelNames, action.channel );
      delete newState.channels[ action.channel ];
    } else if ( action.type === 'Automaton/UpdateChannelValue' ) {
      newState.channels[ action.channel ].value = action.value;
    } else if ( action.type === 'Automaton/UpdateChannelLength' ) {
      newState.channels[ action.channel ].length = action.length;
    } else if ( action.type === 'Automaton/UpdateChannelStatus' ) {
      newState.channels[ action.channel ].status = action.status;
    } else if ( action.type === 'Automaton/UpdateChannelItem' ) {
      newState.channels[ action.channel ].items[ action.id ] = action.item;
    } else if ( action.type === 'Automaton/RemoveChannelItem' ) {
      delete newState.channels[ action.channel ].items[ action.id ];
    } else if ( action.type === 'Automaton/CreateCurve' ) {
      newState.curves[ action.curve ] = {
        status: null,
        length: action.length,
        path: action.path,
        nodes: {},
        fxs: {}
      };
      newState.curvesPreview[ action.curve ] = {
        previewTime: null,
        previewValue: null
      };
    } else if ( action.type === 'Automaton/RemoveCurve' ) {
      newState.curves.splice( action.curve, 1 );
    } else if ( action.type === 'Automaton/UpdateCurvePath' ) {
      newState.curves[ action.curve ].path = action.path;
    } else if ( action.type === 'Automaton/UpdateCurveLength' ) {
      newState.curves[ action.curve ].length = action.length;
    } else if ( action.type === 'Automaton/UpdateCurveStatus' ) {
      newState.curves[ action.curve ].status = action.status;
    } else if ( action.type === 'Automaton/UpdateCurvePreviewValue' ) {
      newState.curvesPreview[ action.curve ].previewTime = action.time;
      newState.curvesPreview[ action.curve ].previewValue = action.value;
    } else if ( action.type === 'Automaton/UpdateCurveNode' ) {
      newState.curves[ action.curve ].nodes[ action.id ] = jsonCopy( action.node );
    } else if ( action.type === 'Automaton/RemoveCurveNode' ) {
      delete newState.curves[ action.curve ].nodes[ action.id ];
    } else if ( action.type === 'Automaton/UpdateCurveFx' ) {
      newState.curves[ action.curve ].fxs[ action.id ] = jsonCopy( action.fx );
    } else if ( action.type === 'Automaton/RemoveCurveFx' ) {
      delete newState.curves[ action.curve ].fxs[ action.id ];
    } else if ( action.type === 'Automaton/SetLabel' ) {
      newState.labels[ action.name ] = action.time;
    } else if ( action.type === 'Automaton/DeleteLabel' ) {
      delete newState.labels[ action.name ];
    } else if ( action.type === 'Automaton/UpdateIsPlaying' ) {
      newState.isPlaying = action.isPlaying;
    } else if ( action.type === 'Automaton/UpdateTime' ) {
      newState.time = action.time;
    } else if ( action.type === 'Automaton/ChangeLength' ) {
      newState.length = action.length;
    } else if ( action.type === 'Automaton/ChangeResolution' ) {
      newState.resolution = action.resolution;
    } else if ( action.type === 'Automaton/SetShouldSave' ) {
      newState.shouldSave = action.shouldSave;
    } else if ( action.type === 'Automaton/UpdateGUISettings' ) {
      newState.guiSettings = action.settings;
    }
  } );
};
