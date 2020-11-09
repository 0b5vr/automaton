/* eslint-env jest */

import { Status, StatusLevel, WithStatus } from '../Status';

enum StatusCode {
  ZERO,
  ONE,
  TWO,
}

class WithStatusExposed extends WithStatus<StatusCode> {
  public setStatus( status: Status<StatusCode> ): void {
    this.__setStatus( status );
  }

  public deleteStatus( code: StatusCode ): void {
    this.__deleteStatus( code );
  }

  public clearStatus(): void {
    this.__clearStatus();
  }
}

describe( 'WithStatus', () => {
  it( 'must be instantiated correctly', () => {
    const withStatus = new WithStatus<StatusCode>();
    expect( withStatus ).toBeInstanceOf( WithStatus );
  } );

  describe( 'get status', () => {
    let withStatusExposed = new WithStatusExposed();

    beforeEach( () => {
      withStatusExposed = new WithStatusExposed();
    } );

    it( 'must return null when there are no status assigned', () => {
      expect( withStatusExposed.status ).toBeNull();
    } );

    it( 'must return a status when there are one status assigned', () => {
      const status: Status<StatusCode> = {
        code: StatusCode.ZERO,
        level: StatusLevel.INFO,
        message: 'zero'
      };
      withStatusExposed.setStatus( status );
      expect( withStatusExposed.status ).toMatchObject( status );
    } );

    it( 'must return a most important status when there are two or more status assigned', () => {
      const statusInfo: Status<StatusCode> = {
        code: StatusCode.ZERO,
        level: StatusLevel.INFO,
        message: 'zero'
      };
      const statusWarning: Status<StatusCode> = {
        code: StatusCode.ONE,
        level: StatusLevel.WARNING,
        message: 'one'
      };
      const statusError: Status<StatusCode> = {
        code: StatusCode.TWO,
        level: StatusLevel.ERROR,
        message: 'two'
      };
      withStatusExposed.setStatus( statusInfo );
      withStatusExposed.setStatus( statusError );
      withStatusExposed.setStatus( statusWarning );
      expect( withStatusExposed.status ).toMatchObject( statusError );
    } );
  } );

  describe( '__deleteStatus', () => {
    let withStatusExposed = new WithStatusExposed();

    beforeEach( () => {
      withStatusExposed = new WithStatusExposed();
    } );

    it( 'must delete an existing status assigned', () => {
      const statusInfo: Status<StatusCode> = {
        code: StatusCode.ZERO,
        level: StatusLevel.INFO,
        message: 'zero'
      };
      const statusWarning: Status<StatusCode> = {
        code: StatusCode.ONE,
        level: StatusLevel.WARNING,
        message: 'one'
      };
      withStatusExposed.setStatus( statusInfo );
      withStatusExposed.setStatus( statusWarning );
      withStatusExposed.deleteStatus( StatusCode.ONE );
      expect( withStatusExposed.status ).toMatchObject( statusInfo );
    } );
  } );

  describe( '__clearStatus', () => {
    let withStatusExposed = new WithStatusExposed();

    beforeEach( () => {
      withStatusExposed = new WithStatusExposed();
    } );

    it( 'must clear existing statuses assigned', () => {
      const statusInfo: Status<StatusCode> = {
        code: StatusCode.ZERO,
        level: StatusLevel.INFO,
        message: 'zero'
      };
      const statusWarning: Status<StatusCode> = {
        code: StatusCode.ONE,
        level: StatusLevel.WARNING,
        message: 'one'
      };
      withStatusExposed.setStatus( statusInfo );
      withStatusExposed.setStatus( statusWarning );
      withStatusExposed.clearStatus();
      expect( withStatusExposed.status ).toBeNull();
    } );
  } );
} );
