export interface FxParam {
  name?: string;
  type: 'float' | 'int' | 'boolean';
  default: any;
  min?: number;
  max?: number;
}

export interface FxContext {
  dt: number;
  v: number;
  vel: number;
  progress: number;
  params: { [ key: string ]: any };
}

export interface FxDefinition {
  name?: string;
  description?: string;
  params: { [ key: string ]: FxParam };
  func: ( context: FxContext ) => number;
}
