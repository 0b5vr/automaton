export interface ToastyParams {
  kind: 'error' | 'warning' | 'info';
  message: string;
  timeout?: number;
}
