import { Colors } from '../constants/Colors';
import { InspectorHeader } from './InspectorHeader';
import { InspectorHr } from './InspectorHr';
import { InspectorItem } from './InspectorItem';
import { minimizeData } from '../../minimizeData';
import { useSelector } from '../states/store';
import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

// == styles =======================================================================================
const Value = styled.div`
  margin: 0.15rem;
  font-size: 0.7rem;
  line-height: 1em;
`;

const CalculateButton = styled.div`
  margin: 4px auto 0;
  font-size: 0.8rem;
  line-height: 1.2rem;
  width: 128px;
  text-align: center;
  background: ${ Colors.back3 };
  cursor: pointer;

  &:hover {
    background: ${ Colors.back4 };
  }

  &:active {
    background: ${ Colors.back1 };
  }
`;

// == element ======================================================================================
export interface InspectorStatsProps {
  className?: string;
}

const InspectorStats = (): JSX.Element | null => {
  const [ filesize, setFilesize ] = useState<number | null>( null );
  const [ filesizeMin, setFilesizeMin ] = useState<number | null>( null );

  const {
    automaton,
    channelsCount,
    channelItemsCount,
    curvesCount,
    curvesLength,
    fxDefsCount,
  } = useSelector( ( state ) => ( {
    automaton: state.automaton.instance,
    channelsCount: Object.keys( state.automaton.channels ).length,
    channelItemsCount: Object.values( state.automaton.channels ).reduce(
      ( prev, channel ) => prev + Object.keys( channel.items ).length,
      0,
    ),
    curvesCount: Object.keys( state.automaton.curves ).length,
    curvesLength: Object.values( state.automaton.curves ).reduce(
      ( prev, curve ) => prev + curve.length,
      0,
    ),
    fxDefsCount: Object.keys( state.automaton.fxDefinitions ).length,
  } ) );

  const handleCalculateFilesize = useCallback(
    () => {
      if ( !automaton ) { return; }

      const serialized = automaton.serialize();
      setFilesize( JSON.stringify( serialized ).length );
      const minimizeOptions = {
        precisionTime: automaton.guiSettings.minimizedPrecisionTime,
        precisionValue: automaton.guiSettings.minimizedPrecisionValue
      };
      const minimized = minimizeData( serialized, minimizeOptions );
      setFilesizeMin( JSON.stringify( minimized ).length );
    },
    [ automaton ]
  );

  return ( automaton && <>
    <InspectorHeader text="Project Stats" />

    <InspectorHr />

    <InspectorItem
      name="Channels"
      description="Channels exists in this project."
    >
      <Value>
        { channelsCount.toLocaleString() }
      </Value>
    </InspectorItem>

    <InspectorItem
      name="Channel Items"
      description="Items of channels exists in this project."
    >
      <Value>
        { channelItemsCount.toLocaleString() }
      </Value>
    </InspectorItem>

    <InspectorItem
      name="Curves"
      description="Curves exists in this project."
    >
      <Value>
        { curvesCount.toLocaleString() }
      </Value>
    </InspectorItem>

    <InspectorItem
      name="Curves Length"
      description="Total length of curves."
    >
      <Value>
        { `${ curvesLength.toLocaleString() } sec` }
      </Value>
    </InspectorItem>

    <InspectorItem
      name="Fx Definitions"
      description="Fx definitions loaded in this project."
    >
      <Value>
        { fxDefsCount.toLocaleString() }
      </Value>
    </InspectorItem>

    <InspectorHr />

    <InspectorItem
      name="Filesize"
      description="The size of its serialized data."
    >
      <Value>
        { filesize ? `${ filesize.toLocaleString() } bytes` : '----' }
      </Value>
    </InspectorItem>

    <InspectorItem
      name="Filesize (min)"
      description="The size of its minimized serialized data."
    >
      <Value>
        { filesizeMin ? `${ filesizeMin.toLocaleString() } bytes` : '----' }
      </Value>
    </InspectorItem>

    <CalculateButton
      data-stalker="Calculate the size of its serialized data."
      onClick={ handleCalculateFilesize }
    >
      Calculate Filesize
    </CalculateButton>
  </> ) ?? null;
};

export { InspectorStats };
