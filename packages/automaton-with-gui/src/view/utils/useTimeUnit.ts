import { useCallback } from 'react';
import { useSelector } from '../states/store';

export function useTimeUnit(): {
  beatToTime: ( beat: number, isAbsolute?: boolean ) => number,
  timeToBeat: ( time: number, isAbsolute?: boolean ) => number,
  displayToTime: ( value: number, isAbsolute?: boolean ) => number,
  timeToDisplay: ( time: number, isAbsolute?: boolean ) => number,
} {
  const {
    bpm,
    beatOffset,
    useBeatInGUI,
  } = useSelector( ( state ) => ( {
    bpm: state.automaton.guiSettings.bpm,
    beatOffset: state.automaton.guiSettings.beatOffset,
    useBeatInGUI: state.automaton.guiSettings.useBeatInGUI,
  } ) );

  const beatToTime = useCallback(
    ( beat: number, isAbsolute = false ): number => {
      return beat / bpm * 60.0 + ( isAbsolute ? beatOffset : 0.0 );
    },
    [ beatOffset, bpm ]
  );

  const timeToBeat = useCallback(
    ( time: number, isAbsolute = false ): number => {
      return ( time - ( isAbsolute ? beatOffset : 0.0 ) ) * bpm / 60.0;
    },
    [ beatOffset, bpm ]
  );

  const displayToTime = useCallback(
    ( value: number, isAbsolute = false ): number => {
      if ( useBeatInGUI ) {
        return beatToTime( value, isAbsolute );
      } else {
        return value;
      }
    },
    [ beatToTime, useBeatInGUI ]
  );

  const timeToDisplay = useCallback(
    ( time: number, isAbsolute = false ): number => {
      if ( useBeatInGUI ) {
        return timeToBeat( time, isAbsolute );
      } else {
        return time;
      }
    },
    [ timeToBeat, useBeatInGUI ]
  );

  return {
    beatToTime,
    timeToBeat,
    displayToTime,
    timeToDisplay,
  };
}
