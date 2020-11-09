export declare enum StatusLevel {
    ERROR = 0,
    WARNING = 1,
    INFO = 2
}
export interface Status<TCode extends number> {
    /**
     * Status code of the status.
     */
    code: TCode;
    /**
     * Fatality of the status.
     */
    level: StatusLevel;
    /**
     * Message of the status.
     */
    message?: string;
}
export declare class WithStatus<TCode extends number> {
    private __statusList?;
    /**
     * The most important status of its current status.
     */
    get status(): Status<TCode> | null;
    /**
     * Return a status that matches to the given code, if exist.
     * @param code The code of status you want to get
     */
    getSpecificStatus<T extends TCode>(code: T): Status<T> | null;
    protected __setStatus(status: Status<TCode>): void;
    protected __deleteStatus(code: TCode): void;
    protected __clearStatus(): void;
}
