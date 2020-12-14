import { Label } from './Label';
import { Resolution } from '../utils/Resolution';
import { TimeRange } from '../utils/TimeValueRange';
import { useSelector } from '../states/store';
import React from 'react';

const Labels = ( { range, size }: {
  range: TimeRange;
  size: Resolution;
} ): JSX.Element => {
  const { labels } = useSelector( ( state ) => ( {
    labels: state.automaton.labels
  } ) );

  return <>
    { Object.entries( labels ).map( ( [ name, time ] ) => (
      <Label
        key={ name }
        name={ name }
        time={ time }
        range={ range }
        size={ size }
      />
    ) ) }
  </>;
};

export { Labels };
