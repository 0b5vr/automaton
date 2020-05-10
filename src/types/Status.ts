import { jsonCopy } from '../utils/jsonCopy';

export enum StatusLevel {
  ERROR,
  WARNING,
  INFO
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

export class WithStatus<TCode extends number> {
  private __statusList?: Map<TCode, Status<TCode>>;

  /**
   * The most important status of its current status.
   */
  public get status(): Status<TCode> | null {
    if ( !this.__statusList ) {
      this.__statusList = new Map();
    }

    return jsonCopy(
      Array.from( this.__statusList.values() ).sort( ( a, b ) => a.level - b.level )[ 0 ] || null
    );
  }

  /**
   * Return a status that matches to the given code, if exist.
   * @param code The code of status you want to get
   */
  public getSpecificStatus<T extends TCode>( code: T ): Status<T> | null {
    return ( this.__statusList?.get( code ) as ( Status<T> | undefined ) ) ?? null;
  }

  protected __setStatus( status: Status<TCode> ): void {
    if ( !this.__statusList ) {
      this.__statusList = new Map();
    }

    this.__statusList.set( status.code, status );
  }

  protected __deleteStatus( code: TCode ): void {
    if ( !this.__statusList ) {
      this.__statusList = new Map();
    }

    this.__statusList.delete( code );
  }

  protected __clearStatus(): void {
    if ( !this.__statusList ) {
      this.__statusList = new Map();
    }

    this.__statusList.clear();
  }
}
