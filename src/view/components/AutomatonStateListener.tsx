import React, { useEffect } from 'react';
import { Action } from '../states/store';
import { AutomatonWithGUI } from '../../AutomatonWithGUI';
import { ChannelWithGUI } from '../../ChannelWithGUI';
import { CurveWithGUI } from '../../CurveWithGUI';
import { Dispatch } from 'redux';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';

// == utils ========================================================================================
const CURVE_RESO = 240;

function genCurvePath( curve: CurveWithGUI ): string {
  let path = '';

  for ( let i = 0; i <= CURVE_RESO; i ++ ) {
    const t = i / CURVE_RESO * curve.length;
    const v = curve.getValue( t );
    const x = t / curve.length;
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
  const dispatch = useDispatch<Dispatch<Action>>();
  const automaton = props.automaton;

  function createChannel( name: string, channel: ChannelWithGUI ): void {
    dispatch( {
      type: 'Automaton/CreateChannel',
      channel: name
    } );

    dispatch( {
      type: 'Automaton/UpdateChannelValue',
      channel: name,
      value: channel.value
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

    channel.on( 'changeValue', () => {
      dispatch( {
        type: 'Automaton/UpdateChannelValue',
        channel: name,
        value: channel.value
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
  }

  function createCurve( index: number, curve: CurveWithGUI ): void {
    dispatch( {
      type: 'Automaton/CreateCurve',
      curve: index,
      length: curve.length,
      path: genCurvePath( curve )
    } );

    dispatch( {
      type: 'Automaton/UpdateCurveStatus',
      curve: index,
      status: curve.status
    } );

    curve.nodes.forEach( ( node ) => {
      dispatch( {
        type: 'Automaton/UpdateCurveNode',
        curve: index,
        id: node.$id,
        node
      } );
    } );

    curve.fxs.forEach( ( fx ) => {
      dispatch( {
        type: 'Automaton/UpdateCurveFx',
        curve: index,
        id: fx.$id,
        fx
      } );
    } );

    curve.on( 'precalc', () => {
      dispatch( {
        type: 'Automaton/UpdateCurvePath',
        curve: index,
        path: genCurvePath( curve )
      } );
    } );

    curve.on( 'previewValue', ( { time, value } ) => {
      dispatch( {
        type: 'Automaton/UpdateCurvePreviewValue',
        curve: index,
        time,
        value
      } );
    } );

    curve.on( 'updateStatus', () => {
      dispatch( {
        type: 'Automaton/UpdateCurveStatus',
        curve: index,
        status: curve.status
      } );
    } );

    curve.on( 'createNode', ( { id, node } ) => {
      dispatch( {
        type: 'Automaton/UpdateCurveNode',
        curve: index,
        id,
        node
      } );
    } );

    curve.on( 'updateNode', ( { id, node } ) => {
      dispatch( {
        type: 'Automaton/UpdateCurveNode',
        curve: index,
        id,
        node
      } );
    } );

    curve.on( 'removeNode', ( { id } ) => {
      dispatch( {
        type: 'Automaton/RemoveCurveNode',
        curve: index,
        id
      } );
    } );

    curve.on( 'createFx', ( { id, fx } ) => {
      dispatch( {
        type: 'Automaton/UpdateCurveFx',
        curve: index,
        id,
        fx
      } );
    } );

    curve.on( 'updateFx', ( { id, fx } ) => {
      dispatch( {
        type: 'Automaton/UpdateCurveFx',
        curve: index,
        id,
        fx
      } );
    } );

    curve.on( 'removeFx', ( { id } ) => {
      dispatch( {
        type: 'Automaton/RemoveCurveFx',
        curve: index,
        id
      } );
    } );

    curve.on( 'changeLength', ( { length } ) => {
      dispatch( {
        type: 'Automaton/ChangeCurveLength',
        curve: index,
        length
      } );
    } );
  }

  useEffect(
    () => {
      dispatch( {
        type: 'Automaton/SetInstance',
        automaton
      } );

      dispatch( {
        type: 'Automaton/UpdateTime',
        time: automaton.time
      } );

      dispatch( {
        type: 'Automaton/UpdateLength',
        length: automaton.length,
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

      Object.entries( automaton.channels ).forEach( ( [ name, channel ] ) => {
        createChannel( name, channel );
      } );

      Object.values( automaton.curves ).forEach( ( curve, iCurve ) => {
        createCurve( iCurve, curve );
      } );

      automaton.on( 'load', () => {
        dispatch( {
          type: 'History/Drop'
        } );
      } );

      automaton.on( 'update', ( { time } ) => {
        dispatch( {
          type: 'Automaton/UpdateTime',
          time
        } );
      } );

      automaton.on( 'changeLength', ( { length, resolution } ) => {
        dispatch( {
          type: 'Automaton/UpdateLength',
          length,
          resolution
        } );
      } );

      automaton.on( 'play', () => {
        dispatch( {
          type: 'Automaton/UpdateIsPlaying',
          isPlaying: true
        } );
      } );

      automaton.on( 'pause', () => {
        dispatch( {
          type: 'Automaton/UpdateIsPlaying',
          isPlaying: false
        } );
      } );

      automaton.on( 'addFxDefinition', ( { name, fxDefinition } ) => {
        dispatch( {
          type: 'Automaton/AddFxDefinition',
          name,
          fxDefinition
        } );
      } );

      dispatch( {
        type: 'Automaton/UpdateGUISettings',
        settings: automaton.guiSettings
      } );

      automaton.on( 'updateGUISettings', ( { settings } ) => {
        dispatch( {
          type: 'Automaton/UpdateGUISettings',
          settings
        } );
      } );

      automaton.on( 'createChannel', ( event ) => {
        createChannel( event.name, event.channel );
      } );

      automaton.on( 'removeChannel', ( event ) => {
        dispatch( {
          type: 'Automaton/RemoveChannel',
          channel: event.name
        } );
      } );

      automaton.on( 'createCurve', ( event ) => {
        createCurve( event.index, event.curve );
      } );
    },
    [ automaton ]
  );

  return (
    <Root />
  );
};

export { AutomatonStateListener };
