import type { FxDefinition } from './FxDefinition';

export interface AutomatonOptions {
  fxDefinitions?: { [ name: string ]: FxDefinition };
}
