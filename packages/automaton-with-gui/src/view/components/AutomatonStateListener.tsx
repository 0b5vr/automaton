import { Action, useDispatch } from '../states/store';
import { AutomatonWithGUI } from '../../AutomatonWithGUI';
import { ChannelWithGUI } from '../../ChannelWithGUI';
import { CurveWithGUI } from '../../CurveWithGUI';
import { batch } from 'react-redux';
import { useAnimationFrame } from '../utils/useAnimationFrame';
import React, { useCallback, useEffect, useRef } from 'react';
import styled from 'styled-components';

// == utils ========================================================================================
const CURVE_RESO = 240;

function genCurvePath( curve: CurveWithGUI ): string {
  let path = '';

  for ( let i = 0; i <= CURVE_RESO; i ++ ) {
    const x = i / CURVE_RESO;
    const t = x * curve.length;
    const v = curve.getValue( t );
    const y = v;
    path += `${ x },${ y } `;
  }

  return path;
}

// == styles =======================================================================================
const Root = styled.div`
  display: none;
`;

// == element ======================================================================================
export interface AutomatonStateListenerProps {
  automaton: AutomatonWithGUI;
}

const AutomatonStateListener = ( props: AutomatonStateListenerProps ): JSX.Element => {
  const dispatch = useDispatch();
  const automaton = props.automaton;

  const refAccumActions = useRef<Action[]>( [] );
  useAnimationFrame(
    () => {
      if ( refAccumActions.current.length > 0 ) {
        batch( () => {
          refAccumActions.current.forEach( ( action ) => dispatch( action ) );
        } );
        refAccumActions.current = [];
      }
    },
    [ dispatch ],
  );

  const initChannelState = useCallback(
    ( name: string, channel: ChannelWithGUI, index: number ) => {
      refAccumActions.current.push( {
        type: 'Automaton/CreateChannel',
        channel: name,
        index,
      } );

      refAccumActions.current.push( {
        type: 'Automaton/UpdateChannelValue',
        channel: name,
        value: channel.currentValue
      } );

      refAccumActions.current.push( {
        type: 'Automaton/UpdateChannelStatus',
        channel: name,
        status: channel.status
      } );

      channel.items.forEach( ( item ) => {
        refAccumActions.current.push( {
          type: 'Automaton/UpdateChannelItem',
          channel: name,
          id: item.$id,
          item: item.serializeGUI()
        } );
      } );

      refAccumActions.current.push( {
        type: 'Automaton/UpdateChannelLength',
        channel: name,
        length: channel.length
      } );

      channel.on( 'changeValue', ( { value } ) => {
        refAccumActions.current.push( {
          type: 'Automaton/UpdateChannelValue',
          channel: name,
          value
        } );
      } );

      channel.on( 'updateStatus', () => {
        refAccumActions.current.push( {
          type: 'Automaton/UpdateChannelStatus',
          channel: name,
          status: channel.status
        } );
      } );

      channel.on( 'createItem', ( { id, item } ) => {
        refAccumActions.current.push( {
          type: 'Automaton/UpdateChannelItem',
          channel: name,
          id,
          item
        } );
      } );

      channel.on( 'updateItem', ( { id, item } ) => {
        refAccumActions.current.push( {
          type: 'Automaton/UpdateChannelItem',
          channel: name,
          id,
          item
        } );
      } );

      channel.on( 'removeItem', ( { id } ) => {
        dispatch( {
          type: 'Timeline/SelectItemsSub',
          items: [ { id } ],
        } );

        refAccumActions.current.push( {
          type: 'Automaton/RemoveChannelItem',
          channel: name,
          id
        } );
      } );

      channel.on( 'changeLength', ( { length } ) => {
        refAccumActions.current.push( {
          type: 'Automaton/UpdateChannelLength',
          channel: name,
          length,
        } );
      } );
    },
    [ dispatch ]
  );

  const initCurveState = useCallback(
    ( curveId: string, curve: CurveWithGUI ) => {
      refAccumActions.current.push( {
        type: 'Automaton/CreateCurve',
        curveId,
        length: curve.length,
        path: genCurvePath( curve )
      } );

      refAccumActions.current.push( {
        type: 'Automaton/UpdateCurveStatus',
        curveId,
        status: curve.status
      } );

      curve.nodes.forEach( ( node ) => {
        refAccumActions.current.push( {
          type: 'Automaton/UpdateCurveNode',
          curveId,
          id: node.$id,
          node
        } );
      } );

      curve.fxs.forEach( ( fx ) => {
        refAccumActions.current.push( {
          type: 'Automaton/UpdateCurveFx',
          curveId,
          id: fx.$id,
          fx
        } );
      } );

      curve.on( 'precalc', () => {
        refAccumActions.current.push( {
          type: 'Automaton/UpdateCurvePath',
          curveId,
          path: genCurvePath( curve )
        } );
      } );

      curve.on( 'previewTime', ( { time, value, itemTime, itemSpeed, itemOffset } ) => {
        refAccumActions.current.push( {
          type: 'Automaton/UpdateCurvePreviewTimeValue',
          curveId,
          time,
          value,
          itemTime,
          itemSpeed,
          itemOffset,
        } );
      } );

      curve.on( 'updateStatus', () => {
        refAccumActions.current.push( {
          type: 'Automaton/UpdateCurveStatus',
          curveId,
          status: curve.status
        } );
      } );

      curve.on( 'createNode', ( { id, node } ) => {
        refAccumActions.current.push( {
          type: 'Automaton/UpdateCurveNode',
          curveId,
          id,
          node
        } );
      } );

      curve.on( 'updateNode', ( { id, node } ) => {
        refAccumActions.current.push( {
          type: 'Automaton/UpdateCurveNode',
          curveId,
          id,
          node
        } );
      } );

      curve.on( 'removeNode', ( { id } ) => {
        dispatch( {
          type: 'CurveEditor/SelectItemsSub',
          nodes: [ id ],
        } );

        refAccumActions.current.push( {
          type: 'Automaton/RemoveCurveNode',
          curveId,
          id
        } );
      } );

      curve.on( 'createFx', ( { id, fx } ) => {
        refAccumActions.current.push( {
          type: 'Automaton/UpdateCurveFx',
          curveId,
          id,
          fx
        } );
      } );

      curve.on( 'updateFx', ( { id, fx } ) => {
        refAccumActions.current.push( {
          type: 'Automaton/UpdateCurveFx',
          curveId,
          id,
          fx
        } );
      } );

      curve.on( 'removeFx', ( { id } ) => {
        dispatch( {
          type: 'CurveEditor/SelectItemsSub',
          fxs: [ id ],
        } );

        refAccumActions.current.push( {
          type: 'Automaton/RemoveCurveFx',
          curveId,
          id
        } );
      } );

      curve.on( 'changeLength', ( { length } ) => {
        refAccumActions.current.push( {
          type: 'Automaton/UpdateCurveLength',
          curveId,
          length,
        } );
      } );
    },
    [ dispatch ]
  );

  const initAutomaton = useCallback(
    () => {
      dispatch( {
        type: 'History/Drop'
      } );

      dispatch( {
        type: 'ContextMenu/Close'
      } );

      dispatch( {
        type: 'Reset'
      } );

      refAccumActions.current.push( {
        type: 'Automaton/UpdateTime',
        time: automaton.time
      } );

      refAccumActions.current.push( {
        type: 'Automaton/ChangeLength',
        length: automaton.length
      } );

      refAccumActions.current.push( {
        type: 'Automaton/ChangeResolution',
        resolution: automaton.resolution
      } );

      refAccumActions.current.push( {
        type: 'Automaton/UpdateIsPlaying',
        isPlaying: automaton.isPlaying
      } );

      Object.entries( automaton.fxDefinitions ).forEach( ( [ name, fxDefinition ] ) => {
        refAccumActions.current.push( {
          type: 'Automaton/AddFxDefinition',
          name,
          fxDefinition
        } );
      } );

      automaton.curves.forEach( ( curve ) => {
        initCurveState( curve.$id, curve );
      } );

      automaton.channels.forEach( ( channel, index ) => {
        const name = automaton.mapNameToChannel.getFromValue( channel )!;
        initChannelState( name, channel, index );
      } );

      Object.entries( automaton.labels ).forEach( ( [ name, time ] ) => {
        refAccumActions.current.push( {
          type: 'Automaton/SetLabel',
          name,
          time
        } );
      } );

      refAccumActions.current.push( {
        type: 'Automaton/SetLoopRegion',
        loopRegion: automaton.loopRegion
      } );

      refAccumActions.current.push( {
        type: 'Automaton/SetShouldSave',
        shouldSave: automaton.shouldSave
      } );

      refAccumActions.current.push( {
        type: 'Automaton/UpdateGUISettings',
        settings: automaton.guiSettings
      } );
    },
    [ automaton, dispatch, initChannelState, initCurveState ],
  );

  useEffect(
    () => {
      refAccumActions.current.push( {
        type: 'Automaton/SetInstance',
        automaton
      } );

      initAutomaton();

      const handleLoad = automaton.on( 'load', () => {
        initAutomaton();
      } );

      const handleUpdate = automaton.on( 'update', ( { time } ): void => {
        refAccumActions.current.push( {
          type: 'Automaton/UpdateTime',
          time
        } );
      } );

      const handleChangeLength = automaton.on( 'changeLength', ( { length } ) => {
        refAccumActions.current.push( {
          type: 'Automaton/ChangeLength',
          length
        } );
      } );

      const handleChangeResolution = automaton.on( 'changeResolution', ( { resolution } ) => {
        refAccumActions.current.push( {
          type: 'Automaton/ChangeResolution',
          resolution
        } );
      } );

      const handlePlay = automaton.on( 'play', () => {
        refAccumActions.current.push( {
          type: 'Automaton/UpdateIsPlaying',
          isPlaying: true
        } );
      } );

      const handlePause = automaton.on( 'pause', () => {
        refAccumActions.current.push( {
          type: 'Automaton/UpdateIsPlaying',
          isPlaying: false
        } );
      } );

      const handleAddFxDefinitions = automaton.on( 'addFxDefinitions', ( { fxDefinitions } ) => {
        Object.entries( fxDefinitions ).forEach( ( [ name, fxDefinition ] ) => {
          refAccumActions.current.push( {
            type: 'Automaton/AddFxDefinition',
            name,
            fxDefinition
          } );
        } );
      } );

      const handleUpdateGUISettings = automaton.on( 'updateGUISettings', ( { settings } ) => {
        refAccumActions.current.push( {
          type: 'Automaton/UpdateGUISettings',
          settings
        } );
      } );

      const handleCreateChannel = automaton.on( 'createChannel', ( event ) => {
        initChannelState( event.name, event.channel, event.index );
      } );

      const handleRemoveChannel = automaton.on( 'removeChannel', ( event ) => {
        dispatch( {
          type: 'Timeline/UnselectChannelIfSelected',
          channel: event.name,
        } );

        refAccumActions.current.push( {
          type: 'Automaton/RemoveChannel',
          channel: event.name
        } );
      } );

      const handleReorderChannels = automaton.on( 'reorderChannels', ( event ) => {
        refAccumActions.current.push( {
          type: 'Automaton/ReorderChannels',
          index: event.index,
          length: event.length,
          newIndex: event.newIndex,
        } );
      } );

      const handleCreateCurve = automaton.on( 'createCurve', ( event ) => {
        initCurveState( event.id, event.curve );
      } );

      const handleRemoveCurve = automaton.on( 'removeCurve', ( event ) => {
        dispatch( {
          type: 'CurveEditor/SelectCurve',
          curveId: null,
        } );

        refAccumActions.current.push( {
          type: 'Automaton/RemoveCurve',
          curveId: event.id
        } );
      } );

      const handleChangeShouldSave = automaton.on( 'changeShouldSave', ( event ) => {
        refAccumActions.current.push( {
          type: 'Automaton/SetShouldSave',
          shouldSave: event.shouldSave
        } );
      } );

      const handleSetLabel = automaton.on( 'setLabel', ( { name, time } ) => {
        refAccumActions.current.push( {
          type: 'Automaton/SetLabel',
          name,
          time
        } );
      } );

      const handleDeleteLabel = automaton.on( 'deleteLabel', ( { name } ) => {
        dispatch( {
          type: 'Timeline/SelectLabelsSub',
          labels: [ name ],
        } );

        refAccumActions.current.push( {
          type: 'Automaton/DeleteLabel',
          name
        } );
      } );

      const handleSetLoopRegion = automaton.on( 'setLoopRegion', ( { loopRegion } ) => {
        refAccumActions.current.push( {
          type: 'Automaton/SetLoopRegion',
          loopRegion
        } );
      } );

      return () => {
        automaton.off( 'load', handleLoad );
        automaton.off( 'update', handleUpdate );
        automaton.off( 'changeLength', handleChangeLength );
        automaton.off( 'changeResolution', handleChangeResolution );
        automaton.off( 'play', handlePlay );
        automaton.off( 'pause', handlePause );
        automaton.off( 'addFxDefinitions', handleAddFxDefinitions );
        automaton.off( 'updateGUISettings', handleUpdateGUISettings );
        automaton.off( 'createChannel', handleCreateChannel );
        automaton.off( 'removeChannel', handleRemoveChannel );
        automaton.off( 'reorderChannels', handleReorderChannels );
        automaton.off( 'createCurve', handleCreateCurve );
        automaton.off( 'removeCurve', handleRemoveCurve );
        automaton.off( 'setLabel', handleSetLabel );
        automaton.off( 'deleteLabel', handleDeleteLabel );
        automaton.off( 'setLoopRegion', handleSetLoopRegion );
        automaton.off( 'changeShouldSave', handleChangeShouldSave );
      };
    },
    [ automaton, dispatch, initAutomaton, initChannelState, initCurveState ]
  );

  return (
    <Root />
  );
};

export { AutomatonStateListener };
