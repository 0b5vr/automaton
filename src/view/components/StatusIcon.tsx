import { Status, StatusLevel } from '../../types/Status';
import { Icons } from '../icons/Icons';
import React from 'react';
import styled from 'styled-components';

// == styles =======================================================================================
const Icon = styled.img`
  position: absolute;
  right: 1px;
  bottom: 1px;
  height: 16px;
`;

// == component ====================================================================================
const StatusIcon = ( { className, status }: {
  className?: string;
  status: Status<any> | null;
} ): JSX.Element | null => {
  // null status icon for null status
  if ( status == null ) { return null; }

  return (
    <Icon
      as={
        status.level === StatusLevel.ERROR ? Icons.Error :
        status.level === StatusLevel.WARNING ? Icons.Warning :
        Icons.Info
      }
      className={ className }
      data-stalker={ status.message }
    />
  );
};

export { StatusIcon };
