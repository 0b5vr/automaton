import { Colors } from '../constants/Colors';
import styled from 'styled-components';

export const InspectorHeader = styled.div`
  color: ${ Colors.accent };
`;

export const InspectorItem = styled.div`
  display: flex;
  justify-content: space-between;
  margin: 0.125em 0;
`;

export const InspectorLabel = styled.div`
  margin: 0.15rem;
  font-size: 0.7rem;
  line-height: 1em;
`;

export const InspectorHr = styled.div`
  margin: 0.25em 0;
  height: 0.125em;
  width: 100%;
  background: ${ Colors.back3 };
`;
