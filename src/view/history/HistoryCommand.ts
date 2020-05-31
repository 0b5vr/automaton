import { BezierNode, FxSection, SerializedChannel, SerializedCurve } from '@fms-cat/automaton';
import { AutomatonWithGUI } from '../../AutomatonWithGUI';
import type { StateChannelItem } from '../../types/StateChannelItem';
import { WithBypass } from '../../types/WithBypass';
import { WithID } from '../../types/WithID';

// == commands =====================================================================================
export type HistoryCommand = {
  type: 'automaton/createChannel';
  channel: string;
  data?: SerializedChannel;
} | {
  type: 'automaton/removeChannel';
  channel: string;
  data: SerializedChannel;
} | {
  type: 'automaton/renameChannel';
  name: string;
  newName: string;
  data: SerializedChannel;
} | {
  type: 'automaton/createCurve';
  data: SerializedCurve & WithID;
} | {
  type: 'automaton/removeCurve';
  data: SerializedCurve & WithID;
} | {
  type: 'automaton/createLabel';
  name: string;
  time: number;
} | {
  type: 'automaton/moveLabel';
  name: string;
  time: number;
  timePrev: number;
} | {
  type: 'automaton/deleteLabel';
  name: string;
  timePrev: number;
} | {
  type: 'channel/createItemFromData';
  channel: string;
  data: StateChannelItem;
} | {
  type: 'channel/removeItem';
  channel: string;
  data: StateChannelItem;
} | {
  type: 'channel/moveItem';
  channel: string;
  item: string;
  time: number;
  timePrev: number;
} | {
  type: 'channel/changeItemValue';
  channel: string;
  item: string;
  value: number;
  valuePrev: number;
} | {
  type: 'channel/changeItemReset';
  channel: string;
  item: string;
  reset: boolean;
  resetPrev: boolean;
} | {
  type: 'channel/resizeItem';
  channel: string;
  item: string;
  length: number;
  lengthPrev: number;
  stretch: boolean;
} | {
  type: 'channel/resizeItemByLeft';
  channel: string;
  item: string;
  length: number;
  lengthPrev: number;
  stretch: boolean;
} | {
  type: 'channel/changeCurveSpeedAndOffset';
  channel: string;
  item: string;
  speed: number;
  speedPrev: number;
  offset: number;
  offsetPrev: number;
} | {
  type: 'channel/changeCurveAmp';
  channel: string;
  item: string;
  amp: number;
  ampPrev: number;
} | {
  type: 'curve/createNodeFromData';
  curveId: string;
  data: BezierNode & WithID;
} | {
  type: 'curve/removeNode';
  curveId: string;
  data: BezierNode & WithID;
} | {
  type: 'curve/moveNodeTime';
  curveId: string;
  node: string;
  time: number;
  timePrev: number;
} | {
  type: 'curve/moveNodeValue';
  curveId: string;
  node: string;
  value: number;
  valuePrev: number;
} | {
  type: 'curve/moveHandleTime';
  curveId: string;
  node: string;
  dir: 'in' | 'out';
  time: number;
  timePrev: number;
} | {
  type: 'curve/moveHandleValue';
  curveId: string;
  node: string;
  dir: 'in' | 'out';
  value: number;
  valuePrev: number;
} | {
  type: 'curve/createFxFromData';
  curveId: string;
  data: FxSection & WithBypass & WithID;
} | {
  type: 'curve/removeFx';
  curveId: string;
  data: FxSection & WithBypass & WithID;
} | {
  type: 'curve/moveFx';
  curveId: string;
  fx: string;
  time: number;
  timePrev: number;
} | {
  type: 'curve/changeFxRow';
  curveId: string;
  fx: string;
  row: number;
  rowPrev: number;
} | {
  type: 'curve/forceMoveFx';
  curveId: string;
  fx: string;
  time: number;
  timePrev: number;
  row: number;
  rowPrev: number;
} | {
  type: 'curve/resizeFx';
  curveId: string;
  fx: string;
  length: number;
  lengthPrev: number;
} | {
  type: 'curve/resizeFxByLeft';
  curveId: string;
  fx: string;
  length: number;
  lengthPrev: number;
} | {
  type: 'curve/bypassFx';
  curveId: string;
  fx: string;
  bypass: boolean;
} | {
  type: 'curve/changeFxParam';
  curveId: string;
  fx: string;
  key: string;
  value: any;
  valuePrev: any;
};

