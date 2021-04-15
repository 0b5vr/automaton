import { Colors } from '../constants/Colors';
import { Icons } from '../icons/Icons';
import { Metrics } from '../constants/Metrics';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { useSave } from '../gui-operation-hooks/useSave';
import React, { useCallback, useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';

// == CONFIDENTIAL - DO NOT SHARE ==================================================================
const funnyTexts = [
  'oh no',
  'ded',
  'why',
  'I\'m so sorry tbh',
  'Said you should save frequently',
  'Software development is hard',
  'Did you know this? This fancy error screen is the part I have to pay an extreme care to prevent the entire GUI from crashing',
];

// == styles =======================================================================================
const keyframe = keyframes`
  0% {
    background-position: 0 0;
  }

  100% {
    background-position: 0 40px;
  }
`;

const BiggerOne = styled.div`
`;

const SmallerOne = styled.div`
  font-size: 10px;
`;

const Box = styled.div`
  padding: 8px 16px;
  background: ${ Colors.back1 };
  color: ${ Colors.error };
  text-align: center;
  box-shadow: 0px 0px 16px 0px ${ Colors.black }88;
`;

const Button = styled.img`
  width: ${ Metrics.headerHeight - 4 }px;
  height: ${ Metrics.headerHeight - 4 }px;
  fill: ${ Colors.errorBright };
  filter: drop-hadow( 0px 0px 4px ${ Colors.black }88 );
  cursor: pointer;
  margin: 2px 4px;

  &:hover {
    opacity: 0.8;
  }
`;

const Buttons = styled.div`
  position: absolute;
  right: 0;
  top: 0;
  display: flex;
`;

const FallbackRoot = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: ${ Colors.back1 };
  background-color: ${ Colors.back1 };
  background-size: 40px 40px;
  background-image: repeating-linear-gradient(
    45deg,
    ${ Colors.error }44 0,
    ${ Colors.error }44 25%,
    ${ Colors.error }88 0,
    ${ Colors.error }88 50%
  );
  animation: ${ keyframe } 1s linear infinite;
`;

// == fancy fallback ===============================================================================
interface ErrorBoundaryFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

const ErrorBoundaryFallback = (
  { error, resetErrorBoundary }: ErrorBoundaryFallbackProps
): JSX.Element => {
  const save = useSave();

  const [ funnyText ] = useState( funnyTexts[ Math.floor( Math.random() * funnyTexts.length ) ] );

  useEffect(
    () => {
      console.error( error );
    },
    [ error ],
  );

  const handleRetry = useCallback(
    () => resetErrorBoundary(),
    [ resetErrorBoundary ],
  );

  const handleSave = useCallback(
    () => save( { emergencyMode: true } ),
    [ save ]
  );

  return (
    <FallbackRoot>
      <Box
        data-stalker={ funnyText }
      >
        <BiggerOne>Something went wrong</BiggerOne>
        <SmallerOne>See the console for more info</SmallerOne>
      </Box>
      <Buttons>
        <Button as={ Icons.Retry }
          onClick={ handleRetry }
          data-stalker="Retry"
        />
        <Button as={ Icons.Save }
          onClick={ handleSave }
          data-stalker="Emergency Save"
        />
      </Buttons>
    </FallbackRoot>
  );
};

// == main component ===============================================================================
interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

const ErrorBoundary = ( { children }: ErrorBoundaryProps ): JSX.Element => {
  return (
    <ReactErrorBoundary
      FallbackComponent={ ErrorBoundaryFallback }
    >
      { children }
    </ReactErrorBoundary>
  );
};

export { ErrorBoundary };
