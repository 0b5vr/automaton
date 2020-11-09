/// <reference types="react" />
import { Status } from '../../types/Status';
declare const StatusIcon: ({ className, status }: {
    className?: string | undefined;
    status: Status<any> | null;
}) => JSX.Element | null;
export { StatusIcon };
