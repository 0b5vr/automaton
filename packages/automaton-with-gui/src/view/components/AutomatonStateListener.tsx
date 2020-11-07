import { AutomatonWithGUI } from '../../AutomatonWithGUI';
import { ChannelWithGUI } from '../../ChannelWithGUI';
import { CurveWithGUI } from '../../CurveWithGUI';
import { useDispatch } from '../states/store';
import React, { useCallback, useEffect } from 'react';
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

  const initChannelState = useCallback(
    ( name: string, channel: ChannelWithGUI ) => {
      dispatch( {
        type: 'Automaton/CreateChannel',
        channel: name
      } );

      dispatch( {
        type: 'Automaton/UpdateChannelValue',
        channel: name,
        value: channel.currentValue
      } );

      dispatch( {
        type: 'Automaton/UpdateChannelStatus',
        channel: name,
        status: channel.status
      } );

      channel.items.forEach( ( item ) => {
        dispatch( {
          type: 'Automaton/UpdateChannelItem',
          channel: name,
          id: item.$id,
          item: item.serializeGUI()
        } );
      } );

      dispatch( {
        type: 'Automaton/UpdateChannelLength',
        channel: name,
        length: channel.length
      } );

      channel.on( 'changeValue', ( { value } ) => {
        dispatch( {
          type: 'Automaton/UpdateChannelValue',
          channel: name,
          value
        } );
      } );

      channel.on( 'updateStatus', () => {
        dispatch( {
          type: 'Automaton/UpdateChannelStatus',
          channel: name,
          status: channel.status
        } );
      } );

      channel.on( 'createItem', ( { id, item } ) => {
        dispatch( {
          type: 'Automaton/UpdateChannelItem',
          channel: name,
          id,
          item
        } );
      } );

      channel.on( 'updateItem', ( { id, item } ) => {
        dispatch( {
          type: 'Automaton/UpdateChannelItem',
          channel: name,
          id,
          item
        } );
      } );

      channel.on( 'removeItem', ( { id } ) => {
        dispatch( {
          type: 'Automaton/RemoveChannelItem',
          channel: name,
          id
        } );
      } );

      channel.on( 'changeLength', ( { length } ) => {
        dispatch( {
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
      dispatch( {
        type: 'Automaton/CreateCurve',
        curveId,
        length: curve.length,
        path: genCurvePath( curve )
      } );

      dispatch( {
        type: 'Automaton/UpdateCurveStatus',
        curveId,
        status: curve.status
      } );

      curve.nodes.forEach( ( node ) => {
        dispatch( {
          type: 'Automaton/UpdateCurveNode',
          curveId,
          id: node.$id,
          node
        } );
      } );

      curve.fxs.forEach( ( fx ) => {
        dispatch( {
          type: 'Automaton/UpdateCurveFx',
          curveId,
          id: fx.$id,
          fx
        } );
      } );

      curve.on( 'precalc', () => {
        dispatch( {
          type: 'Automaton/UpdateCurvePath',
          curveId,
          path: genCurvePath( curve )
        } );
      } );

      curve.on( 'previewTime', ( { time } ) => {
        dispatch( {
          type: 'Automaton/UpdateCurvePreviewTimeValue',
          curveId,
          time,
          value: curve.getValue( time )
        } );
      } );

      curve.on( 'updateStatus', () => {
        dispatch( {
          type: 'Automaton/UpdateCurveStatus',
          curveId,
          status: curve.status
        } );
      } );

      curve.on( 'createNode', ( { id, node } ) => {
        dispatch( {
          type: 'Automaton/UpdateCurveNode',
          curveId,
          id,
          node
        } );
      } );

      curve.on( 'updateNode', ( { id, node } ) => {
        dispatch( {
          type: 'Automaton/UpdateCurveNode',
          curveId,
          id,
          node
        } );
      } );

      curve.on( 'removeNode', ( { id } ) => {
        dispatch( {
          type: 'Automaton/RemoveCurveNode',
          curveId,
          id
        } );
      } );

      curve.on( 'createFx', ( { id, fx } ) => {
        dispatch( {
          type: 'Automaton/UpdateCurveFx',
          curveId,
          id,
          fx
        } );
      } );

      curve.on( 'updateFx', ( { id, fx } ) => {
        dispatch( {
          type: 'Automaton/UpdateCurveFx',
          curveId,
          id,
          fx
        } );
      } );

      curve.on( 'removeFx', ( { id } ) => {
        dispatch( {
          type: 'Automaton/RemoveCurveFx',
          curveId,
          id
        } );
      } );

      curve.on( 'changeLength', ( { length } ) => {
        dispatch( {
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

      dispatch( {
        type: 'Automaton/UpdateTime',
        time: automaton.time
      } );

      dispatch( {
        type: 'Automaton/ChangeLength',
        length: automaton.length
      } );

      dispatch( {
        type: 'Automaton/ChangeResolution',
        resolution: automaton.resolution
      } );

      dispatch( {
        type: 'Automaton/UpdateIsPlaying',
        isPlaying: automaton.isPlaying
      } );

      Object.entries( automaton.fxDefinitions ).forEach( ( [ name, fxDefinition ] ) => {
        dispatch( {
          type: 'Automaton/AddFxDefinition',
          name,
          fxDefinition
        } );
      } );

      Object.values( automaton.curves ).forEach( ( curve ) => {
        initCurveState( curve.$id, curve );
      } );

      Object.entries( automaton.channels ).forEach( ( [ name, channel ] ) => {
        initChannelState( name, channel );
      } );

      Object.entries( automaton.labels ).forEach( ( [ name, time ] ) => {
        dispatch( {
          type: 'Automaton/SetLabel',
          name,
          time
        } );
      } );

      dispatch( {
        type: 'Automaton/SetLoopRegion',
        loopRegion: automaton.loopRegion
      } );

      dispatch( {
        type: 'Automaton/SetShouldSave',
        shouldSave: automaton.shouldSave
      } );

      dispatch( {
        type: 'Automaton/UpdateGUISettings',
        settings: automaton.guiSettings
      } );
    },
    [ automaton, dispatch, initChannelState, initCurveState ]
  );

  useEffect(
    () => {
      dispatch( {
        type: 'Automaton/SetInstance',
        automaton
      } );

      initAutomaton();

      const handleLoad = automaton.on( 'load', () => {
        initAutomaton();
      } );

      const handleUpdate = automaton.on( 'update', ( { time } ): void => {
        dispatch( {
          type: 'Automaton/UpdateTime',
          time
        } );
      } );

      const handleChangeLength = automaton.on( 'changeLength', ( { length } ) => {
        dispatch( {
          type: 'Automaton/ChangeLength',
          length
        } );
      } );

      const handleChangeResolution = automaton.on( 'changeResolution', ( { resolution } ) => {
        dispatch( {
          type: 'Automaton/ChangeResolution',
          resolution
        } );
      } );

      const handlePlay = automaton.on( 'play', () => {
        dispatch( {
          type: 'Automaton/UpdateIsPlaying',
          isPlaying: true
        } );
      } );

      const handlePause = automaton.on( 'pause', () => {
        dispatch( {
          type: 'Automaton/UpdateIsPlaying',
          isPlaying: false
        } );
      } );

      const handleAddFxDefinitions = automaton.on( 'addFxDefinitions', ( { fxDefinitions } ) => {
        Object.entries( fxDefinitions ).forEach( ( [ name, fxDefinition ] ) => {
          dispatch( {
            type: 'Automaton/AddFxDefinition',
            name,
            fxDefinition
          } );
        } );
      } );

      const handleUpdateGUISettings = automaton.on( 'updateGUISettings', ( { settings } ) => {
        dispatch( {
          type: 'Automaton/UpdateGUISettings',
          settings
        } );
      } );

      const handleCreateChannel = automaton.on( 'createChannel', ( event ) => {
        initChannelState( event.name, event.channel );
      } );

      const handleRemoveChannel = automaton.on( 'removeChannel', ( event ) => {
        dispatch( {
          type: 'Automaton/RemoveChannel',
          channel: event.name
        } );
      } );

      const handleCreateCurve = automaton.on( 'createCurve', ( event ) => {
        initCurveState( event.id, event.curve );
      } );

      const handleRemoveCurve = automaton.on( 'removeCurve', ( event ) => {
        dispatch( {
          type: 'Automaton/RemoveCurve',
          curveId: event.id
        } );
      } );

      const handleChangeShouldSave = automaton.on( 'changeShouldSave', ( event ) => {
        dispatch( {
          type: 'Automaton/SetShouldSave',
          shouldSave: event.shouldSave
        } );
      } );

      const handleSetLabel = automaton.on( 'setLabel', ( { name, time } ) => {
        dispatch( {
          type: 'Automaton/SetLabel',
          name,
          time
        } );
      } );

      const handleDeleteLabel = automaton.on( 'deleteLabel', ( { name } ) => {
        dispatch( {
          type: 'Automaton/DeleteLabel',
          name
        } );
      } );

      const handleSetLoopRegion = automaton.on( 'setLoopRegion', ( { loopRegion } ) => {
        dispatch( {
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
