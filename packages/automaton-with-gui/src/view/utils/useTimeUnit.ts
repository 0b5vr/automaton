import { useCallback } from 'react';
import { useSelector } from '../states/store';

export function useTimeUnit(): {
  beatToTime: ( beat: number, isAbsolute?: boolean ) => number,
  timeToBeat: ( time: number, isAbsolute?: boolean ) => number,
  displayToTime: ( value: number, isAbsolute?: boolean ) => number,
  timeToDisplay: ( time: number, isAbsolute?: boolean ) => number,
} {
  const {
    snapBeatBPM,
    useBeatInGUI,
  } = useSelector( ( state ) => ( {
    snapBeatBPM: state.automaton.guiSettings.snapBeatBPM,
    useBeatInGUI: state.automaton.guiSettings.useBeatInGUI,
  } ) );

  const beatToTime = useCallback(
    ( beat: number, isAbsolute = false ): number => {
      return beat / snapBeatBPM * 60.0;
    },
    [ snapBeatBPM ]
  );

  const timeToBeat = useCallback(
    ( time: number, isAbsolute = false ): number => {
      return time * snapBeatBPM / 60.0;
    },
    [ snapBeatBPM ]
  );

  const displayToTime = useCallback(
    ( value: number, isAbsolute = false ): number => {
      if ( useBeatInGUI ) {
        return beatToTime( value );
      } else {
        return value;
      }
    },
    [ beatToTime, useBeatInGUI ]
  );

  const timeToDisplay = useCallback(
    ( time: number, isAbsolute = false ): number => {
      if ( useBeatInGUI ) {
        return timeToBeat( time );
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
