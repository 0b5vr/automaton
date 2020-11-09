/// <reference types="react" />
declare const ToastyEntry: ({ id, kind, message, closing }: {
    id: string;
    kind: 'error' | 'warning' | 'info';
    message: string;
    closing: boolean;
}) => JSX.Element | null;
export { ToastyEntry };
