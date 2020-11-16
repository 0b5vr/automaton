export interface FxParam {
  name?: string;
  type: 'float' | 'int' | 'boolean';
  default: any;
  min?: number;
  max?: number;
}
