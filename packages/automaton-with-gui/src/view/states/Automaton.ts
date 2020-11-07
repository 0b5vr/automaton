import { AutomatonWithGUI } from '../../AutomatonWithGUI';
import { BezierNode, FxDefinition, FxSection } from '@fms-cat/automaton';
import { ChannelStatusCode } from '../../ChannelWithGUI';
import { Action as ContextAction } from './store';
import { CurveStatusCode } from '../../CurveWithGUI';
import { GUISettings, defaultGUISettings } from '../../types/GUISettings';
import { Reducer } from 'redux';
import { Status } from '../../types/Status';
import { WithBypass } from '../../types/WithBypass';
import { WithID } from '../../types/WithID';
import { arraySetDelete } from '../utils/arraySet';
import { jsonCopy } from '../../utils/jsonCopy';
import { produce } from 'immer';
import type { StateChannelItem } from '../../types/StateChannelItem';

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
      items: { [ id: string ]: StateChannelItem };
    };
  };
  curves: {
    [ name: string ]: {
      status: Status<CurveStatusCode> | null;
      length: number;
      path: string;
      nodes: { [ id: string ]: BezierNode & WithID };
      fxs: { [ id: string ]: FxSection & WithBypass & WithID };
    };
  };
  curvesPreview: {
    [ name: string ]: {
      previewTime: number | null;
      previewValue: number | null;
    };
  };
  labels: { [ name: string ]: number };
  loopRegion: { begin: number; end: number } | null;
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
  curves: {},
  curvesPreview: {},
  labels: {},
  loopRegion: null,
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
  item: StateChannelItem;
} | {
  type: 'Automaton/RemoveChannelItem';
  channel: string;
  id: string;
} | {
  type: 'Automaton/CreateCurve';
  curveId: string;
  length: number;
  path: string;
} | {
  type: 'Automaton/RemoveCurve';
  curveId: string;
} | {
  type: 'Automaton/UpdateCurvePath';
  curveId: string;
  path: string;
} | {
  type: 'Automaton/UpdateCurveLength';
  curveId: string;
  length: number;
} | {
  type: 'Automaton/UpdateCurveStatus';
  curveId: string;
  status: Status<CurveStatusCode> | null;
} | {
  type: 'Automaton/UpdateCurvePreviewTimeValue';
  curveId: string;
  time: number;
  value: number;
} | {
  type: 'Automaton/UpdateCurveNode';
  curveId: string;
  id: string;
  node: BezierNode & WithID;
} | {
  type: 'Automaton/RemoveCurveNode';
  curveId: string;
  id: string;
} | {
  type: 'Automaton/UpdateCurveFx';
  curveId: string;
  id: string;
  fx: FxSection & WithBypass & WithID;
} | {
  type: 'Automaton/RemoveCurveFx';
  curveId: string;
  id: string;
} | {
  type: 'Automaton/UpdateCurveLength';
  curveId: string;
  length: number;
} | {
  type: 'Automaton/SetLabel';
  name: string;
  time: number;
} | {
  type: 'Automaton/DeleteLabel';
  name: string;
} | {
  type: 'Automaton/SetLoopRegion';
  loopRegion: { begin: number; end: number } | null;
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
export const reducer: Reducer<State, ContextAction> = ( state = initialState, action ) => {
  return produce( state, ( newState: State ) => {
    if ( action.type === 'Reset' ) {
      newState.channelNames = [];
      newState.channels = {};
      newState.curves = {};
      newState.curvesPreview = {};
      newState.labels = {};
      newState.loopRegion = null;
      newState.fxDefinitions = {};
      newState.isPlaying = false;
      newState.time = 0.0;
      newState.length = 1.0;
      newState.resolution = 10.0;
      newState.shouldSave = false;
      newState.guiSettings = jsonCopy( defaultGUISettings );
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
      newState.curves[ action.curveId ] = {
        status: null,
        length: action.length,
        path: action.path,
        nodes: {},
        fxs: {}
      };
      newState.curvesPreview[ action.curveId ] = {
        previewTime: null,
        previewValue: null
      };
    } else if ( action.type === 'Automaton/RemoveCurve' ) {
      delete newState.curves[ action.curveId ];
    } else if ( action.type === 'Automaton/UpdateCurvePath' ) {
      newState.curves[ action.curveId ].path = action.path;
    } else if ( action.type === 'Automaton/UpdateCurveLength' ) {
      newState.curves[ action.curveId ].length = action.length;
    } else if ( action.type === 'Automaton/UpdateCurveStatus' ) {
      newState.curves[ action.curveId ].status = action.status;
    } else if ( action.type === 'Automaton/UpdateCurvePreviewTimeValue' ) {
      newState.curvesPreview[ action.curveId ].previewTime = action.time;
      newState.curvesPreview[ action.curveId ].previewValue = action.value;
    } else if ( action.type === 'Automaton/UpdateCurveNode' ) {
      newState.curves[ action.curveId ].nodes[ action.id ] = jsonCopy( action.node );
    } else if ( action.type === 'Automaton/RemoveCurveNode' ) {
      delete newState.curves[ action.curveId ].nodes[ action.id ];
    } else if ( action.type === 'Automaton/UpdateCurveFx' ) {
      newState.curves[ action.curveId ].fxs[ action.id ] = jsonCopy( action.fx );
    } else if ( action.type === 'Automaton/RemoveCurveFx' ) {
      delete newState.curves[ action.curveId ].fxs[ action.id ];
    } else if ( action.type === 'Automaton/SetLabel' ) {
      newState.labels[ action.name ] = action.time;
    } else if ( action.type === 'Automaton/DeleteLabel' ) {
      delete newState.labels[ action.name ];
    } else if ( action.type === 'Automaton/SetLoopRegion' ) {
      newState.loopRegion = action.loopRegion;
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