// == parser =======================================================================================
export function parseHistoryCommand( command: HistoryCommand ): {
  undo: ( automaton: AutomatonWithGUI ) => void;
  redo: ( automaton: AutomatonWithGUI ) => void;
} {
  if ( command.type === 'automaton/createChannel' ) {
    return {
      undo: ( automaton ) => automaton.removeChannel( command.channel ),
      redo: ( automaton ) => automaton.createChannel( command.channel, command.data )
    };
  } else if ( command.type === 'automaton/removeChannel' ) {
    return {
      undo: ( automaton ) => automaton.createOrOverwriteChannel( command.channel, command.data ),
      redo: ( automaton ) => automaton.removeChannel( command.channel )
    };
  } else if ( command.type === 'automaton/renameChannel' ) {
    return {
      undo: ( automaton ) => {
        automaton.removeChannel( command.newName );
        automaton.createOrOverwriteChannel( command.name, command.data );
      },
      redo: ( automaton ) => {
        automaton.removeChannel( command.name );
        automaton.createChannel( command.newName, command.data );
      }
    };
  } else if ( command.type === 'automaton/createCurve' ) {
    return {
      undo: ( automaton ) => automaton.removeCurve( command.data.$id ),
      redo: ( automaton ) => automaton.createCurve( command.data ),
    };
  } else if ( command.type === 'automaton/removeCurve' ) {
    return {
      undo: ( automaton ) => automaton.createCurve( command.data ),
      redo: ( automaton ) => automaton.removeCurve( command.data.$id ),
    };
  } else if ( command.type === 'automaton/createLabel' ) {
    return {
      undo: ( automaton ) => automaton.deleteLabel( command.name ),
      redo: ( automaton ) => automaton.setLabel( command.name, command.time )
    };
  } else if ( command.type === 'automaton/moveLabel' ) {
    return {
      undo: ( automaton ) => automaton.setLabel( command.name, command.timePrev ),
      redo: ( automaton ) => automaton.setLabel( command.name, command.time )
    };
  } else if ( command.type === 'automaton/deleteLabel' ) {
    return {
      undo: ( automaton ) => automaton.setLabel( command.name, command.timePrev ),
      redo: ( automaton ) => automaton.deleteLabel( command.name )
    };
  } else if ( command.type === 'channel/createItemFromData' ) {
    return {
      undo: ( automaton ) => automaton.getChannel( command.channel )!
        .removeItem( command.data.$id ),
      redo: ( automaton ) => automaton.getChannel( command.channel )!
        .createItemFromData( command.data )
    };
  } else if ( command.type === 'channel/removeItem' ) {
    return {
      undo: ( automaton ) => automaton.getChannel( command.channel )!
        .createItemFromData( command.data ),
      redo: ( automaton ) => automaton.getChannel( command.channel )!
        .removeItem( command.data.$id )
    };
  } else if ( command.type === 'channel/moveItem' ) {
    return {
      undo: ( automaton ) => automaton.getChannel( command.channel )!
        .moveItem( command.item, command.timePrev ),
      redo: ( automaton ) => automaton.getChannel( command.channel )!
        .moveItem( command.item, command.time )
    };
  } else if ( command.type === 'channel/changeItemValue' ) {
    return {
      undo: ( automaton ) => automaton.getChannel( command.channel )!
        .changeItemValue( command.item, command.valuePrev ),
      redo: ( automaton ) => automaton.getChannel( command.channel )!
        .changeItemValue( command.item, command.value )
    };
  } else if ( command.type === 'channel/changeItemReset' ) {
    return {
      undo: ( automaton ) => automaton.getChannel( command.channel )!
        .changeItemReset( command.item, command.resetPrev ),
      redo: ( automaton ) => automaton.getChannel( command.channel )!
        .changeItemReset( command.item, command.reset )
    };
  } else if ( command.type === 'channel/resizeItem' ) {
    return {
      undo: ( automaton ) => automaton.getChannel( command.channel )!
        .resizeItem( command.item, command.lengthPrev, command.stretch ),
      redo: ( automaton ) => automaton.getChannel( command.channel )!
        .resizeItem( command.item, command.length, command.stretch )
    };
  } else if ( command.type === 'channel/resizeItemByLeft' ) {
    return {
      undo: ( automaton ) => automaton.getChannel( command.channel )!
        .resizeItemByLeft( command.item, command.lengthPrev, command.stretch ),
      redo: ( automaton ) => automaton.getChannel( command.channel )!
        .resizeItemByLeft( command.item, command.length, command.stretch )
    };
  } else if ( command.type === 'channel/changeCurveSpeedAndOffset' ) {
    return {
      undo: ( automaton ) => automaton.getChannel( command.channel )!
        .changeCurveSpeedAndOffset( command.item, command.speedPrev, command.offsetPrev ),
      redo: ( automaton ) => automaton.getChannel( command.channel )!
        .changeCurveSpeedAndOffset( command.item, command.speed, command.offset )
    };
  } else if ( command.type === 'channel/changeCurveAmp' ) {
    return {
      undo: ( automaton ) => automaton.getChannel( command.channel )!
        .changeCurveAmp( command.item, command.ampPrev ),
      redo: ( automaton ) => automaton.getChannel( command.channel )!
        .changeCurveAmp( command.item, command.amp )
    };
  } else if ( command.type === 'curve/createNodeFromData' ) {
    return {
      undo: ( automaton ) => automaton.getCurveById( command.curveId )!
        .removeNode( command.data.$id ),
      redo: ( automaton ) => automaton.getCurveById( command.curveId )!
        .createNodeFromData( command.data )
    };
  } else if ( command.type === 'curve/removeNode' ) {
    return {
      undo: ( automaton ) => automaton.getCurveById( command.curveId )!
        .createNodeFromData( command.data ),
      redo: ( automaton ) => automaton.getCurveById( command.curveId )!
        .removeNode( command.data.$id )
    };
  } else if ( command.type === 'curve/moveNodeTime' ) {
    return {
      undo: ( automaton ) => automaton.getCurveById( command.curveId )!
        .moveNodeTime( command.node, command.timePrev ),
      redo: ( automaton ) => automaton.getCurveById( command.curveId )!
        .moveNodeTime( command.node, command.time )
    };
  } else if ( command.type === 'curve/moveNodeValue' ) {
    return {
      undo: ( automaton ) => automaton.getCurveById( command.curveId )!
        .moveNodeValue( command.node, command.valuePrev ),
      redo: ( automaton ) => automaton.getCurveById( command.curveId )!
        .moveNodeValue( command.node, command.value )
    };
  } else if ( command.type === 'curve/moveHandleTime' ) {
    return {
      undo: ( automaton ) => automaton.getCurveById( command.curveId )!
        .moveHandleTime( command.node, command.dir, command.timePrev ),
      redo: ( automaton ) => automaton.getCurveById( command.curveId )!
        .moveHandleTime( command.node, command.dir, command.time )
    };
  } else if ( command.type === 'curve/moveHandleValue' ) {
    return {
      undo: ( automaton ) => automaton.getCurveById( command.curveId )!
        .moveHandleValue( command.node, command.dir, command.valuePrev ),
      redo: ( automaton ) => automaton.getCurveById( command.curveId )!
        .moveHandleValue( command.node, command.dir, command.value )
    };
  } else if ( command.type === 'curve/createFxFromData' ) {
    return {
      undo: ( automaton ) => automaton.getCurveById( command.curveId )!
        .removeFx( command.data.$id ),
      redo: ( automaton ) => automaton.getCurveById( command.curveId )!
        .createFxFromData( command.data )
    };
  } else if ( command.type === 'curve/removeFx' ) {
    return {
      undo: ( automaton ) => automaton.getCurveById( command.curveId )!
        .createFxFromData( command.data ),
      redo: ( automaton ) => automaton.getCurveById( command.curveId )!
        .removeFx( command.data.$id )
    };
  } else if ( command.type === 'curve/moveFx' ) {
    return {
      undo: ( automaton ) => automaton.getCurveById( command.curveId )!
        .moveFx( command.fx, command.timePrev ),
      redo: ( automaton ) => automaton.getCurveById( command.curveId )!
        .moveFx( command.fx, command.time )
    };
  } else if ( command.type === 'curve/changeFxRow' ) {
    return {
      undo: ( automaton ) => automaton.getCurveById( command.curveId )!
        .changeFxRow( command.fx, command.rowPrev ),
      redo: ( automaton ) => automaton.getCurveById( command.curveId )!
        .changeFxRow( command.fx, command.row )
    };
  } else if ( command.type === 'curve/forceMoveFx' ) {
    return {
      undo: ( automaton ) => automaton.getCurveById( command.curveId )!
        .forceMoveFx( command.fx, command.timePrev, command.rowPrev ),
      redo: ( automaton ) => automaton.getCurveById( command.curveId )!
        .forceMoveFx( command.fx, command.time, command.row )
    };
  } else if ( command.type === 'curve/resizeFx' ) {
    return {
      undo: ( automaton ) => automaton.getCurveById( command.curveId )!
        .resizeFx( command.fx, command.lengthPrev ),
      redo: ( automaton ) => automaton.getCurveById( command.curveId )!
        .resizeFx( command.fx, command.length )
    };
  } else if ( command.type === 'curve/resizeFxByLeft' ) {
    return {
      undo: ( automaton ) => automaton.getCurveById( command.curveId )!
        .resizeFxByLeft( command.fx, command.lengthPrev ),
      redo: ( automaton ) => automaton.getCurveById( command.curveId )!
        .resizeFxByLeft( command.fx, command.length )
    };
  } else if ( command.type === 'curve/bypassFx' ) {
    return {
      undo: ( automaton ) => automaton.getCurveById( command.curveId )!
        .bypassFx( command.fx, !command.bypass ),
      redo: ( automaton ) => automaton.getCurveById( command.curveId )!
        .bypassFx( command.fx, command.bypass ),
    };
  } else if ( command.type === 'curve/changeFxParam' ) {
    return {
      undo: ( automaton ) => automaton.getCurveById( command.curveId )!
        .changeFxParam( command.fx, command.key, command.valuePrev ),
      redo: ( automaton ) => automaton.getCurveById( command.curveId )!
        .changeFxParam( command.fx, command.key, command.value )
    };
  } else {
    throw new Error( 'Something went wrong' );
  }
}

// == helper =======================================================================================
export function performUndo(
  automaton: AutomatonWithGUI,
  commands: HistoryCommand[]
): void {
  commands.concat().reverse().forEach( ( command ) => {
    parseHistoryCommand( command ).undo( automaton );
  } );
}

export function performRedo(
  automaton: AutomatonWithGUI,
  commands: HistoryCommand[]
): void {
  commands.forEach( ( command ) => {
    parseHistoryCommand( command ).redo( automaton );
  } );
}
