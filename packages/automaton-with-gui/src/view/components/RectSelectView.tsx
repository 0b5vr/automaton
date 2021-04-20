import { Colors } from '../constants/Colors';
import React, { useMemo } from 'react';
import styled from 'styled-components';

// == styles =======================================================================================
const Background = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  background: ${ Colors.accent };
  opacity: 0.2;
`;

const Root = styled.div`
  position: absolute;
  border: solid 1px ${ Colors.accent };
  pointer-events: none;
`;

// == props ========================================================================================
interface Props {
  className?: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

// == component ====================================================================================
const RectSelectView = ( { className, x0, y0, x1, y1 }: Props ): JSX.Element => {
  const style = useMemo(
    () => ( {
      left: x0,
      top: y0,
      width: x1 - x0,
      height: y1 - y0,
    } ),
    [ x0, y0, x1, y1 ],
  );

  return (
    <Root
      className={ className }
      style={ style }
    >
      <Background />
    </Root>
  );
};

export { RectSelectView };
